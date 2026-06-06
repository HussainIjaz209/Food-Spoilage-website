const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Donor Dashboard Stats
router.get('/donor', verifyToken, verifyRole('donor'), async (req, res) => {
  try {
    // 1. Get totals
    const [totals] = await db.query(
      `SELECT 
        COUNT(*) as total_listings,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as active_listings,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_listings,
        SUM(CASE WHEN status = 'claimed' THEN 1 ELSE 0 END) as claimed_listings
       FROM donations 
       WHERE donor_id = ?`,
      [req.user.id]
    );

    const stats = totals[0] || { total_listings: 0, active_listings: 0, delivered_listings: 0, claimed_listings: 0 };
    
    // Calculate an impact metric (e.g. estimating 10 meals per donation on average)
    const mealsSaved = (stats.delivered_listings || 0) * 10;

    // 2. Get active listings detail
    const [activeListings] = await db.query(
      `SELECT d.*, c.category_name 
       FROM donations d
       LEFT JOIN food_categories c ON d.category_id = c.id
       WHERE d.donor_id = ? AND d.status IN ('available', 'claimed', 'picked_up')
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );

    res.json({
      metrics: {
        total_listings: stats.total_listings || 0,
        active_listings: stats.active_listings || 0,
        delivered_listings: stats.delivered_listings || 0,
        claimed_listings: stats.claimed_listings || 0,
        meals_saved: mealsSaved,
        impact_message: `You have successfully saved ${mealsSaved} meals and reduced local food waste!`
      },
      active_listings: activeListings
    });
  } catch (error) {
    console.error('Donor stats error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Recipient Dashboard Stats
router.get('/recipient', verifyToken, verifyRole('recipient'), async (req, res) => {
  try {
    // 1. Total pickups
    const [pickups] = await db.query(
      `SELECT COUNT(*) as count 
       FROM claims 
       WHERE recipient_id = ? AND status = 'delivered'`,
      [req.user.id]
    );

    // 2. Pickup history detail
    const [history] = await db.query(
      `SELECT c.id as claim_id, c.claim_time, c.pickup_time, c.delivery_time, c.status as claim_status,
              d.title as donation_title, d.quantity, d.food_type, d.image_url,
              u.organization_name as donor_name, u.phone as donor_phone
       FROM claims c
       LEFT JOIN donations d ON c.donation_id = d.id
       LEFT JOIN users u ON d.donor_id = u.id
       WHERE c.recipient_id = ?
       ORDER BY c.claim_time DESC`,
      [req.user.id]
    );

    res.json({
      metrics: {
        successful_pickups: pickups[0].count || 0
      },
      claim_history: history
    });
  } catch (error) {
    console.error('Recipient stats error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Admin Reports and General Analytics
router.get('/admin-reports', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    // 1. User role counts
    const [userCounts] = await db.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    // 2. City-wise donation trends
    const [cityTrends] = await db.query(
      'SELECT city, COUNT(*) as donation_count FROM donations GROUP BY city'
    );

    // 3. Status breakdown
    const [statusBreakdown] = await db.query(
      'SELECT status, COUNT(*) as count FROM donations GROUP BY status'
    );

    // 4. Waste reduced and people fed metrics
    const [deliveredStats] = await db.query(
      "SELECT COUNT(*) as count FROM donations WHERE status = 'delivered'"
    );

    const deliveredCount = deliveredStats[0].count || 0;
    const estimatedPeopleFed = deliveredCount * 12; // Average 12 people per listing
    const estimatedWasteReducedKg = deliveredCount * 5; // Average 5kg of food saved per listing

    res.json({
      user_summary: userCounts,
      city_trends: cityTrends,
      donation_status_summary: statusBreakdown,
      impact_summary: {
        total_delivered_donations: deliveredCount,
        estimated_waste_reduced_kg: estimatedWasteReducedKg,
        estimated_people_fed: estimatedPeopleFed
      }
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
