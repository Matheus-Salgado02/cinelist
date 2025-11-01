import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const router = express.Router();

// Register - accept email or username + password, return user object (no token)
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, name } = req.body || {};
    // sanitize: treat empty strings or non-strings as absent
    const clean = (v) => (typeof v === 'string' && v.trim() !== '') ? v.trim() : undefined;
    const cleanEmail = clean(email);
    const cleanUsername = clean(username);

    if ((!cleanEmail && !cleanUsername) || !password) return res.status(400).json({ message: 'email/username and password required' });

    const exists = cleanEmail ? await User.findOne({ email: cleanEmail }) : await User.findOne({ username: cleanUsername });
    if (exists) return res.status(409).json({ message: 'User already in use' });

    const payload = { password };
    if (cleanEmail) payload.email = cleanEmail;
    if (cleanUsername) payload.username = cleanUsername;
    if (name) payload.name = name;

  const user = await User.create(payload);
  const safe = user.toObject(); delete safe.password;
  // issue token
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  return res.status(201).json({ user: safe, token });
  } catch (err) {
    console.error('Register error:', err && err.stack ? err.stack : err);
    // friendly response for duplicate key
    if (err && err.code === 11000) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
      return res.status(409).json({ message: `Duplicate ${field}` });
    }
    return res.status(500).json({ message: 'Could not register', info: (err && err.message) || String(err) });
  }
});

// Login - accept email or username + password, return user object (no token)
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if ((!email && !username) || !password) return res.status(400).json({ message: 'email/username and password required' });
    const user = email ? await User.findOne({ email }) : await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  const safe = user.toObject(); delete safe.password;
  // issue token
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ user: safe, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not login' });
  }
});

// Me - try token if provided, otherwise accept credentials in body
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json({ user });
    } catch (err) {
      // fallthrough to credential method
    }
  }

  const { email, username, password } = req.body || {};
  if ((!email && !username) || !password) return res.status(401).json({ message: 'No token and no credentials provided' });
  try {
    const user = email ? await User.findOne({ email }) : await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const safe = user.toObject(); delete safe.password;
    return res.json({ user: safe });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update profile - protected by token
router.put('/me', requireAuth, async (req, res) => {
  try {
    const updates = req.body || {};
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
