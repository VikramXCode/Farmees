const express = require('express');
const Escalation = require('../models/Escalation');
const Officer = require('../models/Officer');
const Land = require('../models/Land');
const { matchOfficer } = require('../services/officerMatchingService');
const router = express.Router();

// Create escalation and auto-assign officer
router.post('/', async (req, res) => {
  try {
    const { userId, landId, query, context, suggestions, district, state, priority } = req.body;
    if (!userId || !query) return res.status(400).json({ success: false, error: 'userId and query are required' });

    let resolvedDistrict = district;
    let resolvedState = state;
    let landRef = null;
    if (landId) {
      // Try by _id then by landId field
      let land = null;
      if (landId.match(/^[0-9a-fA-F]{24}$/)) {
        land = await Land.findById(landId).lean();
      }
      if (!land) {
        land = await Land.findOne({ landId: landId }).lean();
      }
      if (land) {
        landRef = land._id;
        // Try to parse district/state from 'location' string: e.g., 'Kochi, Kerala'
        if (typeof land.location === 'string') {
          const parts = land.location.split(',').map(s => s.trim());
          if (!resolvedDistrict && parts.length > 0) resolvedDistrict = parts[0];
          if (!resolvedState && parts.length > 1) resolvedState = parts[parts.length - 1];
        }
      }
    }

    let officer = await matchOfficer({ district: resolvedDistrict, state: resolvedState });
    if (!officer) officer = await Officer.findOne({ isActive: true }).lean();

    const doc = await Escalation.create({ userId, landId, landRef, officerId: officer?._id, query, context, suggestions, district: resolvedDistrict, state: resolvedState, status: officer ? 'assigned' : 'pending', priority });

    // Notification stub
    if (officer) {
      console.log(`[Escalation] Assigned to ${officer.name} (${officer.email || officer.phone || 'no-contact'})`);
    }

    res.status(201).json({ success: true, escalation: doc, officer });
  } catch (err) {
    console.error('Create escalation error', err);
    res.status(500).json({ success: false, error: 'Failed to create escalation' });
  }
});

// List escalations (optionally by user)
router.get('/', async (req, res) => {
  try {
    const { userId, status } = req.query;
    const q = {};
    if (userId) q.userId = userId;
    if (status) q.status = status;
    const list = await Escalation.find(q).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: list.length, escalations: list });
  } catch (err) {
    console.error('List escalations error', err);
    res.status(500).json({ success: false, error: 'Failed to fetch escalations' });
  }
});

// Update status or notes
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes, officerId } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes) update.notes = notes;
    if (officerId) update.officerId = officerId;
    const doc = await Escalation.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    res.json({ success: true, escalation: doc });
  } catch (err) {
    console.error('Update escalation error', err);
    res.status(500).json({ success: false, error: 'Failed to update escalation' });
  }
});

module.exports = router;
