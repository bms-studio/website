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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/orders', orderRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  const { initDB } = require('./database/db');
  await initDB();
  app.listen(PORT, () => {
    console.log(`  BMS STUDIO Server running on http://localhost:${PORT}`);
  });
}

start();
