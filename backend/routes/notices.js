const express = require('express');
const Notice = require('../models/Notice');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   GET /api/notices
// @desc    List all notices, pinned first then newest first. Visible to everyone.
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('createdBy', 'name role')
      .sort({ pinned: -1, createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notices', error: err.message });
  }
});

// @route   POST /api/notices
// @desc    Post a new notice. Admin or manager only.
router.post('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { title, message, priority, pinned } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const notice = await Notice.create({
      title,
      message,
      priority: Notice.PRIORITY_VALUES.includes(priority) ? priority : 'normal',
      pinned: Boolean(pinned),
      createdBy: req.user._id,
    });

    const populated = await notice.populate('createdBy', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post notice', error: err.message });
  }
});

// @route   DELETE /api/notices/:id
// @desc    Delete a notice. Admin can delete any notice; a manager can only
//          delete notices they posted themselves.
router.delete('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });

    if (req.user.role !== 'admin' && String(notice.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete notices you posted' });
    }

    await notice.deleteOne();
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notice', error: err.message });
  }
});

module.exports = router;
