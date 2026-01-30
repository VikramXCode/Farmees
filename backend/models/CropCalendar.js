import mongoose from 'mongoose';

/**
 * CropCalendar Schema
 * Stores crop-specific activity schedules for auto-plan generation
 * NOT hardcoded - admin can update via API
 */
const cropCalendarSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: true,
    index: true,
    trim: true,
    lowercase: true
  },
  
  // Crop cycle duration in days
  totalDurationDays: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Activity templates for this crop
  activities: [{
    activityType: {
      type: String,
      enum: ['land_preparation', 'ploughing', 'seed_sowing', 'fertilizer_application', 
             'irrigation', 'weeding', 'pest_control', 'harvesting', 'other'],
      required: true
    },
    
    // When to perform (days from start)
    daysFromStart: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Duration this activity takes
    durationDays: {
      type: Number,
      default: 1,
      min: 1
    },
    
    // Why this timing (farmer-friendly)
    reasonEnglish: {
      type: String,
      required: true
    },
    
    reasonTamil: {
      type: String,
      required: true
    },
    
    // Estimated cost range
    estimatedCostMin: {
      type: Number,
      default: 0
    },
    
    estimatedCostMax: {
      type: Number,
      default: 0
    },
    
    // Is this activity optional?
    isOptional: {
      type: Boolean,
      default: false
    },
    
    // Recurring frequency (null if one-time)
    recurringFrequency: {
      type: String,
      enum: [null, 'daily', 'weekly', 'biweekly', 'monthly'],
      default: null
    },
    
    // How many times to repeat
    recurringCount: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  
  // Season applicability
  seasons: [{
    type: String,
    enum: ['kharif', 'rabi', 'zaid', 'summer', 'winter', 'all']
  }],
  
  // Region applicability
  regions: [String],
  
  // Last updated
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Created by (admin user ID)
  createdBy: String,
  
  // Active status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
cropCalendarSchema.index({ cropName: 1, isActive: 1 });
cropCalendarSchema.index({ 'activities.activityType': 1 });

const CropCalendar = mongoose.model('CropCalendar', cropCalendarSchema);

export default CropCalendar;
