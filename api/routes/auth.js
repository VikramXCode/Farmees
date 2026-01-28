// Auth Routes for Vercel API
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, password, role, district, area } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    
    // Prevent signup with demo phone numbers
    const demoPhones = ['9999000001', '9999000002', '9999000003'];
    if (demoPhones.includes(phone)) {
      return res.status(403).json({ error: 'This phone number is reserved for demo accounts. Please use different credentials.' });
    }
    
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered.' });
    }
    
    const userRole = role || 'farmer';
    const user = new User({ 
      name, 
      phone, 
      password, 
      role: userRole,
      district: district || 'Coimbatore',
      area: area || 'Pollachi'
    });
    await user.save();
    
    res.status(201).json({ id: user._id, name: user.name, phone: user.phone, role: user.role });
  } catch (err) {
    console.error('Signup error:', err);
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
    
    // Force isDemo flag for demo credentials
    const demoPhones = ['9999000001', '9999000002', '9999000003'];
    const isDemo = demoPhones.includes(user.phone) ? true : (user.isDemo || false);

    // Ensure demo accounts return the correct role
    const demoRoleByPhone = {
      '9999000001': 'farmer',
      '9999000002': 'coordinator',
      '9999000003': 'worker'
    };
    const effectiveRole = (isDemo && demoRoleByPhone[user.phone]) ? demoRoleByPhone[user.phone] : user.role;
    
    res.json({ 
      id: user._id, 
      name: user.name, 
      phone: user.phone, 
      role: effectiveRole,
      isDemo: isDemo,
      district: user.district || 'Coimbatore',
      area: user.area || 'Pollachi'
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
