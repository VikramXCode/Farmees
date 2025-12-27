// Labour Coordination Routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isDemoUser } = require('../middleware/demoMode');

const User = require('../models/User');
const Coordinator = require('../models/Coordinator');
const Worker = require('../models/Worker');
const LabourRequest = require('../models/LabourRequest');
const LabourLog = require('../models/LabourLog');
const Land = require('../models/Land');

// Reset demo requests to fresh state
async function resetDemoRequests() {
  try {
    // Delete existing demo requests
    await LabourRequest.deleteMany({ isDemo: true });
    
    // Get demo farmer and coordinator
    const demoFarmer = await User.findOne({ phone: '9999000001', isDemo: true });
    const demoCoordinator = await Coordinator.findOne({ isDemo: true }).sort({ createdAt: 1 });
    
    if (!demoFarmer || !demoCoordinator) return;
    
    const demoLand = await Land.findOne({ userId: demoFarmer._id.toString(), isDemo: true });
    if (!demoLand) return;
    
    // Recreate 3 fresh requests
    const requests = [
      {
        farmerId: demoFarmer._id,
        landId: demoLand.landId,
        workType: 'harvesting',
        workersNeeded: 3,
        workDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startTime: '07:00',
        duration: 8,
        description: 'Need workers for paddy harvesting',
        location: { district: 'Coimbatore', area: 'Pollachi', coordinates: { lat: 10.6593, lng: 77.0068 } },
        coordinatorId: demoCoordinator._id,
        status: 'pending',
        isDemo: true
      },
      {
        farmerId: demoFarmer._id,
        landId: demoLand.landId,
        workType: 'sowing',
        workersNeeded: 2,
        workDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        startTime: '06:00',
        duration: 6,
        description: 'Seed sowing work needed',
        location: { district: 'Coimbatore', area: 'Pollachi', coordinates: { lat: 10.6593, lng: 77.0068 } },
        coordinatorId: demoCoordinator._id,
        status: 'accepted',
        coordinatorAcceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isDemo: true
      },
      {
        farmerId: demoFarmer._id,
        landId: demoLand.landId,
        workType: 'weeding',
        workersNeeded: 4,
        workDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        startTime: '07:00',
        duration: 6,
        description: 'Weeding required in rice field',
        location: { district: 'Coimbatore', area: 'Pollachi', coordinates: { lat: 10.6593, lng: 77.0068 } },
        coordinatorId: demoCoordinator._id,
        status: 'assigned',
        coordinatorAcceptedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        assignedWorkers: [],
        isDemo: true
      }
    ];
    
    const createdRequests = await LabourRequest.insertMany(requests);
    
    // Assign workers to the 3rd request
    const workers = await Worker.find({ coordinatorId: demoCoordinator._id, isDemo: true }).limit(4);
    if (workers.length >= 4 && createdRequests[2]) {
      const assignedRequest = createdRequests[2];
      for (let i = 0; i < 4; i++) {
        assignedRequest.assignedWorkers.push({
          workerId: workers[i]._id,
          assignedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          status: 'confirmed'
        });
      }
      await assignedRequest.save();
    }
    
    console.log('✓ Reset demo requests to fresh state');
  } catch (err) {
    console.error('Error resetting demo requests:', err);
  }
}

// Work types constant
const WORK_TYPES = [
  'land_preparation',
  'sowing',
  'transplanting',
  'weeding',
  'fertilizing',
  'pest_control',
  'irrigation',
  'harvesting',
  'post_harvest',
  'general'
];

// ============================================
// COORDINATOR MANAGEMENT
// ============================================

