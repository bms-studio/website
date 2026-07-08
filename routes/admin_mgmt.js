const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/users', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q('SELECT id, email, name, role, avatar, banner, verified_tag, created_at FROM users ORDER BY id');
    res.json({ users: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/set-role', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ error: 'Required' });
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    await q('UPDATE users SET role = ?, verified_tag = ? WHERE id = ?', [role, role === 'admin' ? 1 : 0, userId]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/profile', authenticateSession, async (req, res) => {
  try {
    const { name, avatar, banner } = req.body;
    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
    if (banner !== undefined) {
      const xp = parseInt(req.headers['x-user-xp'] || '0');
      if (xp < 20) return res.status(400).json({ error: 'Need 20 XP for banner' });
      updates.push('banner = ?'); params.push(banner);
    }
    if (!updates.length) return res.json({ success: true });
    params.push(req.user.id);
    await q('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?', params);
    const user = await q('SELECT id, email, name, role, avatar, banner, verified_tag FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: user.rows[0] });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/public/:id', async (req, res) => {
  try {
    const result = await q('SELECT id, email, name, role, avatar, banner, verified_tag FROM users WHERE id = ?', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ profile: result.rows[0] });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
