const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Submit feedback (Recipient only)
router.post('/', verifyToken, async (req, res) => {
  const { donation_id, rating, hygiene_rating, comment } = req.body;

  if (!donation_id || rating === undefined || hygiene_rating === undefined) {
    return res.status(400).json({ message: 'donation_id, rating, and hygiene_rating are required.' });
  }

  if (req.user.role !== 'recipient') {
    return res.status(403).json({ message: 'Only recipients (NGOs) can leave feedback on donations.' });
  }

  try {
    // 1. Verify donation was claimed by this recipient and is delivered
    const [claims] = await db.query(
      `SELECT c.id, d.donor_id 
       FROM claims c 
       INNER JOIN donations d ON c.donation_id = d.id 
       WHERE c.donation_id = ? AND c.recipient_id = ? AND c.status = 'delivered'`,
      [donation_id, req.user.id]
    );

    if (claims.length === 0) {
      return res.status(400).json({ message: 'You can only leave feedback for donations that you claimed and were marked as delivered.' });
    }

    const donorId = claims[0].donor_id;

    // Check if feedback already exists
    const [existing] = await db.query(
      'SELECT id FROM feedback WHERE donation_id = ? AND recipient_id = ?', 
      [donation_id, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already submitted feedback for this donation.' });
    }

    // 2. Insert feedback record
    await db.query(
      `INSERT INTO feedback (donation_id, recipient_id, donor_id, rating, hygiene_rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [donation_id, req.user.id, donorId, parseInt(rating, 10), parseInt(hygiene_rating, 10), comment || null]
    );

    res.status(201).json({ message: 'Feedback submitted successfully.' });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Get feedback for a specific donor
router.get('/donor/:donorId', async (req, res) => {
  const { donorId } = req.params;

  try {
    const [feedbacks] = await db.query(
      `SELECT f.*, u.organization_name as reviewer_organization, u.full_name as reviewer_name
       FROM feedback f
       LEFT JOIN users u ON f.recipient_id = u.id
       WHERE f.donor_id = ?
       ORDER BY f.created_at DESC`,
      [donorId]
    );

    // Calculate averages
    const [averages] = await db.query(
      `SELECT AVG(rating) as avg_rating, AVG(hygiene_rating) as avg_hygiene_rating, COUNT(*) as feedback_count
       FROM feedback
       WHERE donor_id = ?`,
      [donorId]
    );

    res.json({
      summary: {
        average_rating: averages[0].avg_rating ? parseFloat(averages[0].avg_rating).toFixed(1) : "0.0",
        average_hygiene_rating: averages[0].avg_hygiene_rating ? parseFloat(averages[0].avg_hygiene_rating).toFixed(1) : "0.0",
        total_reviews: averages[0].feedback_count
      },
      reviews: feedbacks
    });
  } catch (error) {
    console.error('Fetch donor feedback error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
