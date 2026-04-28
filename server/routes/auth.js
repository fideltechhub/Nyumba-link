const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { run, all, get } = require('../db');
const { authenticate, SECRET } = require('../middleware/auth');

let transporterPromise;
async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    }));
  } else {
    transporterPromise = nodemailer.createTestAccount().then(account => nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: account.user, pass: account.pass }
    }));
  }
  return transporterPromise;
}

async function sendVerificationEmail(email, url) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: 'NyumbaLink <no-reply@nyumbalink.local>',
    to: email,
    subject: 'Verify your NyumbaLink email',
    html: `<p>Welcome to NyumbaLink!</p><p>Please verify your email by clicking the link below:</p><p><a href="${url}">${url}</a></p>`
  });
  if (process.env.SMTP_HOST) return;
  console.log('Verification email preview URL:', nodemailer.getTestMessageUrl(info));
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, national_id } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Name, email, password, and role are required' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Please provide a valid email address' });
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) return res.status(400).json({ error: 'Phone number must contain exactly 10 digits' });
    }
    if (national_id) {
      const idDigits = national_id.replace(/\D/g, '');
      if (idDigits.length < 8 || idDigits.length > 9) return res.status(400).json({ error: 'National ID must be 8 or 9 digits' });
    }
    if (password.length < 6 || password.length > 16) return res.status(400).json({ error: 'Password must be between 6 and 16 characters' });
    if (!['tenant', 'caretaker'].includes(role)) return res.status(400).json({ error: 'Role must be tenant or caretaker' });

    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, phone, password, role, national_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, hash, role, national_id || null, 1]
    );

    res.status(201).json({ message: 'Registration successful. You can now log in.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const user = await get('SELECT id FROM users WHERE email_token = ?', [req.params.token]);
    if (!user) return res.status(404).json({ error: 'Invalid or expired verification link.' });
    await run('UPDATE users SET is_verified = 1, email_token = NULL WHERE id = ?', [user.id]);
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Please provide a valid email address' });

    const user = await get('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_verified) return res.status(400).json({ error: 'Email already verified' });

    const emailToken = uuidv4();
    await run('UPDATE users SET email_token = ? WHERE id = ?', [emailToken, user.id]);

    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${emailToken}`;
    await sendVerificationEmail(email, verifyUrl);

    res.json({ message: 'Verification email sent. Please check your email.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.is_suspended) return res.status(403).json({ error: 'Account suspended. Contact admin.' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
    const { password: _, ...safe } = user;
    res.json({ token, user: safe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, phone, role, is_verified, national_id, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
