const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await q('SELECT * FROM announcements WHERE active = 1 ORDER BY created_at DESC');
    res.json({ announcements: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/all', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ announcements: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    await q('INSERT INTO announcements (title, message, created_by) VALUES (?, ?, ?)',
      [title || '', message, req.user.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { title, message, active } = req.body;
    const updates = []; const params = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (message !== undefined) { updates.push('message = ?'); params.push(message); }
    if (active !== undefined) { updates.push('active = ?'); params.push(active); }
    if (!updates.length) return res.json({ success: true });
    params.push(req.params.id);
    await q('UPDATE announcements SET ' + updates.join(', ') + ' WHERE id = ?', params);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    await q('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;