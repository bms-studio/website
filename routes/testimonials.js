const express = require('express');
const { q } = require('../database/db');
const { authenticateSession } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await q(
      `SELECT t.*,
       (CASE WHEN EXISTS(SELECT 1 FROM users ua WHERE ua.id = t.user_id AND ua.avatar IS NOT NULL AND ua.avatar != '') THEN 1 ELSE 0 END) AS _has_av
       FROM testimonials t ORDER BY t.created_at DESC`
    );
    // Avatar via URL endpoint terpisah (cache browser 24 jam) -> payload JSON kecil
    const avatarMap = {};
    const rows = result.rows.map(r => {
      const { _has_av, ...rest } = r;
      if (_has_av) avatarMap[rest.user_id] = '/api/avatars/' + rest.user_id;
      return rest;
    });
    res.json({ testimonials: rows, avatar_map: avatarMap });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, async (req, res) => {
  try {
    const { text, rating, product_name, store_type, seller_name } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    const ratingInt = rating === undefined ? 5 : parseInt(rating, 10);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    await q('INSERT INTO testimonials (user_id, user_name, text, rating, product_name, store_type, seller_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.name || req.user.email, text, ratingInt, product_name || '', store_type || '', seller_name || '']);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
