const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function sign(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    console.log('REGISTER attempt:', { username, email, role, hasPassword: !!password });
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, password required' });
    }
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(409).json({ error: 'Username or email already in use' });
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ username, email, passwordHash, role });
    const token = sign(user);
    res.status(201).json({ token, user: { id: user._id, username, email, role: user.role } });
  } catch (err) {
    console.error('REGISTER error:', err.message);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username & password required' });
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign(user);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
