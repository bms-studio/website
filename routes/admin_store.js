const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all products (all statuses)
router.get('/products', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || '';
    let sql = 'SELECT p.*, u.name as seller_name, u.email as seller_email FROM public_products p LEFT JOIN users u ON p.user_id = u.id';
    const params = [];
    if (status) { sql += ' WHERE p.status = ?'; params.push(status); }
    sql += ' ORDER BY p.created_at DESC';
    const result = await q(sql, params);
    res.json({ products: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get products by user
router.get('/products/user/:userId', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q(
      'SELECT p.*, u.name as seller_name, u.email as seller_email FROM public_products p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.created_at DESC',
      [req.params.userId]
    );
    res.json({ products: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Approve / reject product
router.put('/products/:id/status', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await q('UPDATE public_products SET status = ?, admin_note = ? WHERE id = ?', [status, admin_note || '', req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Delete any product
router.delete('/products/:id', authenticateSession, requireAdmin, async (req, res) => {
  try { await q('DELETE FROM public_products WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get all seller applications
router.get('/applications', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q(
      'SELECT a.*, u.name as user_name, u.email as user_email, u.verified_tag FROM seller_applications a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC'
    );
    res.json({ applications: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Approve / reject seller application
router.put('/applications/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await q('UPDATE seller_applications SET status = ? WHERE id = ?', [status, req.params.id]);
    if (status === 'approved') {
      const app = await q('SELECT user_id FROM seller_applications WHERE id = ?', [req.params.id]);
      if (app.rows.length) await q('UPDATE users SET verified_tag = 1 WHERE id = ?', [app.rows[0].user_id]);
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
