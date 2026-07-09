const express = require('express');
const { q } = require('../database/db');
const { authenticateSession } = require('../middleware/auth');
const router = express.Router();

// Get all approved public products
router.get('/products', async (req, res) => {
  try {
    const result = await q(
      'SELECT p.*, u.name as seller_name, u.email as seller_email FROM public_products p LEFT JOIN users u ON p.user_id = u.id WHERE p.status = ? ORDER BY p.created_at DESC',
      ['approved']
    );
    res.json({ products: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get products by user ID (public)
router.get('/products/user/:userId', async (req, res) => {
  try {
    const result = await q(
      'SELECT p.*, u.name as seller_name FROM public_products p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id = ? AND p.status = ? ORDER BY p.created_at DESC',
      [req.params.userId, 'approved']
    );
    res.json({ products: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Apply to be a seller
router.post('/apply', authenticateSession, async (req, res) => {
  try {
    const { name, reason, portfolio } = req.body;
    if (!name || !reason) return res.status(400).json({ error: 'Name and reason required' });
    const existing = await q('SELECT id FROM seller_applications WHERE user_id = ? AND status = ?', [req.user.id, 'pending']);
    if (existing.rows.length) return res.status(400).json({ error: 'You already have a pending application' });
    await q('INSERT INTO seller_applications (user_id, name, email, reason, portfolio) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, req.user.email, reason, portfolio || '']);
    res.json({ success: true, message: 'Application submitted! Admin will review.' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get seller's own products (authenticated)
router.get('/my-products', authenticateSession, async (req, res) => {
  try {
    const result = await q('SELECT * FROM public_products WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ products: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Add product (seller only)
router.post('/products', authenticateSession, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.verified_tag) return res.status(403).json({ error: 'Only verified users can sell' });
    const { name, price, description, image, link, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    await q('INSERT INTO public_products (user_id, name, price, description, image, link, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, price || 'Gratis', description || '', image || '', link || '', category || 'other']);
    res.json({ success: true, message: 'Product submitted for review!' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Update product (seller only, own products)
router.put('/products/:id', authenticateSession, async (req, res) => {
  try {
    const prod = await q('SELECT * FROM public_products WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!prod.rows.length) return res.status(404).json({ error: 'Not found or not yours' });
    const { name, price, description, image, link, category } = req.body;
    const updates = []; const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (image !== undefined) { updates.push('image = ?'); params.push(image); }
    if (link !== undefined) { updates.push('link = ?'); params.push(link); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    updates.push('status = ?'); params.push('pending'); // re-submit for review
    if (!updates.length) return res.json({ success: true });
    params.push(req.params.id);
    await q('UPDATE public_products SET ' + updates.join(', ') + ' WHERE id = ?', params);
    res.json({ success: true, message: 'Product updated and sent for review!' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Delete product (seller only, own products)
router.delete('/products/:id', authenticateSession, async (req, res) => {
  try {
    const prod = await q('SELECT * FROM public_products WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!prod.rows.length) return res.status(404).json({ error: 'Not found or not yours' });
    await q('DELETE FROM public_products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
