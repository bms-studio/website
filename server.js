process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err?.message); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err?.message); });

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;
const IS_VERCEL = !!process.env.VERCEL;

app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: IS_VERCEL ? '1h' : 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

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
const sellerPromoRoutes = require('./routes/seller_promos');
const adminStoreRoutes = require('./routes/admin_store');
const promoImageRoutes = require('./routes/promotions');
const announcementRoutes = require('./routes/announcements');

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
app.use('/api/seller-promos', sellerPromoRoutes);
app.use('/api/admin-store', adminStoreRoutes);
app.use('/api/promotions', promoImageRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err?.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Lightweight DB init (creates tables if missing, no migrations/seed on Vercel)
const { initDBFast } = require('./database/db');
initDBFast().catch(err => console.error('DB fast init failed:', err?.message));

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`BMS STUDIO running on http://localhost:${PORT}`);
  });
}

module.exports = app;
