const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

const OWNER_EMAIL = 'Bamsj37@gmail.com';

async function isOwner(userId) {
  const result = await q('SELECT email FROM users WHERE id = ?', [userId]);
  return result.rows.length && result.rows[0].email === OWNER_EMAIL;
}

router.get('/users', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q('SELECT id, email, name, role, avatar, banner, verified_tag, xp, bio, ref_code, created_at FROM users ORDER BY id');
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
    const { name, avatar, banner, bio, xp: userXp, ref_code } = req.body;
    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    if (ref_code !== undefined) { updates.push('ref_code = ?'); params.push(ref_code); }
    if (banner !== undefined) {
      updates.push('banner = ?'); params.push(banner);
    }
    if (userXp !== undefined) { updates.push('xp = ?'); params.push(parseInt(userXp) || 0); }
    if (!updates.length) return res.json({ success: true });
    params.push(req.user.id);
    await q('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?', params);
    const user = await q('SELECT id, email, name, role, avatar, banner, verified_tag, xp, bio, ref_code FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: user.rows[0] });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/public/:id', async (req, res) => {
  try {
    const result = await q('SELECT id, email, name, role, avatar, banner, verified_tag, xp, bio, ref_code FROM users WHERE id = ?', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const profile = result.rows[0];
    const tagsResult = await q('SELECT id, tag FROM tags WHERE user_id = ?', [req.params.id]);
    profile.tags = tagsResult.rows;
    res.json({ profile });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/profile-user', authenticateSession, async (req, res) => {
  try {
    if (!await isOwner(req.user.id)) return res.status(403).json({ error: 'Only owner can edit users' });
    const { userId, name, bio, xp, ref_code, avatar, banner, role } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const updates = []; const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    if (xp !== undefined) { updates.push('xp = ?'); params.push(parseInt(xp) || 0); }
    if (ref_code !== undefined) { updates.push('ref_code = ?'); params.push(ref_code); }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
    if (banner !== undefined) { updates.push('banner = ?'); params.push(banner); }
    if (role !== undefined && ['admin','user'].includes(role)) {
      updates.push('role = ?'); params.push(role);
      updates.push('verified_tag = ?'); params.push(role === 'admin' ? 1 : 0);
    }
    if (!updates.length) return res.json({ success: true });
    params.push(userId);
    await q('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?', params);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
