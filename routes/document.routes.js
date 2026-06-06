const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Upload verification document (Recipient/NGO only)
router.post('/upload', verifyToken, verifyRole('recipient'), upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded. Please upload a document.' });
  }

  const documentName = req.body.document_name || req.file.originalname;
  const documentUrl = 'uploads/docs/' + req.file.filename;

  try {
    const [result] = await db.query(
      'INSERT INTO verification_documents (user_id, document_name, document_url) VALUES (?, ?, ?)',
      [req.user.id, documentName, documentUrl]
    );

    res.status(201).json({
      message: 'Verification document uploaded successfully.',
      documentId: result.insertId,
      document_name: documentName,
      document_url: documentUrl
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Fetch all verification documents (Admin only)
router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const [docs] = await db.query(
      `SELECT vd.*, u.full_name, u.email, u.organization_name, u.verification_status 
       FROM verification_documents vd
       LEFT JOIN users u ON vd.user_id = u.id
       ORDER BY vd.uploaded_at DESC`
    );
    res.json(docs);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Verify/approve/reject a user (Admin only)
router.put('/verify-user/:userId', verifyToken, verifyRole('admin'), async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid verification status. Must be approved, rejected, or pending.' });
  }

  try {
    const [existing] = await db.query('SELECT role, email FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.query('UPDATE users SET verification_status = ? WHERE id = ?', [status, userId]);

    // Notify user
    const notifMsg = `Your account verification status has been updated to "${status.toUpperCase()}" by the administrator.`;
    await db.query(
      'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, FALSE)',
      [userId, 'Account Verification Update', notifMsg]
    );

    res.json({ message: `User verification status updated to ${status}.` });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
