const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await q('SELECT * FROM promotions WHERE active = 1 ORDER BY sort_order ASC');
    res.json({ promotions: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/all', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q('SELECT * FROM promotions ORDER BY sort_order ASC');
    res.json({ promotions: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { image_url, link, title, sort_order } = req.body;
    if (!image_url) return res.status(400).json({ error: 'Image URL required' });
    await q('INSERT INTO promotions (image_url, link, title, sort_order) VALUES (?, ?, ?, ?)',
      [image_url, link || '', title || '', sort_order || 0]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { image_url, link, title, sort_order, active } = req.body;
    const updates = []; const params = [];
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
    if (link !== undefined) { updates.push('link = ?'); params.push(link); }
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
    if (active !== undefined) { updates.push('active = ?'); params.push(active); }
    if (!updates.length) return res.json({ success: true });
    params.push(req.params.id);
    await q('UPDATE promotions SET ' + updates.join(', ') + ' WHERE id = ?', params);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    await q('DELETE FROM promotions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
