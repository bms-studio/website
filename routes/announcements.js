const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await q('SELECT * FROM announcements WHERE active = 1 ORDER BY created_at DESC');
    const now = new Date().toISOString();
    const announcements = result.rows.filter(a => {
      if (!a.duration_minutes || a.duration_minutes <= 0) return true;
      const createdAt = new Date(a.created_at + 'Z');
      const expiresAt = new Date(createdAt.getTime() + a.duration_minutes * 60000);
      return now >= createdAt.toISOString() && now < expiresAt.toISOString();
    });
    res.json({ announcements });
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
    const { title, message, duration_minutes } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const dur = parseInt(duration_minutes) || 0;
    await q('INSERT INTO announcements (title, message, created_by, duration_minutes) VALUES (?, ?, ?, ?)',
      [title || '', message, req.user.id, dur]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { title, message, active, duration_minutes } = req.body;
    const updates = []; const params = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (message !== undefined) { updates.push('message = ?'); params.push(message); }
    if (active !== undefined) { updates.push('active = ?'); params.push(active); }
    if (duration_minutes !== undefined) { updates.push('duration_minutes = ?'); params.push(duration_minutes); }
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