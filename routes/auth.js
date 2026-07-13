const express = require('express');
const bcrypt = require('bcryptjs');
const { q } = require('../database/db');
const { generateSessionToken } = require('../middleware/auth');
const { sendOTPEmail } = require('./email');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password diperlukan' });
  try {
    const result = await q('SELECT * FROM users WHERE email = ?', [email]);
    const user = result.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    const sessionToken = generateSessionToken();
    await q('UPDATE users SET session_token = ? WHERE id = ?', [sessionToken, user.id]);
    res.cookie('session', sessionToken, COOKIE_OPTIONS);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar || '', banner: user.banner || '', verified_tag: user.verified_tag || 0, xp: user.xp || 0, bio: user.bio || '', ref_code: user.ref_code || '' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, name, ref_code } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password diperlukan' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  try {
    const existing = await q('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.rows.length) return res.status(400).json({ error: 'Email sudah terdaftar' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const hashed = bcrypt.hashSync(password, 10);

    // Look up referrer if ref_code provided
    let referredBy = null;
    if (ref_code) {
      const refUser = await q('SELECT id FROM users WHERE ref_code = ?', [ref_code.toUpperCase()]);
      if (refUser.rows.length) referredBy = refUser.rows[0].id;
    }

    await q('INSERT INTO users (email, name, password, role, otp, otp_expires, verified, ref_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, name || email.split('@')[0], hashed, 'user', otp, otpExpires, 0, ref_code ? ref_code.toUpperCase() : '', referredBy]);

    const sent = await sendOTPEmail(email, otp);
    if (!sent) {
      await q('DELETE FROM users WHERE email = ?', [email]);
      return res.status(500).json({ error: 'Gagal mengirim email OTP. Coba lagi nanti.' });
    }

    res.json({ success: true, message: 'OTP telah dikirim ke email Anda.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email dan OTP diperlukan' });
  try {
    const result = await q('SELECT * FROM users WHERE email = ?', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'User tidak ditemukan' });
    if (user.verified) return res.status(400).json({ error: 'Akun sudah diverifikasi' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Kode OTP salah' });
    if (new Date(user.otp_expires) < new Date()) return res.status(400).json({ error: 'Kode OTP sudah kedaluwarsa' });

    await q('UPDATE users SET verified = 1, otp = \'\', otp_expires = \'\' WHERE email = ?', [email]);

    // Process referral bonus
    if (user.referred_by) {
      await q('UPDATE users SET xp = COALESCE(xp, 0) + 10 WHERE id = ?', [user.referred_by]);
      await q('UPDATE users SET xp = COALESCE(xp, 0) + 5 WHERE id = ?', [user.id]);
    }

    const updatedUser = await q('SELECT id, email, name, role, avatar, banner, verified_tag, xp, bio, ref_code FROM users WHERE id = ?', [user.id]);
    const u = updatedUser.rows[0];

    const sessionToken = generateSessionToken();
    await q('UPDATE users SET session_token = ? WHERE id = ?', [sessionToken, user.id]);
    res.cookie('session', sessionToken, COOKIE_OPTIONS);
    res.json({
      message: 'Registrasi berhasil!',
      user: { id: u.id, email: u.email, name: u.name, role: u.role, avatar: u.avatar || '', banner: u.banner || '', xp: u.xp || 0, bio: u.bio || '', ref_code: u.ref_code || '' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email diperlukan' });
  try {
    const result = await q('SELECT * FROM users WHERE email = ?', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'User tidak ditemukan' });
    if (user.verified) return res.status(400).json({ error: 'Akun sudah diverifikasi' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await q('UPDATE users SET otp = ?, otp_expires = ? WHERE email = ?', [otp, otpExpires, email]);

    const sent = await sendOTPEmail(email, otp);
    if (!sent) return res.status(500).json({ error: 'Gagal mengirim email OTP' });

    res.json({ success: true, message: 'OTP telah dikirim ulang.' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  const sessionToken = req.cookies?.session;
  if (sessionToken) {
    try {
      await q('UPDATE users SET session_token = \'\' WHERE session_token = ?', [sessionToken]);
    } catch {}
  }
  res.clearCookie('session');
  res.json({ success: true });
});

router.get('/me', async (req, res) => {
  const sessionToken = req.cookies?.session;
  if (!sessionToken) return res.json({ user: null });
  try {
    const result = await q('SELECT id, email, name, role, avatar, banner, verified_tag, xp, bio, ref_code FROM users WHERE session_token = ?', [sessionToken]);
    const user = result.rows[0];
    if (!user) return res.json({ user: null });
    res.json({ user });
  } catch {
    res.json({ user: null });
  }
});

module.exports = router;
