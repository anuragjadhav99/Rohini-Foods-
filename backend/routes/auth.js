const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const db = require('../config/database');

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rohini-foods.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);

const emailTransporter = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

const googleClient = new OAuth2Client(googleClientId);

function generateOtpCode(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

async function hashValue(value) {
  return bcrypt.hash(value, 10);
}

async function compareHash(value, hash) {
  return bcrypt.compare(value, hash);
}

async function sendEmail(to, subject, text) {
  if (!emailTransporter) {
    console.log(`✉️  Email not configured. Skipping send to ${to}. Message: ${text}`);
    return;
  }

  await emailTransporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
}

function sendSmsPlaceholder(phone, code) {
  console.log(`📱 SMS placeholder: send OTP ${code} to ${phone}. Configure SMS provider to send real messages.`);
}

async function storeOtp(target, type, code) {
  const codeHash = await hashValue(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  await db.run(
    'INSERT INTO auth_otps (target, type, code_hash, expires_at, used, attempts) VALUES (?, ?, ?, ?, 0, 0)',
    [target, type, codeHash, expiresAt]
  );
}

async function getValidOtp(target, type) {
  return db.get(
    'SELECT * FROM auth_otps WHERE target = ? AND type = ? AND used = 0 AND expires_at > datetime("now") ORDER BY id DESC LIMIT 1',
    [target, type]
  );
}

async function markOtpUsed(id) {
  await db.run('UPDATE auth_otps SET used = 1 WHERE id = ?', [id]);
}

async function findUserByEmail(email) {
  return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

async function findUserByPhone(phone) {
  return db.get('SELECT * FROM users WHERE phone = ?', [phone]);
}

async function createOrUpdateUser({ email, name = '', phone, provider = 'local', password = null }) {
  const hashedPassword = password ? await hashValue(password) : await hashValue(Math.random().toString(36));
  if (phone) {
    await db.run(
      'INSERT OR IGNORE INTO users (email, password, phone, name, provider) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, phone, name, provider]
    );
  } else {
    await db.run(
      'INSERT OR IGNORE INTO users (email, password, name, provider) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, provider]
    );
  }
  return findUserByEmail(email);
}

async function getOrCreateAdmin() {
  const existing = await findUserByEmail(ADMIN_EMAIL);
  if (existing) return existing;
  await db.run(
    'INSERT OR IGNORE INTO users (email, password, name, provider) VALUES (?, ?, ?, ?)',
    [ADMIN_EMAIL, await hashValue(ADMIN_PASSWORD), 'Admin', 'local']
  );
  return findUserByEmail(ADMIN_EMAIL);
}

function buildUserPayload(user) {
  return {
    email: user.email,
    name: user.name || 'Admin',
    provider: user.provider,
  };
}

router.get('/config', (req, res) => {
  res.json({ success: true, googleClientId });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const admin = await getOrCreateAdmin();
      return res.json({ success: true, data: buildUserPayload(admin) });
    }
    return res.status(401).json({ success: false, error: 'Invalid credentials.' });
  }

  const passwordMatches = await compareHash(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ success: false, error: 'Invalid credentials.' });
  }

  return res.json({ success: true, data: buildUserPayload(user) });
});

router.post('/google', async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) {
    return res.status(400).json({ success: false, error: 'Google token is required.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientId });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name || '';

    if (!email) {
      return res.status(400).json({ success: false, error: 'Google token did not return an email.' });
    }

    let user = await findUserByEmail(email);
    if (!user) {
      user = await createOrUpdateUser({ email, name, provider: 'google' });
    }

    return res.json({ success: true, data: buildUserPayload(user) });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(400).json({ success: false, error: 'Unable to verify Google ID token.' });
  }
});

router.post('/request-email-otp', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account found for that email.' });
  }

  const code = generateOtpCode(6);
  await storeOtp(email, 'email_login', code);
  await sendEmail(email, 'Rohini Foods login OTP', `Your one-time login code is: ${code}\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.`);

  res.json({ success: true, message: 'OTP sent to your email.' });
});

router.post('/request-mobile-otp', async (req, res) => {
  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  const user = await findUserByPhone(phone);
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account found for that phone number.' });
  }

  const code = generateOtpCode(6);
  await storeOtp(phone, 'mobile_login', code);
  sendSmsPlaceholder(phone, code);

  res.json({ success: true, message: 'OTP sent to your mobile number.' });
});

router.post('/request-reset-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account found for that email.' });
  }

  const code = generateOtpCode(6);
  await storeOtp(email, 'reset_password', code);
  await sendEmail(email, 'Rohini Foods password reset code', `Your password reset code is: ${code}\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.`);

  res.json({ success: true, message: 'Password reset OTP sent to your email.' });
});

router.post('/verify-otp', async (req, res) => {
  const { target, code, type } = req.body || {};
  if (!target || !code || !type) {
    return res.status(400).json({ success: false, error: 'Target, code, and type are required.' });
  }

  const otp = await getValidOtp(target, type);
  if (!otp) {
    return res.status(400).json({ success: false, error: 'OTP is invalid or has expired.' });
  }

  if (otp.attempts >= 5) {
    return res.status(429).json({ success: false, error: 'Too many incorrect OTP attempts. Request a new code.' });
  }

  const match = await compareHash(code, otp.code_hash);
  if (!match) {
    await db.run('UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?', [otp.id]);
    return res.status(400).json({ success: false, error: 'Invalid OTP code.' });
  }

  await markOtpUsed(otp.id);

  const user = type === 'mobile_login' ? await findUserByPhone(target) : await findUserByEmail(target);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found.' });
  }

  return res.json({ success: true, data: buildUserPayload(user) });
});

router.post('/reset-password', async (req, res) => {
  const { target, code, newPassword, type } = req.body || {};
  if (!target || !code || !newPassword || type !== 'reset_password') {
    return res.status(400).json({ success: false, error: 'Target, code, new password, and correct type are required.' });
  }

  const otp = await getValidOtp(target, type);
  if (!otp) {
    return res.status(400).json({ success: false, error: 'OTP is invalid or has expired.' });
  }

  const match = await compareHash(code, otp.code_hash);
  if (!match) {
    await db.run('UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?', [otp.id]);
    return res.status(400).json({ success: false, error: 'Invalid OTP code.' });
  }

  const user = await findUserByEmail(target);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found.' });
  }

  const hashedPassword = await hashValue(newPassword);
  await db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, target]);
  await markOtpUsed(otp.id);

  res.json({ success: true, message: 'Password has been reset successfully.' });
});

module.exports = router;