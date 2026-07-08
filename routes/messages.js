const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, project, budget, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Nama, email, dan pesan diperlukan' });
    await q('INSERT INTO messages (name, email, project, budget, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, project || '', budget || '', message]);
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

router.put('/:id/read', authenticateSession, requireAdmin, async (req, res) => {
  try {
    await q('UPDATE messages SET read = 1 WHERE id = ?', [req.params.id]);
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
