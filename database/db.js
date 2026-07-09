const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let db = null;
let initialized = false;

function getLocalPath() {
  if (process.env.VERCEL) return '/tmp/data.db';
  return path.join(__dirname, 'data.db');
}

function getDB() {
  if (db) return db;
  const tursoUrl = process.env.TURSO_DB_URL;
  const tursoToken = process.env.TURSO_DB_TOKEN;

  if (tursoUrl && tursoToken && tursoUrl.startsWith('libsql://') && tursoToken.length > 10) {
    try {
      const client = createClient({ url: tursoUrl, authToken: tursoToken });
      db = client;
      return db;
    } catch (e) {
      console.log('Turso connection failed, using local database.');
    }
  }
  const localPath = getLocalPath();
  db = createClient({ url: 'file:' + localPath });
  return db;
}

async function initDB() {
  if (initialized) return;

  let client = getDB();
  const isTurso = !!(process.env.TURSO_DB_URL && process.env.TURSO_DB_TOKEN);

  try {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000));
    await Promise.race([client.execute('SELECT 1'), timeout]);
  } catch (e) {
    if (client === db) {
      const localPath = getLocalPath();
      db = createClient({ url: 'file:' + localPath });
      client = db;
    }
  }
  initialized = true;

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT DEFAULT '',
      otp TEXT DEFAULT '',
      otp_expires TEXT DEFAULT '',
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price TEXT NOT NULL DEFAULT 'Gratis',
      original_price TEXT DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      tags TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      store_type TEXT NOT NULL DEFAULT 'store',
      image TEXT DEFAULT '',
      video_enabled INTEGER DEFAULT 0,
      video_url TEXT DEFAULT '',
      stock_status TEXT DEFAULT 'ready',
      link TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      project TEXT DEFAULT '',
      budget TEXT DEFAULT '',
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      items TEXT NOT NULL DEFAULT '[]',
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      customer_name TEXT DEFAULT '',
      customer_email TEXT DEFAULT '',
      payment_method TEXT DEFAULT '',
      store_type TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS public_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT DEFAULT '',
      user_role TEXT DEFAULT 'user',
      user_avatar TEXT DEFAULT '',
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER,
      messages TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT DEFAULT '',
      text TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS promos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount INTEGER NOT NULL DEFAULT 10,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS public_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price TEXT NOT NULL DEFAULT 'Gratis',
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      link TEXT DEFAULT '',
      category TEXT DEFAULT 'other',
      status TEXT DEFAULT 'pending',
      admin_note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS seller_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      portfolio TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS seller_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      messages TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ];
  for (const sql of tables) {
    try { await client.execute(sql); } catch {}
  }

  // Migration: add missing columns
  const migrations = [
    "ALTER TABLE assets ADD COLUMN store_type TEXT NOT NULL DEFAULT 'store'",
    "ALTER TABLE assets ADD COLUMN original_price TEXT DEFAULT ''",
    "ALTER TABLE assets ADD COLUMN stock_status TEXT DEFAULT 'ready'",
    "ALTER TABLE assets ADD COLUMN link TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN session_token TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN verified_tag INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN banner TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN ref_code TEXT DEFAULT ''",
  ];
  for (const sql of migrations) {
    try { await client.execute(sql); } catch {}
  }

  await seedData(client);
}

async function q(sql, params = []) {
  const client = getDB();
  const result = await client.execute({ sql, args: params });
  return result;
}

