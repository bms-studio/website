process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err?.message); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err?.message); });

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public')));

const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const messageRoutes = require('./routes/messages');
const orderRoutes = require('./routes/orders');
const promoRoutes = require('./routes/promos');
const chatRoutes = require('./routes/chats');
const testimonialRoutes = require('./routes/testimonials');
const publicChatRoutes = require('./routes/public_chats');
const adminMgmtRoutes = require('./routes/admin_mgmt');
const tagRoutes = require('./routes/tags');
const sellerRoutes = require('./routes/seller');
const adminStoreRoutes = require('./routes/admin_store');
const promoImageRoutes = require('./routes/promotions');

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/public-chats', publicChatRoutes);
app.use('/api/admin', adminMgmtRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin-store', adminStoreRoutes);
app.use('/api/promotions', promoImageRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function init() {
  try {
    const { initDB } = require('./database/db');
    await initDB();
  } catch (err) {
    console.error('DB init failed, continuing:', err?.message);
  }
  app.listen(PORT, () => {
    console.log(`BMS STUDIO running on http://localhost:${PORT}`);
  });
}

init();

module.exports = app;
