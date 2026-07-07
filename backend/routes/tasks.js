const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { runDeadlineReminderJob } = require('../jobs/deadlineReminderJob');

const router = express.Router();

router.use(protect);

// Scopes the task query to the requester: admins see everything,
// employees only ever see tasks assigned to them.
const scopeToUser = (req) => {
  if (req.user.role === 'admin') return {};
  return { assignedTo: req.user._id };
};

// @route   GET /api/tasks
// @desc    List tasks. Admins see all, employees see only their own.
//          Supports optional ?status=, ?assignedTo=, ?projectName= filters.
router.get('/', async (req, res) => {
  try {
    const filter = scopeToUser(req);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo && req.user.role === 'admin') filter.assignedTo = req.query.assignedTo;
    if (req.query.projectName) filter.projectName = new RegExp(req.query.projectName, 'i');

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email')
      .sort({ deadline: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
});

// @route   GET /api/tasks/stats
// @desc    Counts of tasks per status, scoped to the requester
router.get('/stats', async (req, res) => {
  try {
    const filter = scopeToUser(req);
    const statuses = Task.STATUS_VALUES;

    const counts = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = statuses.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    counts.forEach((c) => {
      result[c._id] = c.count;
    });
    result.total = Object.values(result).reduce((a, b) => a + b, 0);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
});

// @route   POST /api/tasks/reminders/send-now
// @desc    Manually run the daily deadline reminder job right now (for testing). Admin only.
router.post('/reminders/send-now', authorize('admin'), async (req, res) => {
  try {
    const results = await runDeadlineReminderJob();
    res.json({ message: 'Reminder job executed', results });
  } catch (err) {
    res.status(500).json({ message: 'Failed to run reminder job', error: err.message });
  }
});

// @route   GET /api/tasks/stats/by-employee
// @desc    Per-employee breakdown: distinct project count + count per status. Admin only.
router.get('/stats/by-employee', authorize('admin'), async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('name email department').sort({ name: 1 });

    const statusAgg = await Task.aggregate([
      { $group: { _id: { employee: '$assignedTo', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const projectAgg = await Task.aggregate([
      {
        $group: {
          _id: '$assignedTo',
          projects: { $addToSet: '$projectName' },
          total: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {};
    statusAgg.forEach((row) => {
      const empId = String(row._id.employee);
      if (!statusMap[empId]) statusMap[empId] = {};
      statusMap[empId][row._id.status] = row.count;
    });

    const projectMap = {};
    projectAgg.forEach((row) => {
      projectMap[String(row._id)] = { projectCount: row.projects.length, total: row.total };
    });

    const result = employees.map((emp) => {
      const id = String(emp._id);
      const statuses = statusMap[id] || {};
      const proj = projectMap[id] || { projectCount: 0, total: 0 };
      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        projects: proj.projectCount,
        total: proj.total,
        todo: statuses.todo || 0,
        'in-progress': statuses['in-progress'] || 0,
        hold: statuses.hold || 0,
        delivered: statuses.delivered || 0,
        cancelled: statuses.cancelled || 0,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch employee stats', error: err.message });
  }
});

// @route   GET /api/tasks/deadlines/upcoming
// @desc    Tasks with 3 or fewer days remaining until deadline (not yet delivered/cancelled)
router.get('/deadlines/upcoming', async (req, res) => {
  try {
    const filter = scopeToUser(req);
    const now = new Date();
    const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    filter.deadline = { $lte: threeDaysOut };
    filter.status = { $nin: ['delivered', 'cancelled'] };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email department')
      .sort({ deadline: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch upcoming deadlines', error: err.message });
  }
});

// @route   GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && String(task.assignedTo._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You do not have access to this task' });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task', error: err.message });
  }
});

// @route   POST /api/tasks
// @desc    Create and assign a task to an employee. Admin only.
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { title, description, projectName, priority, deadline, assignedTo, status } = req.body;

    if (!title || !projectName || !deadline || !assignedTo) {
      return res.status(400).json({
        message: 'title, projectName, deadline and assignedTo are required',
      });
    }

    const task = await Task.create({
      title,
      description,
      projectName,
      priority,
      deadline,
      assignedTo,
      status: status || 'todo',
      createdBy: req.user._id,
      statusHistory: [{ status: status || 'todo', changedBy: req.user._id }],
    });

    const populated = await task.populate('assignedTo', 'name email department');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Full update of a task's details (title, project, deadline, assignment, etc). Admin only.
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { title, description, projectName, priority, deadline, assignedTo, status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (projectName !== undefined) task.projectName = projectName;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status !== undefined && status !== task.status) {
      task.status = status;
      task.statusHistory.push({ status, changedBy: req.user._id });
    }

    await task.save();
    const populated = await task.populate('assignedTo', 'name email department');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
});

// @route   PATCH /api/tasks/:id/status
// @desc    Update only the status of a task. Admin can update any task,
//          employees can only update the status of tasks assigned to them.
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!Task.STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${Task.STATUS_VALUES.join(', ')}` });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you' });
    }

    task.status = status;
    task.statusHistory.push({ status, changedBy: req.user._id });
    await task.save();

    const populated = await task.populate('assignedTo', 'name email department');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task status', error: err.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task. Admin only.
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
});

module.exports = router;
