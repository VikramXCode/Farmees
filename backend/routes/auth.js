// Auth Routes: Signup & Signin
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');
const Coordinator = require('../models/Coordinator');

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
    
    // Auto-create Worker profile if role is 'worker'
    if (userRole === 'worker') {
      // Find a coordinator to assign to (prefer one from same district, or use first available)
      let coordinator = await Coordinator.findOne({ district: user.district, isActive: true });
      if (!coordinator) {
        coordinator = await Coordinator.findOne({ isActive: true });
      }
      
      if (coordinator) {
        const worker = new Worker({
          coordinatorId: coordinator._id,
          name: user.name,
          phone: user.phone,
          skills: [], // Empty initially, worker can update via profile
          isActive: true,
          isDemo: false
        });
        await worker.save();
        
        // Update coordinator's worker count
        coordinator.workerCount = await Worker.countDocuments({ 
          coordinatorId: coordinator._id, 
          isActive: true 
        });
        await coordinator.save();
      }
    }
    
    // Auto-create Coordinator profile if role is 'coordinator'
    if (userRole === 'coordinator') {
      const coordinator = new Coordinator({
        userId: user._id,
        name: user.name,
        phone: user.phone,
        district: user.district,
        area: user.area,
        workerCount: 0,
        isActive: true,
        isDemo: false
      });
      await coordinator.save();
    }
    
    res.status(201).json({ id: user._id, name: user.name, phone: user.phone, role: user.role });
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
    
    // Force isDemo flag for demo credentials
    const demoPhones = ['9999000001', '9999000002', '9999000003'];
    const isDemo = demoPhones.includes(user.phone) ? true : (user.isDemo || false);
    
    // Auto-create Worker profile if missing and role is 'worker'
    if (user.role === 'worker' && !isDemo) {
      const existingWorker = await Worker.findOne({ phone: user.phone });
      if (!existingWorker) {
        // Find a coordinator to assign to
        let coordinator = await Coordinator.findOne({ district: user.district, isActive: true });
        if (!coordinator) {
          coordinator = await Coordinator.findOne({ isActive: true });
        }
        
        if (coordinator) {
          const worker = new Worker({
            coordinatorId: coordinator._id,
            name: user.name,
            phone: user.phone,
            skills: [],
            isActive: true,
            isDemo: false
          });
          await worker.save();
          
          // Update coordinator's worker count
          coordinator.workerCount = await Worker.countDocuments({ 
            coordinatorId: coordinator._id, 
            isActive: true 
          });
          await coordinator.save();
        }
      }
    }
    
    // Auto-create Coordinator profile if missing and role is 'coordinator'
    if (user.role === 'coordinator' && !isDemo) {
      const existingCoordinator = await Coordinator.findOne({ userId: user._id });
      if (!existingCoordinator) {
        const coordinator = new Coordinator({
          userId: user._id,
          name: user.name,
          phone: user.phone,
          district: user.district || 'Coimbatore',
          area: user.area || 'Pollachi',
          workerCount: 0,
          isActive: true,
          isDemo: false
        });
        await coordinator.save();
      }
    }
    
    res.json({ 
      id: user._id, 
      name: user.name, 
      phone: user.phone, 
      role: user.role,
      isDemo: isDemo,
      district: user.district || 'Coimbatore',
      area: user.area || 'Pollachi'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
