import mongoose from 'mongoose';

/**
 * Notification Schema
 * Handles activity reminders, confirmations, and farmer responses
 */
const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmingPlan',
    required: true,
    index: true
  },
  
  activityId: {
    type: String,
    required: true
    // Removed: index: true (already in compound index below)
  },
  
  // Notification type
  type: {
    type: String,
    enum: ['activity_reminder', 'activity_due', 'activity_overdue', 
           'weather_alert', 'budget_alert', 'ai_suggestion', 
           'plan_milestone', 'system'],
    required: true,
    index: true
  },
  
  // Notification content
  titleEnglish: {
    type: String,
    required: true
  },
  
  titleTamil: {
    type: String,
    required: true
  },
  
  messageEnglish: {
    type: String,
    required: true
  },
  
  messageTamil: {
    type: String,
    required: true
  },
  
  // Activity details for context
  activityDetails: {
    activityType: String,
    scheduledDate: Date,
    description: String
  },
  
  // Notification priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Delivery status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'responded', 'expired'],
    default: 'pending',
    index: true
  },
  
  // Scheduled send time
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  
  // Actual send time
  sentAt: Date,
  
  // When farmer read it
  readAt: Date,
  
  // Farmer response (for activity confirmations)
  response: {
    action: {
      type: String,
      enum: [null, 'completed', 'reschedule', 'skip', 'dismiss'],
      default: null
    },
    respondedAt: Date,
    notes: String,
    
    // If rescheduled
    rescheduleDetails: {
      newDate: Date,
      reason: {
        type: String,
        enum: ['rain', 'labour_unavailable', 'budget', 'health', 'weather', 'other']
      },
      reasonText: String
    }
  },
  
  // Action buttons shown to farmer
  actionButtons: [{
    action: String, // 'complete', 'reschedule', 'view_details', 'dismiss'
    labelEnglish: String,
    labelTamil: String
  }],
  
  // Retry mechanism for unread notifications
  retryCount: {
    type: Number,
    default: 0,
    max: 3
  },
  
  nextRetryAt: Date,
  
  // Expiry (after which notification is no longer relevant)
  expiresAt: Date,
  
  // Delivery channels attempted
  channels: [{
    channel: {
      type: String,
      enum: ['in_app', 'sms', 'push', 'whatsapp']
    },
    status: String,
    sentAt: Date,
    error: String
  }],
  
  // Related data
  metadata: {
    weatherData: mongoose.Schema.Types.Mixed,
    aiSuggestion: mongoose.Schema.Types.Mixed,
    relatedNotificationIds: [String]
  }
  
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, status: 1, scheduledFor: 1 });
notificationSchema.index({ planId: 1, activityId: 1, type: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 }); // For cron jobs
notificationSchema.index({ 'response.action': 1, respondedAt: 1 });

// Automatically expire old unread notifications (TTL - 30 days)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
