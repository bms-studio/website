const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateSession, async (req, res) => {
  try {
    const result = await q('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { items, total, customer_name, customer_email, payment_method, store_type } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'Cart kosong' });
    let userId = null;
    const sessionToken = req.cookies?.session;
    if (sessionToken) {
      try {
        const result = await q('SELECT id FROM users WHERE session_token = ?', [sessionToken]);
        if (result.rows.length) userId = result.rows[0].id;
      } catch {}
    }
    const r = await q(
      'INSERT INTO orders (user_id, items, total, status, customer_name, customer_email, payment_method, store_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, JSON.stringify(items), total || 0, 'pending', customer_name || '', customer_email || '', payment_method || '', store_type || '']
    );
    const order = await q('SELECT * FROM orders WHERE id = ?', [r.lastInsertRowid]);
    res.json({ order: order.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/status', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await q('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
