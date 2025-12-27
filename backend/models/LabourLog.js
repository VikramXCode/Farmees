// MongoDB Schema for Labour Event Logs (Accountability Trail)
const mongoose = require('mongoose');

const labourLogSchema = new mongoose.Schema({
  // Reference to Request
  requestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LabourRequest', 
    required: true 
  },
  
  // Actor
  coordinatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Coordinator' 
  },
  actorType: {
    type: String,
    enum: ['system', 'farmer', 'coordinator'],
    required: true
  },
  
  // Event Type
  eventType: { 
    type: String, 
    enum: [
      'request_created',
      'coordinator_assigned',
      'coordinator_accepted',
      'coordinator_declined',
      'worker_assigned',
      'worker_confirmed',
      'worker_cancelled',
      'replacement_suggested',
      'replacement_made',
      'work_started',
      'work_completed',
      'request_cancelled',
      'request_failed',
      'feedback_submitted'
    ],
    required: true 
  },
  
  // Event Details
  eventData: {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    previousWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    reason: { type: String },
    notes: { type: String },
    rating: { type: Number },
    workerCount: { type: Number }
  },
  
  // Timestamp
  timestamp: { type: Date, default: Date.now }
});

// Indexes for efficient querying
labourLogSchema.index({ requestId: 1, timestamp: -1 });
labourLogSchema.index({ coordinatorId: 1, timestamp: -1 });
labourLogSchema.index({ eventType: 1, timestamp: -1 });

// Static method to create log entry
labourLogSchema.statics.logEvent = async function(requestId, eventType, actorType, coordinatorId, eventData = {}) {
  return await this.create({
    requestId,
    eventType,
    actorType,
    coordinatorId,
    eventData
  });
};

module.exports = mongoose.model('LabourLog', labourLogSchema);
