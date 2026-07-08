const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const after = parseInt(req.query.after) || 0;
    if (after > 0) {
      const result = await q('SELECT * FROM public_chats WHERE id > ? ORDER BY id ASC', [after]);
      return res.json({ chats: result.rows });
    }
    const result = await q('SELECT * FROM public_chats ORDER BY id DESC LIMIT 30');
    res.json({ chats: result.rows.reverse() });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });
    const user = await q('SELECT id, name, email, role, avatar, banner, verified_tag FROM users WHERE id = ?', [req.user.id]);
    if (!user.rows.length) return res.status(401).json({ error: 'User not found' });
    const u = user.rows[0];
    await q('INSERT INTO public_chats (user_id, user_name, user_role, user_avatar, text) VALUES (?, ?, ?, ?, ?)',
      [u.id, u.name || u.email, u.role === 'admin' ? 'admin' : 'user', u.avatar || '', text.trim()]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try { await q('DELETE FROM public_chats WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
