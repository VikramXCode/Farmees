// MongoDB Schema for Labour Request
const mongoose = require('mongoose');

const assignedWorkerSchema = new mongoose.Schema({
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Worker', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['assigned', 'confirmed', 'cancelled', 'replaced', 'completed', 'no_show'],
    default: 'assigned'
  },
  assignedAt: { type: Date, default: Date.now },
  replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  replacedAt: { type: Date },
  cancellationReason: { type: String }
}, { _id: false });

const labourRequestSchema = new mongoose.Schema({
  // Unique Request ID
  requestId: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return 'LR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },
  
  // Farmer & Land Reference
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  landId: { type: String, required: true }, // References existing Land.landId
  
  // Request Details
  workType: { 
    type: String, 
    enum: [
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
    ],
    required: true 
  },
  workersNeeded: { type: Number, required: true, min: 1, max: 50 },
  workDate: { type: Date, required: true },
  startTime: { type: String, default: '07:00' }, // HH:MM format
  duration: { type: Number, default: 8 }, // hours
  description: { type: String },
  
  // Location (copied from Land for quick access)
  location: {
    district: { type: String },
    area: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  // Coordinator Assignment
  coordinatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Coordinator' 
  },
  
  // Worker Assignments
  assignedWorkers: [assignedWorkerSchema],
  standbyWorkers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Worker' 
  }],
  
  // Request Status
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  
  // Tracking Timestamps
  coordinatorAcceptedAt: { type: Date },
  workStartedAt: { type: Date },
  workCompletedAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  
  // Farmer Confirmation & Feedback
  farmerConfirmed: { type: Boolean, default: false },
  farmerConfirmedAt: { type: Date },
  farmerRating: { type: Number, min: 1, max: 5 },
  farmerFeedback: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDemo: { type: Boolean, default: false }
});

// Update timestamp on save
labourRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Get count of active (non-cancelled/replaced) workers
labourRequestSchema.methods.getActiveWorkerCount = function() {
  return this.assignedWorkers.filter(w => 
    ['assigned', 'confirmed', 'completed'].includes(w.status)
  ).length;
};

// Check if request is fully staffed
labourRequestSchema.methods.isFullyStaffed = function() {
  return this.getActiveWorkerCount() >= this.workersNeeded;
};

// Indexes
labourRequestSchema.index({ farmerId: 1, status: 1 });
labourRequestSchema.index({ coordinatorId: 1, status: 1 });
labourRequestSchema.index({ workDate: 1, status: 1 });
labourRequestSchema.index({ 'location.district': 1, status: 1 });

module.exports = mongoose.model('LabourRequest', labourRequestSchema);
