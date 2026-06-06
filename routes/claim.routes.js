const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Claim a donation (Recipient only)
router.post('/', verifyToken, async (req, res) => {
  const { donation_id } = req.body;

  if (!donation_id) {
    return res.status(400).json({ message: 'donation_id is required.' });
  }

  if (req.user.role !== 'recipient') {
    return res.status(403).json({ message: 'Only Recipients (NGOs/Shelters) can claim food donations.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check recipient verification status
    const [users] = await conn.query('SELECT verification_status, organization_name FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0 || users[0].verification_status !== 'approved') {
      await conn.rollback();
      return res.status(403).json({ message: 'Your NGO account must be approved before claiming food donations.' });
    }

    const orgName = users[0].organization_name || req.user.name;

    // 2. Check if donation is available
    const [donations] = await conn.query('SELECT status, donor_id, title FROM donations WHERE id = ? FOR UPDATE', [donation_id]);
    if (donations.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Donation listing not found.' });
    }

    if (donations[0].status !== 'available') {
      await conn.rollback();
      return res.status(400).json({ message: `This donation is no longer available (current status: ${donations[0].status}).` });
    }

    const donorId = donations[0].donor_id;
    const donationTitle = donations[0].title;

    // 3. Create claim record
    const [result] = await conn.query(
      `INSERT INTO claims (donation_id, recipient_id, claim_time, status)
       VALUES (?, ?, NOW(), 'pending')`,
      [donation_id, req.user.id]
    );

    // 4. Update donation status
    await conn.query('UPDATE donations SET status = "claimed" WHERE id = ?', [donation_id]);

    // 5. Notify the Donor
    const donorMsg = `Your donation "${donationTitle}" has been claimed by "${orgName}". Please review their request.`;
    await conn.query(
      'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, FALSE)', 
      [donorId, 'Donation Claimed', donorMsg]
    );

    await conn.commit();
    res.status(201).json({
      message: 'Donation claimed successfully.',
      claimId: result.insertId
    });
  } catch (error) {
    await conn.rollback();
    console.error('Claim error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  } finally {
    conn.release();
  }
});

// Get claims
router.get('/', verifyToken, async (req, res) => {
  let queryStr = '';
  let queryParams = [];

  if (req.user.role === 'admin') {
    queryStr = `
      SELECT c.*, d.title as donation_title, d.status as donation_status,
             u_don.organization_name as donor_name, u_rec.organization_name as recipient_name
      FROM claims c
      LEFT JOIN donations d ON c.donation_id = d.id
      LEFT JOIN users u_don ON d.donor_id = u_don.id
      LEFT JOIN users u_rec ON c.recipient_id = u_rec.id
      ORDER BY c.claim_time DESC
    `;
  } else if (req.user.role === 'donor') {
    queryStr = `
      SELECT c.*, d.title as donation_title, d.status as donation_status,
             u_rec.organization_name as recipient_name, u_rec.phone as recipient_phone
      FROM claims c
      LEFT JOIN donations d ON c.donation_id = d.id
      LEFT JOIN users u_rec ON c.recipient_id = u_rec.id
      WHERE d.donor_id = ?
      ORDER BY c.claim_time DESC
    `;
    queryParams.push(req.user.id);
  } else if (req.user.role === 'recipient') {
    queryStr = `
      SELECT c.*, d.title as donation_title, d.status as donation_status,
             u_don.organization_name as donor_name, u_don.phone as donor_phone
      FROM claims c
      LEFT JOIN donations d ON c.donation_id = d.id
      LEFT JOIN users u_don ON d.donor_id = u_don.id
      WHERE c.recipient_id = ?
      ORDER BY c.claim_time DESC
    `;
    queryParams.push(req.user.id);
  }

  try {
    const [claims] = await db.query(queryStr, queryParams);
    res.json(claims);
  } catch (error) {
    console.error('Fetch claims error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Update claim status
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'picked_up', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid claim status.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Fetch claim and donation details
    const [claims] = await conn.query(
      `SELECT c.*, d.donor_id, d.title as donation_title, d.status as donation_status
       FROM claims c
       LEFT JOIN donations d ON c.donation_id = d.id
       WHERE c.id = ? FOR UPDATE`,
      [id]
    );

    if (claims.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Claim not found.' });
    }

    const claim = claims[0];
    const donorId = claim.donor_id;
    const recipientId = claim.recipient_id;
    const donationId = claim.donation_id;
    const donationTitle = claim.donation_title;

    // 2. Access control
    let authorized = false;
    if (req.user.role === 'admin') authorized = true;
    else if (req.user.role === 'donor' && donorId === req.user.id) authorized = true;
    else if (req.user.role === 'recipient' && recipientId === req.user.id && status === 'cancelled') authorized = true;

    if (!authorized) {
      await conn.rollback();
      return res.status(403).json({ message: 'Unauthorized to change this claim status.' });
    }

    // 3. Update claim entry
    let updateFields = 'status = ?';
    let updateParams = [status];

    if (status === 'picked_up') {
      updateFields += ', pickup_time = NOW()';
    } else if (status === 'delivered') {
      updateFields += ', delivery_time = NOW()';
    }

    updateParams.push(id);
    await conn.query(`UPDATE claims SET ${updateFields} WHERE id = ?`, updateParams);

    // 4. Update parent donation status
    let syncDonationStatus = 'claimed';
    if (status === 'cancelled') {
      syncDonationStatus = 'available';
    } else if (status === 'picked_up') {
      syncDonationStatus = 'picked_up';
    } else if (status === 'delivered') {
      syncDonationStatus = 'delivered';
    }
    await conn.query('UPDATE donations SET status = ? WHERE id = ?', [syncDonationStatus, donationId]);

    // 5. Send notifications
    if (status === 'cancelled') {
      await conn.query(
        'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, FALSE)',
        [donorId, 'Claim Cancelled', `The claim on your donation "${donationTitle}" has been cancelled.`]
      );
    } else if (status === 'approved') {
      await conn.query(
        'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, FALSE)',
        [recipientId, 'Claim Approved', `Your claim for "${donationTitle}" has been approved. You can now collect the food.`]
      );
    } else if (status === 'delivered') {
      await conn.query(
        'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, FALSE)',
        [donorId, 'Donation Delivered', `Your donation "${donationTitle}" has been successfully delivered.`]
      );
      await conn.query(
        'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, FALSE)',
        [recipientId, 'Donation Delivered', `Your claim for "${donationTitle}" has been marked as delivered.`]
      );
    }

    await conn.commit();
    res.json({ message: `Claim status updated to ${status}.` });
  } catch (error) {
    await conn.rollback();
    console.error('Update claim error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
