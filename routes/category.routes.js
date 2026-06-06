const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM food_categories ORDER BY category_name ASC');
    res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Create category (Admin only)
router.post('/', verifyToken, verifyRole('admin'), async (req, res) => {
  const { category_name } = req.body;
  if (!category_name) {
    return res.status(400).json({ message: 'category_name is required.' });
  }

  try {
    // Check if category already exists
    const [existing] = await db.query('SELECT id FROM food_categories WHERE category_name = ?', [category_name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category already exists.' });
    }

    const [result] = await db.query('INSERT INTO food_categories (category_name) VALUES (?)', [category_name]);
    res.status(201).json({
      message: 'Category created successfully.',
      categoryId: result.insertId,
      category_name
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
