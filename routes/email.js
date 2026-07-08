const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = { sendMail: async () => true };
  }
  return transporter;
}

async function sendOTPEmail(to, otp) {
  if (!process.env.SMTP_USER) {
    console.log(`[DEV] OTP for ${to}: ${otp}`);
    return true;
  }
  try {
    const t = getTransporter();
    await t.sendMail({
      from: process.env.SMTP_FROM || 'noreply@bmsstudio.com',
      to,
      subject: 'Kode Verifikasi OTP - BMS STUDIO',
      html: `
        <div style="background:#0f0f13;color:#e4e4e7;font-family:Arial,sans-serif;padding:32px;max-width:480px;margin:0 auto">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="color:#8b7cfc;font-size:24px;margin:0">BMS STUDIO</h1>
            <p style="color:#9ca3af;font-size:13px">Verifikasi Akun Anda</p>
          </div>
          <div style="background:#1a1a2e;border-radius:12px;padding:24px;border:1px solid rgba(255,255,255,0.08)">
            <p style="margin:0 0 16px;font-size:14px;color:#e4e4e7">Gunakan kode OTP berikut untuk verifikasi akun Anda:</p>
            <div style="background:#0f0f13;border-radius:8px;padding:16px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#8b7cfc;font-family:monospace">${otp}</div>
            <p style="margin:16px 0 0;font-size:12px;color:#6b7280">Kode ini berlaku selama 10 menit. Abaikan email ini jika Anda tidak mendaftar.</p>
          </div>
        </div>
      `
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

module.exports = { sendOTPEmail };
