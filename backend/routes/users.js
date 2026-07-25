const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');
const { escapeRegex } = require('../utils/escapeRegex');
const { canCreateRole, canChangePassword, canChangeAdminRole, canDeleteUser } = require('../utils/userPermissions');

const router = express.Router();

router.use(protect);

// @route   GET /api/users
// @desc    List users (optionally filter by role).
//          Admins see everyone. Managers only see their own team (the
//          employees whose `manager` field points at them) - this is what
//          powers the "assign to" dropdown when a manager creates a task.
//          Plain employees have no use for this endpoint.
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ message: 'You do not have access to the team list' });
    }

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.user.role === 'manager') {
      filter.manager = req.user._id;
    }
    if (req.query.search) {
      const re = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users.map((u) => u.toSafeObject()));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// @route   POST /api/users
// @desc    Create a new admin, manager, or employee account. Admin only.
//          Creating an admin account is restricted to the main admin.
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, manager } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const resolvedRole = ['admin', 'manager', 'employee'].includes(role) ? role : 'employee';

    if (!canCreateRole(req.user, resolvedRole)) {
      return res.status(403).json({ message: 'Only the main admin can create admin accounts' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: resolvedRole,
      department: department || '',
      manager: resolvedRole === 'employee' ? manager || null : null,
    });

    res.status(201).json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user's info (name, email, role, manager, department, active status, password). Admin only.
//          Only the main admin can change another admin's password, promote
//          someone to admin, or transfer the main admin flag.
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, department, manager, isActive, password, isMainAdmin } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (password && !canChangePassword(req.user, user)) {
      return res.status(403).json({ message: "Only the main admin can change another admin's password" });
    }

    if (role !== undefined && !canChangeAdminRole(req.user, user.role, role)) {
      return res.status(403).json({ message: 'Only the main admin can change a user into or out of the admin role' });
    }

    // The main admin flag can only move via an explicit, deliberate transfer:
    // the main admin hands it to another admin, which demotes themself in
    // the same step. This keeps exactly one main admin at all times.
    if (isMainAdmin === true) {
      if (!req.user.isMainAdmin) {
        return res.status(403).json({ message: 'Only the main admin can transfer main admin status' });
      }
      if (user.role !== 'admin' && role !== 'admin') {
        return res.status(400).json({ message: 'Main admin status can only be granted to an admin' });
      }
      if (String(user._id) !== String(req.user._id)) {
        await User.updateOne({ _id: req.user._id }, { isMainAdmin: false });
      }
      user.isMainAdmin = true;
    }

    if (user.isMainAdmin && role !== undefined && role !== 'admin') {
      return res.status(400).json({ message: 'Transfer main admin status to another admin before changing this account\'s role' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (role !== undefined && ['admin', 'manager', 'employee'].includes(role)) user.role = role;
    if (department !== undefined) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // pre-save hook will hash it

    // Only employees report to a manager; clear it out for anyone else.
    if (manager !== undefined) user.manager = user.role === 'employee' ? manager || null : null;
    if (user.role !== 'employee') user.manager = null;

    await user.save();
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user. Admin only. Only the main admin can delete another
//          admin account (and the main admin account itself can never be
//          deleted). Blocked if the target still has assigned tasks, or (for
//          managers) still has employees reporting to them.
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      // Already gone - e.g. a retried request after a dropped connection, or
      // deleted from another tab. The end state the caller wants (this user
      // no longer existing) is already true, so this is a success, not an
      // error.
      return res.json({ message: 'User already deleted' });
    }

    if (!canDeleteUser(req.user, user)) {
      return res.status(403).json({
        message: user.isMainAdmin
          ? 'The main admin account cannot be deleted'
          : 'Only the main admin can delete another admin account',
      });
    }

    const assignedCount = await Task.countDocuments({ assignedTo: req.params.id });
    if (assignedCount > 0) {
      return res.status(409).json({
        message: `This user has ${assignedCount} task(s) assigned. Reassign or delete those tasks first.`,
      });
    }

    const reportCount = await User.countDocuments({ manager: req.params.id });
    if (reportCount > 0) {
      return res.status(409).json({
        message: `This user has ${reportCount} employee(s) reporting to them. Reassign those employees to a different manager first.`,
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

module.exports = router;
