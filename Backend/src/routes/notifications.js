const express = require('express');

const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// Get current user's notifications
router.get('/', auth(), async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    readAt: null
  });

  res.json({ notifications, unreadCount });
});

// Mark a notification read
router.post('/:id/read', auth(), async (req, res) => {
  const { id } = req.params;
  const n = await Notification.findOne({ _id: id, user: req.user._id });
  if (!n) return res.status(404).json({ message: 'Notification not found' });

  if (!n.readAt) n.readAt = new Date();
  await n.save();

  res.json({ ok: true });
});

// Mark all notifications read
router.post('/read-all', auth(), async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, readAt: null },
    { $set: { readAt: new Date() } }
  );
  res.json({ ok: true });
});

module.exports = router;
