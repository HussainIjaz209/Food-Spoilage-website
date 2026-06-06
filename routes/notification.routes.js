const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get notifications for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check ownership
    const [existing] = await db.query('SELECT user_id FROM notifications WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. This notification belongs to another user.' });
    }

    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
