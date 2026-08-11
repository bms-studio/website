const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const { isValidEmail } = require('../utils/auth-utils');

const router = express.Router();

async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (token) {
      const r = await q(
        'SELECT id, email, name, role FROM users WHERE session_token = ?',
        [token]
      );
      if (r.rows.length) {
        const user = r.rows[0];
        if (user.session_expires && new Date(user.session_expires).getTime() < Date.now()) {
          req.user = null;
        } else {
          req.user = user;
        }
      }
    }
  } catch {}
  next();
}

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, email, project, budget, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Nama, email, dan pesan diperlukan' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Email tidak valid' });
    await q('INSERT INTO messages (name, email, project, budget, message, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [String(name).slice(0, 200), String(email).trim().toLowerCase(), project || '', budget || '', String(message).slice(0, 5000), req.user?.id || null]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q('SELECT * FROM messages ORDER BY created_at DESC');
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/mine', authenticateSession, async (req, res) => {
  try {
    const result = await q('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/read', authenticateSession, requireAdmin, async (req, res) => {
  try {
    await q('UPDATE messages SET read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/reply', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'Balasan diperlukan' });
    await q('UPDATE messages SET reply = ?, replied_at = ?, read = 1 WHERE id = ?',
      [String(text).slice(0, 5000), new Date().toISOString(), req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    await q('DELETE FROM messages WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
