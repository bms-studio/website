const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const { isOwnerEmail } = require('../utils/auth-utils');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const after = parseInt(req.query.after) || 0;
    // Kolom eksplisit: JANGAN ikutkan user_avatar (blob base64 tersimpan di baris chat)
    const COLS = 'pc.id, pc.user_id, pc.user_name, pc.user_role, pc.text, pc.created_at';
    let rows;
    if (after > 0) {
      const result = await q(`SELECT ${COLS},
        (CASE WHEN EXISTS(SELECT 1 FROM users ua WHERE ua.id = pc.user_id AND ua.avatar IS NOT NULL AND ua.avatar != '') THEN 1 ELSE 0 END) AS _has_av,
        (CASE WHEN EXISTS(SELECT 1 FROM users uv WHERE uv.id = pc.user_id AND uv.verified_tag = 1) THEN 1 ELSE 0 END) AS user_verified
        FROM public_chats pc WHERE pc.id > ? ORDER BY pc.id ASC`, [after]);
      rows = result.rows;
    } else {
      const result = await q(`SELECT ${COLS},
        (CASE WHEN EXISTS(SELECT 1 FROM users ua WHERE ua.id = pc.user_id AND ua.avatar IS NOT NULL AND ua.avatar != '') THEN 1 ELSE 0 END) AS _has_av,
        (CASE WHEN EXISTS(SELECT 1 FROM users uv WHERE uv.id = pc.user_id AND uv.verified_tag = 1) THEN 1 ELSE 0 END) AS user_verified
        FROM public_chats pc ORDER BY pc.id DESC LIMIT 30`);
      rows = result.rows.reverse();
    }
    // Attach tags for each unique user
    const userIds = [...new Set(rows.map(r => r.user_id))];
    if (userIds.length) {
      const placeholders = userIds.map(() => '?').join(',');
      const tagResult = await q('SELECT user_id, tag FROM tags WHERE user_id IN (' + placeholders + ')', userIds);
      const tagMap = {};
      tagResult.rows.forEach(t => {
        if (!tagMap[t.user_id]) tagMap[t.user_id] = [];
        tagMap[t.user_id].push(t.tag);
      });
      rows.forEach(r => { r.tags = tagMap[r.user_id] || []; });
    }
    // Avatar via URL endpoint terpisah (cache browser 24 jam) -> payload JSON kecil
    const avatarMap = {};
    rows.forEach(r => {
      if (r._has_av) avatarMap[r.user_id] = '/api/avatars/' + r.user_id;
      delete r._has_av;
    });
    res.json({ chats: rows, avatar_map: avatarMap });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });
    const user = await q('SELECT id, name, email, role, avatar, banner, verified_tag FROM users WHERE id = ?', [req.user.id]);
    if (!user.rows.length) return res.status(401).json({ error: 'User not found' });
    const u = user.rows[0];
    const role = isOwnerEmail(u.email) ? 'official' : (u.role === 'admin' ? 'admin' : 'user');
    const ins = await q('INSERT INTO public_chats (user_id, user_name, user_role, user_avatar, text) VALUES (?, ?, ?, ?, ?)',
      [u.id, u.name || u.email, role, '', text.trim()]); // avatar tidak disimpan di chat (baca via /api/avatars)
    res.json({ success: true, chat_id: Number(ins.lastInsertRowid) || null });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try { await q('DELETE FROM public_chats WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
