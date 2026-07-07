const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below require a logged-in admin
router.use(protect, authorize('admin'));

// @route   GET /api/users
// @desc    List all users (optionally filter by role)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users.map((u) => u.toSafeObject()));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// @route   POST /api/users
// @desc    Create a new admin or employee account
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'employee',
      department: department || '',
    });

    res.status(201).json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user's info (name, email, role, department, active status, password)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, department, isActive, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (role !== undefined) user.role = role === 'admin' ? 'admin' : 'employee';
    if (department !== undefined) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // pre-save hook will hash it

    await user.save();
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user. Prevents deleting a user who still has assigned tasks.
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const assignedCount = await Task.countDocuments({ assignedTo: req.params.id });
    if (assignedCount > 0) {
      return res.status(409).json({
        message: `This user has ${assignedCount} task(s) assigned. Reassign or delete those tasks first.`,
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

module.exports = router;
