const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/:orderId', authenticateSession, async (req, res) => {
  try {
    const result = await q('SELECT * FROM chats WHERE order_id = ?', [req.params.orderId]);
    if (result.rows.length) return res.json({ chat: result.rows[0] });
    const r = await q('INSERT INTO chats (order_id, user_id, messages) VALUES (?, ?, ?)', [req.params.orderId, req.user.id, '[]']);
    const chat = await q('SELECT * FROM chats WHERE id = ?', [r.lastInsertRowid]);
    res.json({ chat: chat.rows[0] });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/admin/all', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q('SELECT * FROM chats ORDER BY created_at DESC');
    res.json({ chats: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/:orderId/message', authenticateSession, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    const result = await q('SELECT * FROM chats WHERE order_id = ?', [req.params.orderId]);
    let chat = result.rows[0];
    if (!chat) {
      const r = await q('INSERT INTO chats (order_id, user_id, messages) VALUES (?, ?, ?)', [req.params.orderId, req.user.id, '[]']);
      chat = (await q('SELECT * FROM chats WHERE id = ?', [r.lastInsertRowid])).rows[0];
    }
    const msgs = JSON.parse(chat.messages || '[]');
    msgs.push({ role: req.user.role === 'admin' ? 'admin' : 'user', text, name: req.user.name || req.user.email, time: new Date().toISOString() });
    await q('UPDATE chats SET messages = ? WHERE id = ?', [JSON.stringify(msgs), chat.id]);
    res.json({ success: true, messages: msgs });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
