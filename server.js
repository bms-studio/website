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

const ALLOWED_ORIGINS = [
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  'https://bms-platfrom.vercel.app'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts. Coba lagi nanti.' }
});
app.use('/api/auth/', authLimiter);

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: 'Too many chat requests' }
});
app.use('/api/chats/', chatLimiter);

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many messages. Coba lagi nanti.' }
});
app.use('/api/messages/', contactLimiter);

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Too many orders. Coba lagi nanti.' }
});
app.use('/api/orders/', orderLimiter);

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: IS_VERCEL ? '1h' : 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

const traffic = require('./utils/traffic');
app.use('/api', (req, res, next) => {
  const p = req.path;
  if (p.startsWith('/admin/traffic')) return next();
  traffic.track(p, req.headers['x-forwarded-for'] || req.socket.remoteAddress);
  if (req.method === 'POST') {
    if (p === '/auth/register') traffic.event('signup', 'User baru terdaftar');
    else if (p === '/orders') traffic.event('order', 'Pesanan baru dibuat');
    else if (p === '/messages') traffic.event('message', 'Pesan baru masuk');
    else if (p === '/public-chats') traffic.event('chat', 'Chat publik baru');
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/promos', require('./routes/promos'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/public-chats', require('./routes/public_chats'));
app.use('/api/admin', require('./routes/admin_mgmt'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/seller-promos', require('./routes/seller_promos'));
app.use('/api/admin-store', require('./routes/admin_store'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/config', require('./routes/config'));
app.use('/api/portfolio', require('./routes/portfolio'));

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