// Register as Coordinator
router.post('/coordinators/register', async (req, res) => {
  try {
    const { userId, name, phone, location, serviceRadius, skillsOffered } = req.body;
    
    if (!userId || !name || !phone || !location?.district || !location?.area) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already a coordinator
    const existing = await Coordinator.findOne({ userId });
    if (existing) {
      return res.status(409).json({ error: 'User is already a coordinator' });
    }
    
    // Create coordinator profile
    const coordinator = new Coordinator({
      userId,
      name,
      phone,
      location,
      serviceRadius: serviceRadius || 25,
      skillsOffered: skillsOffered || WORK_TYPES
    });
    
    await coordinator.save();
    
    // Update user role
    user.role = 'coordinator';
    await user.save();
    
    res.status(201).json({ 
      success: true, 
      coordinator,
      message: 'Registered as coordinator successfully'
    });
  } catch (err) {
    console.error('Coordinator registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Coordinator Profile
router.get('/coordinators/profile/:userId', async (req, res) => {
  try {
    const coordinator = await Coordinator.findOne({ userId: req.params.userId });
    if (coordinator) {
      // Demo mode: reset demo requests to fresh state for demo
      if (req.isDemo) {
        await resetDemoRequests();
      }
      return res.json({ success: true, coordinator });
    }

    // Demo-mode fallback: the frontend may have an old userId cached in localStorage.
    // If demo mode is enabled, return any demo coordinator profile instead of 404.
    if (req.isDemo) {
      const demoCoordinator = await Coordinator.findOne({ isDemo: true }).sort({ createdAt: 1 });
      if (demoCoordinator) {
        await resetDemoRequests();
        return res.json({ success: true, coordinator: demoCoordinator });
      }
    }

    return res.status(404).json({ error: 'Coordinator not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Coordinator Profile
router.put('/coordinators/profile/:userId', async (req, res) => {
  try {
    const { location, serviceRadius, skillsOffered, isActive } = req.body;
    
    let coordinator = await Coordinator.findOne({ userId: req.params.userId });
    if (!coordinator && req.isDemo) {
      coordinator = await Coordinator.findOne({ isDemo: true }).sort({ createdAt: 1 });
    }
    if (!coordinator) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }
    
    if (location) coordinator.location = location;
    if (serviceRadius) coordinator.serviceRadius = serviceRadius;
    if (skillsOffered) coordinator.skillsOffered = skillsOffered;
    if (typeof isActive === 'boolean') coordinator.isActive = isActive;
    
    await coordinator.save();
    res.json({ success: true, coordinator });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Find Nearby Coordinators (for farmers)
router.get('/coordinators/nearby', async (req, res) => {
  try {
    // Demo mode - return demo coordinator
    if (req.isDemo) {
      const demoCoordinator = await Coordinator.findOne({ isDemo: true }).select('-__v');
      return res.json({ success: true, coordinators: demoCoordinator ? [demoCoordinator] : [] });
    }

    const { district, area, workType } = req.query;
    
    if (!district) {
      return res.status(400).json({ error: 'District is required' });
    }
    
    const query = {
      'location.district': district,
      isActive: true
    };
    
    if (workType) {
      query.skillsOffered = workType;
    }
    
    const coordinators = await Coordinator.find(query)
      .sort({ reliabilityScore: -1 })
      .limit(10)
      .select('-__v');
    
    res.json({ success: true, coordinators });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Coordinator Stats
router.get('/coordinators/:id/stats', async (req, res) => {
  try {
    const coordinator = await Coordinator.findById(req.params.id);
    if (!coordinator) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }
    
    const workerCount = await Worker.countDocuments({ 
      coordinatorId: coordinator._id, 
      isActive: true 
    });
    
    const recentRequests = await LabourRequest.countDocuments({
      coordinatorId: coordinator._id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      success: true,
      stats: {
        reliabilityScore: coordinator.reliabilityScore,
        totalRequestsHandled: coordinator.totalRequestsHandled,
        successfulCompletions: coordinator.successfulCompletions,
        replacementsProvided: coordinator.replacementsProvided,
        failedCommitments: coordinator.failedCommitments,
        workerCount,
        recentRequests
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WORKER MANAGEMENT (Coordinator Only)
// ============================================

// Add Worker to Pool
router.post('/workers', async (req, res) => {
  try {
    const { coordinatorId, name, phone, skills, availability, isStandby } = req.body;
    
    if (!coordinatorId || !name || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const coordinator = await Coordinator.findById(coordinatorId);
    if (!coordinator) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }
    
    const worker = new Worker({
      coordinatorId,
      name,
      phone,
      skills: skills || [{ type: 'general', experienceYears: 0 }],
      availability: availability || {},
      isStandby: isStandby || false
    });
    
    await worker.save();
    
    // Update coordinator worker count
    coordinator.workerCount = await Worker.countDocuments({ 
      coordinatorId, 
      isActive: true 
    });
    await coordinator.save();
    
    res.status(201).json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Workers for Coordinator
router.get('/workers', async (req, res) => {
  try {
    const { coordinatorId, skill, standbyOnly } = req.query;
    
    if (!coordinatorId) {
      return res.status(400).json({ error: 'coordinatorId is required' });
    }
    
    const query = { coordinatorId, isActive: true };
    
    if (skill) {
      query['skills.type'] = skill;
    }
    if (standbyOnly === 'true') {
      query.isStandby = true;
    }
    
    const workers = await Worker.find(query)
      .sort({ reliabilityScore: -1 })
      .select('-__v');
    
    res.json({ success: true, workers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Worker
router.put('/workers/:id', async (req, res) => {
  try {
    const { name, phone, skills, availability, isStandby, isActive } = req.body;
    
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    if (name) worker.name = name;
    if (phone) worker.phone = phone;
    if (skills) worker.skills = skills;
    if (availability) worker.availability = { ...worker.availability, ...availability };
    if (typeof isStandby === 'boolean') worker.isStandby = isStandby;
    if (typeof isActive === 'boolean') worker.isActive = isActive;
    
    await worker.save();
    
    // Update coordinator worker count if status changed
    if (typeof isActive === 'boolean') {
      const coordinator = await Coordinator.findById(worker.coordinatorId);
      if (coordinator) {
        coordinator.workerCount = await Worker.countDocuments({ 
          coordinatorId: worker.coordinatorId, 
          isActive: true 
        });
        await coordinator.save();
      }
    }
    
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Worker (soft delete)
router.delete('/workers/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    worker.isActive = false;
    await worker.save();
    
    // Update coordinator worker count
    const coordinator = await Coordinator.findById(worker.coordinatorId);
    if (coordinator) {
      coordinator.workerCount = await Worker.countDocuments({ 
        coordinatorId: worker.coordinatorId, 
        isActive: true 
      });
      await coordinator.save();
    }
    
    res.json({ success: true, message: 'Worker removed from pool' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Available Workers for a Date
router.get('/workers/available', async (req, res) => {
  try {
    const { coordinatorId, date, workType } = req.query;
    
    if (!coordinatorId || !date) {
      return res.status(400).json({ error: 'coordinatorId and date are required' });
    }
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[new Date(date).getDay()];
    
    const query = {
      coordinatorId,
      isActive: true,
      [`availability.${dayName}`]: true
    };
    
    if (workType) {
      query['skills.type'] = workType;
    }
    
    // Get workers already assigned on this date
    const assignedWorkerIds = await LabourRequest.find({
      coordinatorId,
      workDate: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
      },
      status: { $in: ['accepted', 'assigned', 'in_progress'] }
    }).distinct('assignedWorkers.workerId');
    
    query._id = { $nin: assignedWorkerIds };
    
    const workers = await Worker.find(query)
      .sort({ reliabilityScore: -1 })
      .select('-__v');
    
    res.json({ success: true, workers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// LABOUR REQUESTS (Farmer)
// ============================================

// Create Labour Request
router.post('/requests', async (req, res) => {
  try {
    const { farmerId, landId, workType, workersNeeded, workDate, startTime, duration, description } = req.body;
    
    if (!farmerId || !landId || !workType || !workersNeeded || !workDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get land details for location
    const land = await Land.findOne({ landId });
    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }
    
    // Find best matching coordinator
    const coordinators = await Coordinator.find({
      isActive: true,
      skillsOffered: workType
    }).sort({ reliabilityScore: -1 });
    
    if (coordinators.length === 0) {
      return res.status(404).json({ error: 'No coordinators available for this work type' });
    }
    
    // Auto-assign to best coordinator (can be changed to manual selection)
    const coordinator = coordinators[0];
    
    const request = new LabourRequest({
      farmerId,
      landId,
      workType,
      workersNeeded,
      workDate: new Date(workDate),
      startTime: startTime || '07:00',
      duration: duration || 8,
      description,
      location: {
        district: land.location?.split(',')[0]?.trim() || '',
        area: land.location || ''
      },
      coordinatorId: coordinator._id
    });
    
    await request.save();
    
    // Log event
    await LabourLog.logEvent(request._id, 'request_created', 'farmer', null, {
      workerCount: workersNeeded
    });
    await LabourLog.logEvent(request._id, 'coordinator_assigned', 'system', coordinator._id, {});
    
    res.status(201).json({ 
      success: true, 
      request,
      coordinator: {
        id: coordinator._id,
        name: coordinator.name,
        phone: coordinator.phone,
        reliabilityScore: coordinator.reliabilityScore
      }
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List Farmer's Requests
router.get('/requests', async (req, res) => {
  try {
    const { farmerId, status } = req.query;
    
    if (!farmerId) {
      return res.status(400).json({ error: 'farmerId is required' });
    }
    
    // Demo mode - return demo requests
    if (req.isDemo) {
      const requests = await LabourRequest.find({ isDemo: true })
        .populate('coordinatorId', 'name phone reliabilityScore')
        .sort({ createdAt: -1 })
        .select('-__v');
      return res.json({ success: true, requests });
    }
    
    const query = { farmerId };
    if (status) {
      query.status = status;
    }
    
    const requests = await LabourRequest.find(query)
      .populate('coordinatorId', 'name phone reliabilityScore')
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Request Details
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await LabourRequest.findById(req.params.id)
      .populate('coordinatorId', 'name phone reliabilityScore')
      .populate('assignedWorkers.workerId', 'name phone reliabilityScore skills')
      .populate('standbyWorkers', 'name phone reliabilityScore');
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Request (Farmer)
router.put('/requests/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (['completed', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ error: 'Cannot cancel this request' });
    }
    
    request.status = 'cancelled';
    request.cancelledAt = new Date();
    request.cancellationReason = reason || 'Cancelled by farmer';
    await request.save();
    
    await LabourLog.logEvent(request._id, 'request_cancelled', 'farmer', request.coordinatorId, {
      reason: request.cancellationReason
    });
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm Work Completion (Farmer)
router.put('/requests/:id/confirm', async (req, res) => {
  try {
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'completed') {
      return res.status(400).json({ error: 'Work must be marked completed by coordinator first' });
    }
    
    request.farmerConfirmed = true;
    request.farmerConfirmedAt = new Date();
    await request.save();
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Feedback (Farmer)
router.put('/requests/:id/feedback', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'completed') {
      return res.status(400).json({ error: 'Can only provide feedback for completed requests' });
    }
    
    request.farmerRating = rating;
    request.farmerFeedback = feedback;
    await request.save();
    
    await LabourLog.logEvent(request._id, 'feedback_submitted', 'farmer', request.coordinatorId, {
      rating
    });
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// LABOUR REQUESTS (Coordinator)
// ============================================

// List Coordinator's Incoming Requests
router.get('/coordinator/requests', async (req, res) => {
  try {
    const { coordinatorId, status } = req.query;
    
    if (!coordinatorId) {
      return res.status(400).json({ error: 'coordinatorId is required' });
    }
        // Demo mode - return demo requests
    if (req.isDemo) {
      const requests = await LabourRequest.find({ isDemo: true })
        .populate('farmerId', 'name phone district area')
        .sort({ createdAt: -1 })
        .select('-__v');
      return res.json({ success: true, requests });
    }
        const query = { coordinatorId };
    if (status) {
      query.status = status;
    }
    
    const requests = await LabourRequest.find(query)
      .populate('assignedWorkers.workerId', 'name phone reliabilityScore')
      .sort({ workDate: 1 })
      .select('-__v');
    
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept Request (Coordinator)
router.put('/coordinator/requests/:id/accept', async (req, res) => {
  try {
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }
    
    request.status = 'accepted';
    request.coordinatorAcceptedAt = new Date();
    await request.save();
    
    await LabourLog.logEvent(request._id, 'coordinator_accepted', 'coordinator', request.coordinatorId, {});
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Decline Request (Coordinator)
router.put('/coordinator/requests/:id/decline', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Try to find another coordinator
    const otherCoordinator = await Coordinator.findOne({
      _id: { $ne: request.coordinatorId },
      isActive: true,
      skillsOffered: request.workType
    }).sort({ reliabilityScore: -1 });
    
    if (otherCoordinator) {
      request.coordinatorId = otherCoordinator._id;
      request.status = 'pending';
      await request.save();
      
      await LabourLog.logEvent(request._id, 'coordinator_declined', 'coordinator', request.coordinatorId, {
        reason
      });
      await LabourLog.logEvent(request._id, 'coordinator_assigned', 'system', otherCoordinator._id, {});
      
      res.json({ 
        success: true, 
        message: 'Request reassigned to another coordinator',
        newCoordinator: {
          id: otherCoordinator._id,
          name: otherCoordinator.name
        }
      });
    } else {
      request.status = 'failed';
      request.cancellationReason = 'No coordinator available';
      await request.save();
      
      try {
        await LabourLog.logEvent(request._id, 'request_failed', 'system', null, {
          reason: 'No coordinator available'
        });
      } catch (logErr) {
        console.error('Failed to log event:', logErr);
      }
      
      res.json({ 
        success: false, 
        message: 'No other coordinator available. Request marked as failed.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign Workers (Coordinator)
router.put('/coordinator/requests/:id/assign', async (req, res) => {
  try {
    const { workerIds, standbyWorkerIds } = req.body;
    
    if (!workerIds || !Array.isArray(workerIds) || workerIds.length === 0) {
      return res.status(400).json({ error: 'Worker IDs are required' });
    }
    
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (!['accepted', 'assigned'].includes(request.status)) {
      return res.status(400).json({ error: 'Request must be accepted first' });
    }
    
    // Validate workers belong to coordinator
    const workers = await Worker.find({
      _id: { $in: workerIds },
      coordinatorId: request.coordinatorId,
      isActive: true
    });
    
    if (workers.length !== workerIds.length) {
      return res.status(400).json({ error: 'Some workers are invalid or not yours' });
    }
    
    // Assign workers
    request.assignedWorkers = workerIds.map(id => ({
      workerId: id,
      status: 'assigned',
      assignedAt: new Date()
    }));
    
    // Assign standby workers if provided
    if (standbyWorkerIds && Array.isArray(standbyWorkerIds)) {
      request.standbyWorkers = standbyWorkerIds;
    }
    
    request.status = 'assigned';
    await request.save();
    
    // Log each worker assignment
    for (const workerId of workerIds) {
      await LabourLog.logEvent(request._id, 'worker_assigned', 'coordinator', request.coordinatorId, {
        workerId
      });
    }
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Replacement Suggestions
router.get('/coordinator/requests/:id/suggestions', async (req, res) => {
  try {
    const { cancelledWorkerId } = req.query;
    
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[new Date(request.workDate).getDay()];
    
    // Get currently assigned worker IDs
    const assignedIds = request.assignedWorkers
      .filter(w => ['assigned', 'confirmed'].includes(w.status))
      .map(w => w.workerId.toString());
    
    // 1. Standby workers first
    const standbyWorkers = await Worker.find({
      _id: { $in: request.standbyWorkers },
      isActive: true,
      [`availability.${dayName}`]: true
    }).sort({ reliabilityScore: -1 });
    
    // 2. Other available workers with matching skill
    const availableWorkers = await Worker.find({
      coordinatorId: request.coordinatorId,
      'skills.type': request.workType,
      isActive: true,
      _id: { $nin: [...assignedIds, ...request.standbyWorkers.map(id => id.toString())] },
      [`availability.${dayName}`]: true
    }).sort({ reliabilityScore: -1 }).limit(5);
    
    await LabourLog.logEvent(request._id, 'replacement_suggested', 'system', request.coordinatorId, {
      previousWorkerId: cancelledWorkerId
    });
    
    res.json({
      success: true,
      suggestions: {
        standby: standbyWorkers,
        available: availableWorkers
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Replace Worker (Coordinator)
router.put('/coordinator/requests/:id/replace', async (req, res) => {
  try {
    const { cancelledWorkerId, newWorkerId, reason } = req.body;
    
    if (!cancelledWorkerId || !newWorkerId) {
      return res.status(400).json({ error: 'Both worker IDs are required' });
    }
    
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Find and update cancelled worker
    const workerIndex = request.assignedWorkers.findIndex(
      w => w.workerId.toString() === cancelledWorkerId
    );
    
    if (workerIndex === -1) {
      return res.status(404).json({ error: 'Worker not found in this request' });
    }
    
    // Mark as replaced
    request.assignedWorkers[workerIndex].status = 'replaced';
    request.assignedWorkers[workerIndex].replacedBy = newWorkerId;
    request.assignedWorkers[workerIndex].replacedAt = new Date();
    request.assignedWorkers[workerIndex].cancellationReason = reason;
    
    // Add new worker
    request.assignedWorkers.push({
      workerId: newWorkerId,
      status: 'assigned',
      assignedAt: new Date()
    });
    
    await request.save();
    
    // Update worker stats
    const cancelledWorker = await Worker.findById(cancelledWorkerId);
    if (cancelledWorker) {
      cancelledWorker.cancelledAssignments += 1;
      cancelledWorker.updateReliabilityScore();
      await cancelledWorker.save();
    }
    
    // Update coordinator stats
    const coordinator = await Coordinator.findById(request.coordinatorId);
    if (coordinator) {
      coordinator.replacementsProvided += 1;
      coordinator.updateReliabilityScore();
      await coordinator.save();
    }
    
    await LabourLog.logEvent(request._id, 'worker_cancelled', 'coordinator', request.coordinatorId, {
      workerId: cancelledWorkerId,
      reason
    });
    await LabourLog.logEvent(request._id, 'replacement_made', 'coordinator', request.coordinatorId, {
      workerId: newWorkerId,
      previousWorkerId: cancelledWorkerId
    });
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Work Started (Coordinator)
router.put('/coordinator/requests/:id/start', async (req, res) => {
  try {
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'assigned') {
      return res.status(400).json({ error: 'Request must be assigned first' });
    }
    
    request.status = 'in_progress';
    request.workStartedAt = new Date();
    await request.save();
    
    await LabourLog.logEvent(request._id, 'work_started', 'coordinator', request.coordinatorId, {});
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Work Completed (Coordinator)
router.put('/coordinator/requests/:id/complete', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const request = await LabourRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'in_progress') {
      return res.status(400).json({ error: 'Work must be started first' });
    }
    
    request.status = 'completed';
    request.workCompletedAt = new Date();
    
    // Mark all active workers as completed
    request.assignedWorkers.forEach(w => {
      if (['assigned', 'confirmed'].includes(w.status)) {
        w.status = 'completed';
      }
    });
    
    await request.save();
    
    // Update worker stats
    for (const worker of request.assignedWorkers) {
      if (worker.status === 'completed') {
        const w = await Worker.findById(worker.workerId);
        if (w) {
          w.totalAssignments += 1;
          w.completedAssignments += 1;
          w.updateReliabilityScore();
          await w.save();
        }
      }
    }
    
    // Update coordinator stats
    const coordinator = await Coordinator.findById(request.coordinatorId);
    if (coordinator) {
      coordinator.totalRequestsHandled += 1;
      coordinator.successfulCompletions += 1;
      coordinator.updateReliabilityScore();
      await coordinator.save();
    }
    
    await LabourLog.logEvent(request._id, 'work_completed', 'coordinator', request.coordinatorId, {
      notes
    });
    
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// LOGS & TRACKING
// ============================================

// Get Request Logs
router.get('/requests/:id/logs', async (req, res) => {
  try {
    const logs = await LabourLog.find({ requestId: req.params.id })
      .populate('eventData.workerId', 'name')
      .populate('eventData.previousWorkerId', 'name')
      .sort({ timestamp: -1 });
    
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Worker's Assigned Requests by Phone
router.get('/workers/my-assignments', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Find worker by phone
    const worker = await Worker.findOne({ phone });
    if (!worker) {
      return res.json({ success: true, requests: [] });
    }

    // Find all requests where this worker is assigned
    const requests = await LabourRequest.find({
      'assignedWorkers.workerId': worker._id,
      status: { $in: ['assigned', 'in_progress', 'completed'] }
    })
      .populate('farmerId', 'name phone district area')
      .populate('coordinatorId', 'name phone')
      .populate('assignedWorkers.workerId', 'name phone reliabilityScore')
      .sort({ workDate: 1 })
      .select('-__v');

    res.json({ success: true, requests, worker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Worker's Own Availability by Phone
router.put('/workers/my-availability', async (req, res) => {
  try {
    const { phone, availability } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!availability) {
      return res.status(400).json({ error: 'Availability data is required' });
    }

    // Find worker by phone
    const worker = await Worker.findOne({ phone });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Update availability
    worker.availability = { ...worker.availability, ...availability };
    await worker.save();

    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Work Types
router.get('/work-types', (req, res) => {
  res.json({
    success: true,
    workTypes: WORK_TYPES.map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  });
});

module.exports = router;
