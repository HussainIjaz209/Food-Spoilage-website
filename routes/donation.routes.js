const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create Donation (Donor only)
// Supports uploading a single main image using field 'image' and optionally multiple secondary images using field 'images'
router.post('/', verifyToken, verifyRole('donor'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]), async (req, res) => {
  const { 
    title, 
    description, 
    category_id, 
    food_type, 
    quantity, 
    expiry_time, 
    pickup_address, 
    city, 
    latitude, 
    longitude 
  } = req.body;

  if (!title || !category_id || !food_type || !quantity || !expiry_time) {
    return res.status(400).json({ message: 'Missing required fields: title, category_id, food_type, quantity, expiry_time' });
  }

  // Get main image path
  let mainImageUrl = null;
  if (req.files && req.files['image']) {
    mainImageUrl = 'uploads/' + req.files['image'][0].filename;
  }

  try {
    // Insert donation listing
    const [result] = await db.query(
      `INSERT INTO donations (donor_id, title, description, category_id, food_type, quantity, expiry_time, pickup_address, city, latitude, longitude, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [
        req.user.id,
        title,
        description || null,
        category_id ? parseInt(category_id, 10) : null,
        food_type,
        quantity,
        expiry_time,
        pickup_address || null,
        city || null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        mainImageUrl
      ]
    );

    const donationId = result.insertId;

    // Insert additional images if uploaded
    if (req.files && req.files['images']) {
      const imgQueries = req.files['images'].map(file => {
        return db.query('INSERT INTO donation_images (donation_id, image_url) VALUES (?, ?)', [donationId, 'uploads/' + file.filename]);
      });
      await Promise.all(imgQueries);
    }

    // Trigger Notification Engine: Find recipients in the same city or within a geographic area (15km)
    const [recipients] = await db.query('SELECT id, full_name FROM users WHERE role = "recipient" AND city = ?', [city]);
    
    let nearbyRecipients = recipients;
    if (latitude && longitude) {
      const [gpsRecipients] = await db.query(
        `SELECT id, full_name, 
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance 
         FROM users 
         WHERE role = 'recipient' AND latitude IS NOT NULL AND longitude IS NOT NULL
         HAVING distance <= 15`,
         [parseFloat(latitude), parseFloat(longitude), parseFloat(latitude)]
      );
      
      const allRecipientsMap = new Map();
      recipients.forEach(r => allRecipientsMap.set(r.id, r));
      gpsRecipients.forEach(r => allRecipientsMap.set(r.id, r));
      nearbyRecipients = Array.from(allRecipientsMap.values());
    }

    // Insert notifications
    if (nearbyRecipients.length > 0) {
      const notifMessage = `New food donation listed near you: "${title}" in ${city}. Claim it before it expires!`;
      const notifQueries = nearbyRecipients.map(recipient => {
        return db.query('INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, FALSE)', 
          [recipient.id, 'New Food Donation Available', notifMessage]);
      });
      await Promise.all(notifQueries);
    }

    // Impact metrics calculation: Total food items donated by this donor
    const [donorStats] = await db.query('SELECT COUNT(*) as total_donations FROM donations WHERE donor_id = ?', [req.user.id]);

    res.status(201).json({
      message: 'Donation listing created successfully.',
      donationId,
      impactMetrics: {
        total_donations: donorStats[0].total_donations,
        message: `${donorStats[0].total_donations} donation listings submitted so far!`
      }
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Get all donations (supports filters and proximity searches)
router.get('/', async (req, res) => {
  const { status, city, category_id, food_type, latitude, longitude, radius } = req.query;

  let queryStr = `
    SELECT d.*, c.category_name, u.organization_name as donor_name, u.phone as donor_phone
    FROM donations d
    LEFT JOIN food_categories c ON d.category_id = c.id
    LEFT JOIN users u ON d.donor_id = u.id
    WHERE 1=1
  `;
  const queryParams = [];

  // Filter by status (default to 'available')
  if (status) {
    queryStr += ' AND d.status = ?';
    queryParams.push(status);
  } else {
    queryStr += ' AND d.status = "available"';
  }

  // Filter by city
  if (city) {
    queryStr += ' AND d.city = ?';
    queryParams.push(city);
  }

  // Filter by category
  if (category_id) {
    queryStr += ' AND d.category_id = ?';
    queryParams.push(parseInt(category_id, 10));
  }

  // Filter by food type
  if (food_type) {
    queryStr += ' AND d.food_type = ?';
    queryParams.push(food_type);
  }

  // Proximity Search (Haversine Formula)
  if (latitude && longitude) {
    const r = radius ? parseFloat(radius) : 15; // default 15km
    queryStr = `
      SELECT d.*, c.category_name, u.organization_name as donor_name, u.phone as donor_phone,
             (6371 * acos(cos(radians(?)) * cos(radians(d.latitude)) * cos(radians(d.longitude) - radians(?)) + sin(radians(?)) * sin(radians(d.latitude)))) AS distance
      FROM donations d
      LEFT JOIN food_categories c ON d.category_id = c.id
      LEFT JOIN users u ON d.donor_id = u.id
      WHERE d.status = ?
    `;
    queryParams.unshift(parseFloat(latitude), parseFloat(longitude), parseFloat(latitude));
    
    if (status) {
      queryParams.push(status);
    } else {
      queryParams.push('available');
    }
    
    if (city) {
      queryStr += ' AND d.city = ?';
      queryParams.push(city);
    }
    if (category_id) {
      queryStr += ' AND d.category_id = ?';
      queryParams.push(parseInt(category_id, 10));
    }
    if (food_type) {
      queryStr += ' AND d.food_type = ?';
      queryParams.push(food_type);
    }

    queryStr += ' HAVING distance <= ? ORDER BY distance ASC';
    queryParams.push(r);
  } else {
    queryStr += ' ORDER BY d.created_at DESC';
  }

  try {
    const [donations] = await db.query(queryStr, queryParams);
    res.json(donations);
  } catch (error) {
    console.error('Fetch donations error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Get single donation by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [donations] = await db.query(
      `SELECT d.*, c.category_name, u.organization_name as donor_name, u.phone as donor_phone, u.email as donor_email
       FROM donations d
       LEFT JOIN food_categories c ON d.category_id = c.id
       LEFT JOIN users u ON d.donor_id = u.id
       WHERE d.id = ?`,
      [id]
    );

    if (donations.length === 0) {
      return res.status(404).json({ message: 'Donation listing not found.' });
    }

    // Fetch extra images
    const [images] = await db.query('SELECT image_url FROM donation_images WHERE donation_id = ?', [id]);
    const donation = donations[0];
    donation.additional_images = images.map(img => img.image_url);

    res.json(donation);
  } catch (error) {
    console.error('Fetch donation details error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Update donation (Donor owner only)
router.put('/:id', verifyToken, verifyRole('donor'), async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    category_id, 
    food_type, 
    quantity, 
    expiry_time, 
    pickup_address, 
    city, 
    latitude, 
    longitude 
  } = req.body;

  try {
    const [existing] = await db.query('SELECT donor_id FROM donations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Donation listing not found.' });
    }
    if (existing[0].donor_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this listing.' });
    }

    await db.query(
      `UPDATE donations 
       SET title = ?, description = ?, category_id = ?, food_type = ?, quantity = ?, expiry_time = ?, pickup_address = ?, city = ?, latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        title,
        description || null,
        category_id ? parseInt(category_id, 10) : null,
        food_type,
        quantity,
        expiry_time,
        pickup_address || null,
        city || null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        id
      ]
    );

    res.json({ message: 'Donation listing updated successfully.' });
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Update donation status
router.put('/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['available', 'claimed', 'picked_up', 'delivered', 'expired'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    const [existing] = await db.query('SELECT donor_id, status FROM donations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Donation listing not found.' });
    }

    let authorized = false;

    if (req.user.role === 'admin') {
      authorized = true;
    } else if (req.user.role === 'donor' && existing[0].donor_id === req.user.id) {
      authorized = true;
    } else if (req.user.role === 'recipient') {
      const [claim] = await db.query('SELECT id FROM claims WHERE donation_id = ? AND recipient_id = ?', [id, req.user.id]);
      if (claim.length > 0) {
        authorized = true;
      }
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Unauthorized to change the status of this listing.' });
    }

    await db.query('UPDATE donations SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Donation status updated to ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
