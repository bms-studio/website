const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await q('SELECT * FROM portfolio ORDER BY sort ASC, id ASC');
    res.json({ items: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { title, desc, category, color, image, tags, sort } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title required' });
    const result = await q(
      'INSERT INTO portfolio (title, desc, category, color, image, tags, sort) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [String(title).trim().slice(0, 200), String(desc ?? '').slice(0, 2000), String(category ?? 'Web').slice(0, 50),
       String(color ?? '#e9e9eb').slice(0, 20), String(image ?? '').slice(0, 3000000),
       String(tags ?? '').slice(0, 500), parseInt(sort, 10) || 0]
    );
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (e) { console.error('[portfolio POST]', e); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { title, desc, category, color, image, tags, sort } = req.body;
    const updates = []; const params = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(String(title).trim().slice(0, 200)); }
    if (desc !== undefined) { updates.push('desc = ?'); params.push(String(desc).slice(0, 2000)); }
    if (category !== undefined) { updates.push('category = ?'); params.push(String(category).slice(0, 50)); }
    if (color !== undefined) { updates.push('color = ?'); params.push(String(color).slice(0, 20)); }
    if (image !== undefined) { updates.push('image = ?'); params.push(String(image).slice(0, 3000000)); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(String(tags).slice(0, 500)); }
    if (sort !== undefined) { updates.push('sort = ?'); params.push(parseInt(sort, 10) || 0); }
    if (!updates.length) return res.json({ success: true });
    params.push(req.params.id);
    await q('UPDATE portfolio SET ' + updates.join(', ') + ' WHERE id = ?', params);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    await q('DELETE FROM portfolio WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
