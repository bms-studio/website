const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { q } = require('../database/db');
const {
  generateSessionToken,
  generateOTP,
  sessionExpiresISO,
  normalizeEmail,
  isValidEmail,
  COOKIE_OPTIONS
} = require('../utils/auth-utils');
const { sendOTPEmail, sendResetPasswordEmail } = require('./email');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' }
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan OTP. Coba lagi nanti.' }
});
const resendLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: { error: 'Terlalu sering kirim ulang OTP. Coba lagi nanti.' }
});
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Terlalu banyak percobaan reset. Coba lagi nanti.' }
});

async function issueSession(userId, res) {
  const sessionToken = generateSessionToken();
  await q('UPDATE users SET session_token = ?, session_expires = ? WHERE id = ?',
    [sessionToken, sessionExpiresISO(), userId]);
  res.cookie('session', sessionToken, COOKIE_OPTIONS);
  return sessionToken;
}

function publicUser(u) {
  return {
    id: u.id, email: u.email, name: u.name, role: u.role,
    avatar: u.avatar || '', banner: u.banner || '',
    verified_tag: u.verified_tag || 0, xp: u.xp || 0, bio: u.bio || '', ref_code: u.ref_code || ''
  };
}

router.post('/login', loginLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password diperlukan' });
  try {
    const result = await q('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
    const user = result.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    if (!user.verified) {
      return res.status(403).json({ error: 'Akun belum diverifikasi. Cek email Anda untuk kode OTP.' });
    }
    await issueSession(user.id, res);
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/check-email', async (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email tidak valid' });
  try {
    const result = await q('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
    res.json({ exists: result.rows.length > 0 });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', resetLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password, name, ref_code } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password diperlukan' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email tidak valid' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  try {
    const existing = await q('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
    if (existing.rows.length) return res.status(400).json({ error: 'Email sudah terdaftar' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const hashed = bcrypt.hashSync(password, 10);
    const otpHash = bcrypt.hashSync(otp, 10);

    let referredBy = null;
    if (ref_code) {
      const refUser = await q('SELECT id FROM users WHERE ref_code = ?', [ref_code.toUpperCase()]);
      if (refUser.rows.length) referredBy = refUser.rows[0].id;
    }

    await q('INSERT INTO users (email, name, password, role, otp, otp_expires, verified, ref_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, name || email.split('@')[0], hashed, 'user', otpHash, otpExpires, 0, ref_code ? ref_code.toUpperCase() : '', referredBy]);

    const sent = await sendOTPEmail(email, otp);
    if (!sent) {
      await q('DELETE FROM users WHERE LOWER(email) = ?', [email]);
      return res.status(500).json({ error: 'Gagal mengirim email OTP. Coba lagi nanti.' });
    }

    res.json({ success: true, message: 'OTP telah dikirim ke email Anda.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify-otp', otpLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email dan OTP diperlukan' });
  try {
    const result = await q('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'User tidak ditemukan' });
    if (user.verified) return res.status(400).json({ error: 'Akun sudah diverifikasi' });
    if (!user.otp) return res.status(400).json({ error: 'Kode OTP salah' });
    if (new Date(user.otp_expires) < new Date()) return res.status(400).json({ error: 'Kode OTP sudah kedaluwarsa' });
    if (!bcrypt.compareSync(String(otp).trim(), user.otp)) return res.status(400).json({ error: 'Kode OTP salah' });

    await q("UPDATE users SET verified = 1, otp = '', otp_expires = '' WHERE LOWER(email) = ?", [email]);

    if (user.referred_by) {
      await q('UPDATE users SET xp = COALESCE(xp, 0) + 10 WHERE id = ?', [user.referred_by]);
      await q('UPDATE users SET xp = COALESCE(xp, 0) + 5 WHERE id = ?', [user.id]);
    }

    const updatedUser = await q('SELECT * FROM users WHERE id = ?', [user.id]);
    const u = updatedUser.rows[0];
    await issueSession(u.id, res);
    res.json({ message: 'Registrasi berhasil!', user: publicUser(u) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/resend-otp', resendLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ error: 'Email diperlukan' });
  try {
    const result = await q('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'User tidak ditemukan' });
    if (user.verified) return res.status(400).json({ error: 'Akun sudah diverifikasi' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const otpHash = bcrypt.hashSync(otp, 10);
    await q('UPDATE users SET otp = ?, otp_expires = ? WHERE LOWER(email) = ?', [otpHash, otpExpires, email]);

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
      await q("UPDATE users SET session_token = '', session_expires = '' WHERE session_token = ?", [sessionToken]);
    } catch {}
  }
  res.clearCookie('session', COOKIE_OPTIONS);
  res.json({ success: true });
});

router.get('/me', async (req, res) => {
  const sessionToken = req.cookies?.session;
  if (!sessionToken) return res.json({ user: null });
  try {
    const result = await q(
      'SELECT id, email, name, role, avatar, banner, verified_tag, xp, bio, ref_code, session_expires FROM users WHERE session_token = ?',
      [sessionToken]
    );
    const user = result.rows[0];
    if (!user) return res.json({ user: null });
    if (user.session_expires && new Date(user.session_expires).getTime() < Date.now()) return res.json({ user: null });
    res.json({ user: publicUser(user) });
  } catch {
    res.json({ user: null });
  }
});

router.post('/forgot-password', resetLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ error: 'Email diperlukan' });
  try {
    const result = await q('SELECT id, verified FROM users WHERE LOWER(email) = ?', [email]);
    if (!result.rows.length) {
      return res.json({ success: true, message: 'Jika email terdaftar, kode reset telah dikirim.' });
    }
    const user = result.rows[0];
    if (!user.verified) {
      return res.status(400).json({ error: 'Akun belum diverifikasi. Selesaikan verifikasi OTP terlebih dahulu.' });
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const otpHash = bcrypt.hashSync(otp, 10);
    await q('UPDATE users SET otp = ?, otp_expires = ? WHERE id = ?', [otpHash, otpExpires, user.id]);
    const sent = await sendResetPasswordEmail(email, otp);
    if (!sent) return res.status(500).json({ error: 'Gagal mengirim email. Coba lagi nanti.' });
    res.json({ success: true, message: 'Kode reset telah dikirim ke email Anda.' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', resetLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Email, OTP, dan password baru diperlukan' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  try {
    const result = await q('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'User tidak ditemukan' });
    if (!user.otp) return res.status(400).json({ error: 'Tidak ada kode reset aktif. Silakan minta ulang.' });
    if (new Date(user.otp_expires) < new Date()) return res.status(400).json({ error: 'Kode sudah kedaluwarsa. Silakan minta ulang.' });
    if (!bcrypt.compareSync(String(otp).trim(), user.otp)) return res.status(400).json({ error: 'Kode OTP salah' });
    const newHash = bcrypt.hashSync(newPassword, 10);
    await q("UPDATE users SET password = ?, otp = '', otp_expires = '' WHERE id = ?", [newHash, user.id]);
    res.json({ success: true, message: 'Password berhasil direset. Silakan login.' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
