const express = require('express');
const { q } = require('../database/db');
const { isValidMedia } = require('../utils/validate');
const { authenticateSession, requireAdmin, isOwnerById } = require('../middleware/auth');
const traffic = require('../utils/traffic');
const router = express.Router();

const USER_EDITABLE_FIELDS = {
  name: 'name',
  avatar: 'avatar',
  banner: 'banner',
  bio: 'bio'
};

router.get('/traffic', authenticateSession, requireAdmin, (req, res) => {
  res.json(traffic.snapshot());
});

router.get('/traffic/stream', authenticateSession, requireAdmin, (req, res) => {
  traffic.stream(res);
});

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
    const target = await q('SELECT id FROM users WHERE id = ?', [userId]);
    if (!target.rows.length) return res.status(404).json({ error: 'User not found' });
    await q('UPDATE users SET role = ?, verified_tag = ? WHERE id = ?', [role, role === 'admin' ? 1 : 0, userId]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/profile', authenticateSession, async (req, res) => {
  try {
    const updates = [];
    const params = [];
    for (const [key, column] of Object.entries(USER_EDITABLE_FIELDS)) {
      if (req.body[key] !== undefined) {
        updates.push(`${column} = ?`);
        params.push(String(req.body[key]).slice(0, key === 'avatar' || key === 'banner' ? 3000000 : 5000));
      }
    }
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
    // PRIVASI: email & ref_code hanya untuk pemilik akun / admin — publik tidak boleh melihat
    try {
      const token = req.cookies && req.cookies.session;
      let viewer = null;
      if (token) {
        const u = await q('SELECT id, role, email FROM users WHERE session_token = ?', [token]);
        if (u.rows.length) viewer = u.rows[0];
      }
      const isSelf = viewer && Number(viewer.id) === Number(profile.id);
      const isAdmin = viewer && viewer.role === 'admin';
      if (!isSelf && !isAdmin) { profile.email = ''; profile.ref_code = ''; }
    } catch {}
    const tagsResult = await q('SELECT id, tag FROM tags WHERE user_id = ?', [req.params.id]);
    profile.tags = tagsResult.rows;
    res.json({ profile });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/profile-user', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const owner = await isOwnerById(req.user.id);
    const { userId, name, bio, xp, ref_code, avatar, banner, role } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const updates = []; const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(String(name).slice(0, 200)); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(String(bio).slice(0, 2000)); }
    if (xp !== undefined) {
      const xpInt = parseInt(xp, 10);
      if (isNaN(xpInt) || xpInt < 0) return res.status(400).json({ error: 'Invalid xp' });
      updates.push('xp = ?'); params.push(xpInt);
    }
    if (ref_code !== undefined) { updates.push('ref_code = ?'); params.push(String(ref_code).slice(0, 50).toUpperCase()); }
    if (avatar !== undefined) { if (!isValidMedia(avatar)) return res.status(400).json({ error: 'Invalid avatar (gunakan URL https atau gambar < 900KB)' }); updates.push('avatar = ?'); params.push(String(avatar).trim()); }
    if (banner !== undefined) { if (!isValidMedia(banner)) return res.status(400).json({ error: 'Invalid banner (gunakan URL https atau gambar < 900KB)' }); updates.push('banner = ?'); params.push(String(banner).trim()); }
    
    if (role !== undefined) {
      if (!owner) return res.status(403).json({ error: 'Only owner can change role' });
      if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
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
