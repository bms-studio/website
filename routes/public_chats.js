const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();
const OWNER_EMAIL = 'Bamsj37@gmail.com';

router.get('/', async (req, res) => {
  try {
    const after = parseInt(req.query.after) || 0;
    let rows;
    if (after > 0) {
      const result = await q('SELECT * FROM public_chats WHERE id > ? ORDER BY id ASC', [after]);
      rows = result.rows;
    } else {
      const result = await q('SELECT * FROM public_chats ORDER BY id DESC LIMIT 30');
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
    res.json({ chats: rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });
    const user = await q('SELECT id, name, email, role, avatar, banner, verified_tag FROM users WHERE id = ?', [req.user.id]);
    if (!user.rows.length) return res.status(401).json({ error: 'User not found' });
    const u = user.rows[0];
    const role = u.email === OWNER_EMAIL ? 'official' : (u.role === 'admin' ? 'admin' : 'user');
    const ins = await q('INSERT INTO public_chats (user_id, user_name, user_role, user_avatar, text) VALUES (?, ?, ?, ?, ?)',
      [u.id, u.name || u.email, role, u.avatar || '', text.trim()]);
    res.json({ success: true, chat_id: Number(ins.lastInsertRowid) || null });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try { await q('DELETE FROM public_chats WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
