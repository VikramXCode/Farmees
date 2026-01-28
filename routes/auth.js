// Auth Routes: Signup & Signin
import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import Worker from '../models/Worker.js';
import Coordinator from '../models/Coordinator.js';

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
      } else {
        console.warn(`Worker ${user.phone} created but no coordinator available to assign`);
      }
    }

    // Auto-create Coordinator profile if role is 'coordinator'
    if (userRole === 'coordinator') {
      const coordinator = new Coordinator({
        userId: user._id,
        name: user.name,
        phone: user.phone,
        location: {
          district: user.district || 'Coimbatore',
          area: user.area || 'Pollachi'
        },
        skillsOffered: ['land_preparation', 'sowing', 'weeding', 'harvesting', 'general'], // Default skills
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

    // Ensure demo accounts return the correct role even if DB was seeded incorrectly
    const demoRoleByPhone = {
      '9999000001': 'farmer',
      '9999000002': 'coordinator',
      '9999000003': 'worker'
    };
    const effectiveRole = (isDemo && demoRoleByPhone[user.phone]) ? demoRoleByPhone[user.phone] : user.role;

    // Auto-create Worker profile if missing and role is 'worker'
    if (effectiveRole === 'worker' && !isDemo) {
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
        } else {
          console.warn(`Worker ${user.phone} needs Worker profile but no coordinator available`);
        }
      }
    }

    // Auto-create Coordinator profile if missing and role is 'coordinator'
    if (effectiveRole === 'coordinator' && !isDemo) {
      const existingCoordinator = await Coordinator.findOne({ userId: user._id });
      if (!existingCoordinator) {
        const coordinator = new Coordinator({
          userId: user._id,
          name: user.name,
          phone: user.phone,
          location: {
            district: user.district || 'Coimbatore',
            area: user.area || 'Pollachi'
          },
          skillsOffered: ['land_preparation', 'sowing', 'weeding', 'harvesting', 'general'], // Default skills
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
      role: effectiveRole,
      isDemo: isDemo,
      district: user.district || 'Coimbatore',
      area: user.area || 'Pollachi'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
