const express = require('express');
const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const { isTeamMember } = require('../utils/teamAccess');

const router = express.Router();

router.use(protect);

// task.assignedTo may be a raw ObjectId OR a populated user document -
// always resolve to a plain id string before comparing (see the identical
// fix and explanation in routes/tasks.js).
const canAccessTask = async (req, task) => {
  if (req.user.role === 'admin') return true;
  const assignedToId = String(task.assignedTo?._id ?? task.assignedTo ?? '');
  if (assignedToId === String(req.user._id)) return true;
  if (req.user.role === 'manager') return isTeamMember(req.user._id, assignedToId);
  return false;
};

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const taskPopulate = {
  path: 'task',
  select: 'title project assignedTo',
  populate: { path: 'project', select: 'name' },
};

// @route   GET /api/time-entries/active
// @desc    The current user's currently-running timer, if any.
router.get('/active', async (req, res) => {
  try {
    const entry = await TimeEntry.findOne({ user: req.user._id, endTime: null }).populate(taskPopulate);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch active timer', error: err.message });
  }
});

// @route   GET /api/time-entries?task=<id>
// @desc    List time entries for a task. Employees only see their own entries.
router.get('/', async (req, res) => {
  try {
    const { task: taskId } = req.query;
    if (!taskId) return res.status(400).json({ message: 'task query parameter is required' });

    const task = await Task.findById(taskId).select('assignedTo');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await canAccessTask(req, task))) {
      return res.status(403).json({ message: 'You do not have access to this task' });
    }

    const filter = { task: taskId };
    if (req.user.role === 'employee') filter.user = req.user._id;

    const entries = await TimeEntry.find(filter).populate('user', 'name').sort({ startTime: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch time entries', error: err.message });
  }
});

// @route   POST /api/time-entries/start
// @desc    Start a new timer for a task. Fails if the user already has one running.
router.post('/start', async (req, res) => {
  try {
    const { taskId, note } = req.body;
    if (!taskId) return res.status(400).json({ message: 'taskId is required' });

    const task = await Task.findById(taskId).select('assignedTo title');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!(await canAccessTask(req, task))) {
      return res.status(403).json({ message: 'You do not have access to this task' });
    }

    const existing = await TimeEntry.findOne({ user: req.user._id, endTime: null }).populate('task', 'title');
    if (existing) {
      return res.status(409).json({
        message: `You already have a timer running on "${existing.task?.title || 'another task'}". Stop it before starting a new one.`,
      });
    }

    const entry = await TimeEntry.create({
      task: taskId,
      user: req.user._id,
      startTime: new Date(),
      note: note || '',
    });

    const populated = await entry.populate(taskPopulate);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to start timer', error: err.message });
  }
});

// @route   PATCH /api/time-entries/:id/stop
// @desc    Stop a running timer and record its duration. Owner only.
router.patch('/:id/stop', async (req, res) => {
  try {
    const entry = await TimeEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Time entry not found' });
    if (String(entry.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only stop your own timer' });
    }
    if (entry.endTime) {
      return res.status(400).json({ message: 'This timer is already stopped' });
    }

    entry.endTime = new Date();
    entry.durationSeconds = Math.max(0, Math.round((entry.endTime - entry.startTime) / 1000));
    if (req.body.note !== undefined) entry.note = req.body.note;
    await entry.save();

    try {
      await Activity.create({
        task: entry.task,
        user: req.user._id,
        type: 'updated',
        message: `logged ${formatDuration(entry.durationSeconds)} on this task`,
      });
    } catch (logErr) {
      console.error('Failed to log time-tracking activity:', logErr.message);
    }

    const populated = await entry.populate(taskPopulate);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to stop timer', error: err.message });
  }
});

// @route   DELETE /api/time-entries/:id
// @desc    Delete a time entry. Owner or admin only.
router.delete('/:id', async (req, res) => {
  try {
    const entry = await TimeEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Time entry not found' });
    if (req.user.role !== 'admin' && String(entry.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own time entries' });
    }
    await entry.deleteOne();
    res.json({ message: 'Time entry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete time entry', error: err.message });
  }
});

// @route   GET /api/time-entries/summary/by-employee
// @desc    Total logged seconds per employee, all-time. Admin only.
router.get('/summary/by-employee', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  try {
    const agg = await TimeEntry.aggregate([
      { $match: { endTime: { $ne: null } } },
      { $group: { _id: '$user', totalSeconds: { $sum: '$durationSeconds' } } },
    ]);
    res.json(agg);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch time summary', error: err.message });
  }
});

module.exports = router;
