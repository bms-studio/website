const crypto = require('crypto');

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SESSION_MAX_AGE_MS
};

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

function sessionExpiresISO() {
  return new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function getOwnerEmail() {
  return normalizeEmail(process.env.OWNER_EMAIL || 'Bamsj37@gmail.com');
}

function isOwnerEmail(email) {
  return normalizeEmail(email) === getOwnerEmail();
}

module.exports = {
  SESSION_MAX_AGE_MS,
  COOKIE_OPTIONS,
  generateSessionToken,
  generateOTP,
  sessionExpiresISO,
  normalizeEmail,
  isValidEmail,
  getOwnerEmail,
  isOwnerEmail
};
