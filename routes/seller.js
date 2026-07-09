const express = require('express');
const { q } = require('../database/db');
const { authenticateSession } = require('../middleware/auth');
const router = express.Router();

// Get all approved public products
router.get('/products', async (req, res) => {
  try {
    const result = await q(
      'SELECT p.*, u.name as seller_name, u.email as seller_email, u.avatar as seller_avatar, ROUND(AVG(r.rating),1) as avg_rating, COUNT(r.id) as rating_count FROM public_products p LEFT JOIN users u ON p.user_id = u.id LEFT JOIN product_ratings r ON r.product_id = p.id AND r.product_type = ? WHERE p.status = ? GROUP BY p.id ORDER BY p.created_at DESC',
      ['public', 'approved']
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
    // Add 5 XP for product upload
    const currentXp = parseInt(req.user.xp) || 0;
    const newXp = currentXp + 5;
    await q('UPDATE users SET xp = ? WHERE id = ?', [newXp, req.user.id]);
    req.user.xp = newXp;
    res.json({ success: true, message: 'Product submitted for review! +5 XP gained!' });
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

// ====== SELLER CHATS ======

// Get or create chat for a product (customer side)
router.post('/chats', authenticateSession, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const product = await q('SELECT * FROM public_products WHERE id = ?', [productId]);
    if (!product.rows.length) return res.status(404).json({ error: 'Product not found' });
    if (product.rows[0].user_id == req.user.id) return res.status(400).json({ error: 'Cannot chat with yourself' });
    // Check existing chat
    const existing = await q('SELECT * FROM seller_chats WHERE product_id = ? AND customer_id = ?', [productId, req.user.id]);
    if (existing.rows.length) return res.json({ chat: existing.rows[0] });
    // Create new
    const ins = await q('INSERT INTO seller_chats (product_id, customer_id, seller_id, messages) VALUES (?, ?, ?, ?)',
      [productId, req.user.id, product.rows[0].user_id, '[]']);
    const chat = await q('SELECT * FROM seller_chats WHERE id = ?', [Number(ins.lastInsertRowid) || ins.id]);
    res.json({ chat: chat.rows[0] });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Send message in a seller chat
router.post('/chats/:id/message', authenticateSession, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });
    const chat = await q('SELECT * FROM seller_chats WHERE id = ?', [req.params.id]);
    if (!chat.rows.length) return res.status(404).json({ error: 'Chat not found' });
    const c = chat.rows[0];
    if (c.customer_id != req.user.id && c.seller_id != req.user.id) return res.status(403).json({ error: 'Not your chat' });
    const messages = JSON.parse(c.messages || '[]');
    messages.push({ sender_id: req.user.id, text: text.trim(), time: new Date().toISOString() });
    await q('UPDATE seller_chats SET messages = ? WHERE id = ?', [JSON.stringify(messages), req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get messages for a seller chat
router.get('/chats/:id', authenticateSession, async (req, res) => {
  try {
    const chat = await q('SELECT * FROM seller_chats WHERE id = ?', [req.params.id]);
    if (!chat.rows.length) return res.status(404).json({ error: 'Chat not found' });
    const c = chat.rows[0];
    if (c.customer_id != req.user.id && c.seller_id != req.user.id) return res.status(403).json({ error: 'Not your chat' });
    const product = await q('SELECT name FROM public_products WHERE id = ?', [c.product_id]);
    const customer = await q('SELECT id, name, email, avatar FROM users WHERE id = ?', [c.customer_id]);
    const seller = await q('SELECT id, name, email, avatar FROM users WHERE id = ?', [c.seller_id]);
    res.json({ chat: { ...c, messages: JSON.parse(c.messages || '[]'), product_name: product.rows[0]?.name, customer: customer.rows[0], seller: seller.rows[0] } });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get all chats for current user (as customer or seller)
router.get('/my-chats', authenticateSession, async (req, res) => {
  try {
    const asCustomer = await q(
      'SELECT sc.*, p.name as product_name FROM seller_chats sc LEFT JOIN public_products p ON sc.product_id = p.id WHERE sc.customer_id = ? ORDER BY sc.id DESC',
      [req.user.id]
    );
    const asSeller = await q(
      'SELECT sc.*, p.name as product_name FROM seller_chats sc LEFT JOIN public_products p ON sc.product_id = p.id WHERE sc.seller_id = ? ORDER BY sc.id DESC',
      [req.user.id]
    );
    // Add last message preview
    const mapChat = (row) => {
      const msgs = JSON.parse(row.messages || '[]');
      return { ...row, last_message: msgs.length ? msgs[msgs.length - 1] : null, message_count: msgs.length };
    };
    res.json({ as_customer: asCustomer.rows.map(mapChat), as_seller: asSeller.rows.map(mapChat) });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ====== SELLER ORDERS ======

// Get seller's orders (orders containing items with this seller_id)
router.get('/orders', authenticateSession, async (req, res) => {
  try {
    const allOrders = await q('SELECT * FROM orders ORDER BY created_at DESC');
    const sellerOrders = allOrders.rows.filter(o => {
      const items = JSON.parse(o.items || '[]');
      return items.some(item => String(item.sellerId) === String(req.user.id));
    });
    res.json({ orders: sellerOrders });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Update order status (seller only for their own product orders)
router.put('/orders/:id/status', authenticateSession, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await q('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order.rows.length) return res.status(404).json({ error: 'Order not found' });
    const items = JSON.parse(order.rows[0].items || '[]');
    const hasItem = items.some(item => String(item.sellerId) === String(req.user.id));
    if (!hasItem) return res.status(403).json({ error: 'Not your order' });
    await q('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
