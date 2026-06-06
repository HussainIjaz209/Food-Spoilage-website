const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

// Register
router.post('/register', async (req, res) => {
  const { 
    full_name, 
    email, 
    password, 
    phone, 
    role, 
    organization_name, 
    address, 
    city, 
    latitude, 
    longitude 
  } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields: full_name, email, password, role' });
  }

  if (!['donor', 'recipient', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be donor, recipient, or admin.' });
  }

  try {
    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Admin is auto-approved, others start as pending
    const verificationStatus = role === 'admin' ? 'approved' : 'pending';

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password, phone, role, organization_name, address, city, latitude, longitude, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name, 
        email, 
        passwordHash, 
        phone || null, 
        role, 
        organization_name || null, 
        address || null, 
        city || null, 
        latitude ? parseFloat(latitude) : null, 
        longitude ? parseFloat(longitude) : null, 
        verificationStatus
      ]
    );

    res.status(201).json({
      message: 'Registration successful.',
      userId: result.insertId,
      verification_status: verificationStatus
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status,
        organization_name: user.organization_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
});

// Profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, full_name, email, phone, role, organization_name, address, city, latitude, longitude, verification_status, created_at 
       FROM users WHERE id = ?`, 
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
