const express = require('express');
const { q } = require('../database/db');
const { authenticateSession } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await q(
      `SELECT t.*, u.avatar as user_avatar
       FROM testimonials t
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    res.json({ testimonials: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, async (req, res) => {
  try {
    const { text, rating, product_name, store_type, seller_name } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    await q('INSERT INTO testimonials (user_id, user_name, text, rating, product_name, store_type, seller_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.name || req.user.email, text, rating || 5, product_name || '', store_type || '', seller_name || '']);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