async function seedData(client) {
  try {
    const users = await client.execute('SELECT COUNT(*) as count FROM users');
    if (users.rows[0].count === 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'Bamsj37@gmail.com';
      const adminPass = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Zxasqw_12345', 10);
      await client.execute('INSERT INTO users (email, name, password, role, verified, verified_tag) VALUES (?, ?, ?, ?, ?, ?)', [adminEmail, 'Admin BMS', adminPass, 'admin', 1, 1]);
      await client.execute('INSERT INTO users (email, name, password, role, verified) VALUES (?, ?, ?, ?, ?)', ['user@demo.com', 'Demo User', bcrypt.hashSync('user123', 10), 'user', 1]);
    }
  } catch {}

  try {
    const assets = await client.execute('SELECT COUNT(*) as count FROM assets');
    if (assets.rows[0].count === 0) {
      const items = [
        ['Bug Fix & Debugging', 'Rp 50.000', '', 'Perbaikan bug dan debugging script Roblox.', 'Bug Fix,Debugging,Script', 'script', 'studio', '', 0, '', 'ready'],
        ['Custom Feature Request', 'Rp 75.000', '', 'Fitur kustom sesuai kebutuhan game Roblox Anda.', 'Custom,Feature,Development', 'script', 'studio', '', 1, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'ready'],
        ['Game Optimization', 'Rp 65.000', '', 'Optimasi performa game Roblox.', 'Optimization,Performance,FPS', 'script', 'studio', '', 0, '', 'ready'],
        ['UI/UX for Roblox', 'Rp 55.000', '', 'Desain UI/UX untuk game Roblox.', 'UI,UX,Design,Interface', 'ui-kit', 'studio', '', 0, '', 'ready'],
        ['Roblox Scripting', 'Rp 60.000', '', 'Scripting Roblox dengan Luau profesional.', 'Scripting,Luau,Programming', 'script', 'studio', '', 0, '', 'ready'],
        ['Game Testing & QA', 'Rp 40.000', '', 'Pengujian game menyeluruh.', 'Testing,QA,Bug,Fixing', 'other', 'studio', '', 0, '', 'ready'],
        ['Server Setup (Roblox)', 'Rp 80.000', '', 'Konfigurasi server Roblox.', 'Server,DataStore,Setup', 'roblox', 'studio', '', 0, '', 'ready'],
        ['Animation & Effects', 'Rp 70.000', '', 'Animasi karakter dan efek visual.', 'Animation,VFX,Effects', '3d-model', 'studio', '', 1, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'ready'],
        ['Audio & Sound Design', 'Rp 50.000', '', 'Audio, soundtrack, sound effects untuk game.', 'Audio,Sound,Music,SFX', 'audio', 'studio', '', 0, '', 'ready'],
        ['Full Game Package', 'Rp 200.000', 'Rp 350.000', 'Paket lengkap pembuatan game Roblox.', 'Full Game,Package,Complete', 'roblox', 'studio', '', 1, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'ready'],
        ['Paket Hemat FiveM Revolution', 'Rp 75.000', 'Rp 120.000', 'Akun Rockstar + Steam GTA V + Optimasi PC + Citizen. Garansi 2 bulan.', 'FiveM,GTA,Paket,Hemat', 'other', 'store', '', 0, '', 'limited'],
        ['Social Media Injection', 'Rp 30.000', '', 'Followers, subscribers, views semua platform.', 'Social Media,Followers,Views', 'other', 'store', '', 0, '', 'ready'],
        ['Discord Nitro Boost (Full)', 'Rp 100.000', '', 'Upgrade akun Discord. Bukan Basic. 1 bulan.', 'Discord,Nitro,Boost,Premium', 'other', 'store', '', 0, '', 'ready'],
        ['Premium Streaming Apps', 'Rp 50.000', '', 'Akses akun streaming premium. 1 bulan.', 'Streaming,Premium,Akses', 'other', 'store', '', 0, '', 'ready'],
        ['Robux 100R', 'Rp 27.000', '', 'Top up Robux kurs kompetitif. Proses cepat.', 'Robux,Top Up,Roblox', 'roblox', 'store', '', 0, '', 'ready'],
        ['Steam Account Request', 'Rp 50.000', '', 'Akun Steam request game tertentu. Garansi 2 bulan.', 'Steam,Account,Game', 'other', 'store', '', 0, '', 'ready'],
        ['Steam Key Gacha', 'Rp 10.000', '', 'Game Steam acak. Bisa dapat game mahal!', 'Steam,Gacha,Key,Game', 'other', 'store', '', 0, '', 'ready'],
        ['Point Blank Account', 'Rp 100.000', '', 'Akun Point Blank pangkat Mayor ke atas.', 'Point Blank,Account,Pangkat', 'other', 'store', '', 0, '', 'ready'],
        ['Rockstar Personal Account', 'Rp 40.000', '', 'Akun Rockstar personal. Garansi 2 bulan.', 'Rockstar,Account,GTA', 'other', 'store', '', 0, '', 'ready'],
        ['Vendetta FFA Currency', 'Rp 5.000', '', '10K IC Vendetta FFA.', 'Vendetta,IC,Currency,FFA', 'other', 'store', '', 0, '', 'ready'],
        ['Top Up All Games', 'Rp 25.000', '', 'Top up semua game populer. Harga bersaing.', 'Top Up,Games,Popular', 'other', 'store', '', 0, '', 'ready'],
        ['Custom GTA SAMP', 'Rp 30.000', '', 'Modifikasi file game GTA SAMP.', 'GTA,SAMP,Modifikasi,Custom', 'other', 'store', '', 0, '', 'ready'],
        ['FiveM Essentials', 'Rp 35.000', '', 'Citizen FiveM untuk visual lebih baik.', 'FiveM,Citizen,Visual,Performa', 'other', 'store', '', 0, '', 'ready'],
        ['OS Optimization', 'Rp 50.000', '', 'Install Windows 10/11 + Lisensi Original.', 'Windows,OS,Optimization,License', 'other', 'store', '', 0, '', 'ready'],
        ['AI Jailbreak Prompt', 'Rp 20.000', '', 'Prompt untuk Gemini & AI. Work 100%.', 'AI,Jailbreak,Prompt,Gemini', 'other', 'store', '', 0, '', 'ready'],
        ['Roblox Game & Fish Account', 'Rp 50.000', '', 'Akun Roblox siap main.', 'Roblox,Account,Fish,Game', 'roblox', 'store', '', 0, '', 'ready'],
      ];
      for (const item of items) {
        try {
          await client.execute(
            'INSERT INTO assets (name, price, original_price, description, tags, category, store_type, image, video_enabled, video_url, stock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            item
          );
        } catch {}
      }
    }
  } catch {}

  try {
    const promos = await client.execute('SELECT COUNT(*) as count FROM promos');
    if (promos.rows[0].count === 0) {
      await client.execute('INSERT INTO promos (code, discount, max_uses, used_count, active) VALUES (?, ?, ?, ?, ?)', ['WELCOME10', 10, 100, 0, 1]);
      await client.execute('INSERT INTO promos (code, discount, max_uses, used_count, active) VALUES (?, ?, ?, ?, ?)', ['BMS50', 50, 50, 0, 1]);
      await client.execute('INSERT INTO promos (code, discount, max_uses, used_count, active) VALUES (?, ?, ?, ?, ?)', ['STARTER', 25, 200, 0, 1]);
    }
  } catch {}
}

module.exports = { getDB, initDB, q };
