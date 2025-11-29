// Auth Routes: Signup & Signin
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered.' });
    }
    const user = new User({ name, phone, password });
    await user.save();
    res.status(201).json({ id: user._id, name: user.name, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Signin Route
router.post('/signin', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required.' });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password.' });
    }
    res.json({ id: user._id, name: user.name, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
