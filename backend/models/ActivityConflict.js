import mongoose from 'mongoose';

/**
 * ActivityConflict Schema
 * Tracks scheduling conflicts and resolutions
 */
const activityConflictSchema = new mongoose.Schema({
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmingPlan',
    required: true,
    index: true
  },
  
  // Conflicting activities
  activity1: {
    activityId: String,
    activityType: String,
    scheduledDate: Date
  },
  
  activity2: {
    activityId: String,
    activityType: String,
    scheduledDate: Date
  },
  
  // Conflict type
  conflictType: {
    type: String,
    enum: ['overlap', 'impossible_sequence', 'weather_conflict', 'resource_conflict'],
    required: true
  },
  
  // Conflict description
  descriptionEnglish: String,
  descriptionTamil: String,
  
  // Suggested resolution
  resolution: {
    suggestedDate: Date,
    reasonEnglish: String,
    reasonTamil: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['detected', 'resolved', 'ignored'],
    default: 'detected'
  },
  
  // How it was resolved
  resolvedBy: {
    action: String, // 'rescheduled', 'removed', 'ignored'
    resolvedAt: Date,
    notes: String
  }
  
}, {
  timestamps: true
});

activityConflictSchema.index({ planId: 1, status: 1 });

const ActivityConflict = mongoose.model('ActivityConflict', activityConflictSchema);

export default ActivityConflict;
