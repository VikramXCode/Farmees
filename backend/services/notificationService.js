import Notification from '../models/Notification.js';
import FarmingPlan from '../models/FarmingPlan.js';
import User from '../models/User.js';

/**
 * Notification Service
 * Handles creation, scheduling, and delivery of activity reminders
 * Processes farmer responses (complete, reschedule, skip)
 */
class NotificationService {
  
  /**
   * Create activity reminder notifications
   * Called when activity is created or rescheduled
   */
  async createActivityReminders(planId, activity) {
    try {
      const plan = await FarmingPlan.findById(planId).populate('userId');
      if (!plan) throw new Error('Plan not found');
      
      const scheduledDate = new Date(activity.scheduledDate);
      const twoDaysBefore = new Date(scheduledDate);
      twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
      
      // Create 2-day advance reminder
      if (twoDaysBefore > new Date()) {
        await Notification.create({
          userId: plan.userId._id,
          planId: planId,
          activityId: activity._id,
          type: 'reminder',
          titleEnglish: `Upcoming: ${this.formatActivityType(activity.activityType)}`,
          titleTamil: `வரவிருக்கும்: ${this.formatActivityTypeTamil(activity.activityType)}`,
          messageEnglish: `${this.formatActivityType(activity.activityType)} is scheduled in 2 days (${scheduledDate.toLocaleDateString()})`,
          messageTamil: `${this.formatActivityTypeTamil(activity.activityType)} 2 நாட்களில் திட்டமிடப்பட்டுள்ளது (${scheduledDate.toLocaleDateString('ta-IN')})`,
          scheduledFor: twoDaysBefore,
          deliveryChannels: ['in_app'],
          priority: activity.isOptional ? 'medium' : 'high'
        });
      }
      
      // Create due date reminder
      await Notification.create({
        userId: plan.userId._id,
        planId: planId,
        activityId: activity._id,
        type: 'due',
        titleEnglish: `Due Today: ${this.formatActivityType(activity.activityType)}`,
        titleTamil: `இன்று: ${this.formatActivityTypeTamil(activity.activityType)}`,
        messageEnglish: `${this.formatActivityType(activity.activityType)} is scheduled for today. Have you completed it?`,
        messageTamil: `${this.formatActivityTypeTamil(activity.activityType)} இன்று திட்டமிடப்பட்டுள்ளது. முடித்துவிட்டீர்களா?`,
        scheduledFor: scheduledDate,
        deliveryChannels: ['in_app'],
        priority: 'high'
      });
      
      console.log(`Created reminders for activity: ${activity.activityType}`);
      
    } catch (error) {
      console.error('Error creating activity reminders:', error);
      throw error;
    }
  }
  
  /**
   * Get pending notifications for a user
   */
  async getPendingNotifications(userId, limit = 20) {
    try {
      return await Notification.find({
        userId: userId,
        status: { $in: ['pending', 'delivered'] },
        scheduledFor: { $lte: new Date() }
      })
      .populate('planId', 'cropName startDate')
      .sort({ scheduledFor: -1, priority: 1 })
      .limit(limit);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }
  
  /**
   * Process farmer response to notification
   */
  async respondToNotification(notificationId, responseAction, responseData = {}) {
    try {
      const notification = await Notification.findById(notificationId)
        .populate('planId')
        .populate('activityId');
      
      if (!notification) throw new Error('Notification not found');
      
      notification.response.action = responseAction;
      notification.response.respondedAt = new Date();
      notification.status = 'responded';
      
      const plan = notification.planId;
      const activity = plan.activities.id(notification.activityId);
      
      if (!activity) throw new Error('Activity not found');
      
      switch (responseAction) {
        case 'completed':
          // Mark activity as completed
          activity.status = 'completed';
          activity.completionDate = new Date();
          await plan.save();
          await plan.calculateProgress();
          
          notification.messageEnglish = `✓ ${this.formatActivityType(activity.activityType)} marked as completed`;
          notification.messageTamil = `✓ ${this.formatActivityTypeTamil(activity.activityType)} முடிந்தது என குறிக்கப்பட்டது`;
          break;
          
        case 'reschedule':
          // Reschedule activity
          if (!responseData.newDate) throw new Error('New date required for reschedule');
          
          const oldDate = new Date(activity.scheduledDate);
          activity.scheduledDate = new Date(responseData.newDate);
          
          notification.response.rescheduleDetails = {
            oldDate: oldDate,
            newDate: new Date(responseData.newDate),
            reason: responseData.reason || 'other',
            farmerNote: responseData.note || ''
          };
          
          await plan.save();
          
          // Create new reminders for rescheduled date
          await this.createActivityReminders(plan._id, activity);
          
          notification.messageEnglish = `Rescheduled to ${new Date(responseData.newDate).toLocaleDateString()}`;
          notification.messageTamil = `${new Date(responseData.newDate).toLocaleDateString('ta-IN')} க்கு மாற்றப்பட்டது`;
          break;
          
        case 'skip':
          // Skip activity
          activity.status = 'skipped';
          notification.response.skipReason = responseData.reason || 'Not needed';
          await plan.save();
          
          notification.messageEnglish = `Activity skipped`;
          notification.messageTamil = `செயல்பாடு தவிர்க்கப்பட்டது`;
          break;
          
        case 'dismiss':
          // Just dismiss notification
          notification.status = 'read';
          break;
      }
      
      await notification.save();
      return notification;
      
    } catch (error) {
      console.error('Error responding to notification:', error);
      throw error;
    }
  }
  
  /**
   * Send overdue notifications
   * Called by cron job for activities past due date
   */
  async sendOverdueNotifications() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const overduePlans = await FarmingPlan.find({
        status: { $in: ['active', 'in_progress'] },
        'activities.scheduledDate': { $lt: yesterday },
        'activities.status': 'pending'
      }).populate('userId');
      
      for (const plan of overduePlans) {
        for (const activity of plan.activities) {
          if (activity.status === 'pending' && new Date(activity.scheduledDate) < yesterday) {
            // Check if overdue notification already exists
            const existingNotification = await Notification.findOne({
              planId: plan._id,
              activityId: activity._id,
              type: 'overdue'
            });
            
            if (!existingNotification) {
              await Notification.create({
                userId: plan.userId._id,
                planId: plan._id,
                activityId: activity._id,
                type: 'overdue',
                titleEnglish: `Overdue: ${this.formatActivityType(activity.activityType)}`,
                titleTamil: `நிலுவையில்: ${this.formatActivityTypeTamil(activity.activityType)}`,
                messageEnglish: `${this.formatActivityType(activity.activityType)} was scheduled for ${new Date(activity.scheduledDate).toLocaleDateString()}. Please update the status.`,
                messageTamil: `${this.formatActivityTypeTamil(activity.activityType)} ${new Date(activity.scheduledDate).toLocaleDateString('ta-IN')} அன்று திட்டமிடப்பட்டது. தயவுசெய்து நிலையைப் புதுப்பிக்கவும்.`,
                scheduledFor: new Date(),
                deliveryChannels: ['in_app'],
                priority: 'high'
              });
            }
          }
        }
      }
      
      console.log('Overdue notifications processed');
      
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
    }
  }
  
  /**
   * Process scheduled notifications
   * Called by cron job every hour
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      
      const notifications = await Notification.find({
        status: 'pending',
        scheduledFor: { $lte: now },
        retryCount: { $lt: 3 }
      });
      
      console.log(`Processing ${notifications.length} scheduled notifications`);
      
      for (const notification of notifications) {
        try {
          // Mark as delivered (in actual app, would send via SMS/Push/WhatsApp)
          notification.status = 'delivered';
          notification.deliveredAt = new Date();
          await notification.save();
          
          console.log(`Delivered notification ${notification._id}`);
          
        } catch (err) {
          // Retry logic
          notification.retryCount += 1;
          notification.lastRetryAt = new Date();
          
          if (notification.retryCount >= 3) {
            notification.status = 'failed';
          }
          
          await notification.save();
          console.error(`Failed to deliver notification ${notification._id}:`, err.message);
        }
      }
      
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }
  
  /**
   * Format activity type for display
   */
  formatActivityType(activityType) {
    const map = {
      land_preparation: 'Land Preparation',
      ploughing: 'Ploughing',
      seed_sowing: 'Seed Sowing',
      fertilizer_application: 'Fertilizer Application',
      irrigation: 'Irrigation',
      weeding: 'Weeding',
      pest_control: 'Pest Control',
      harvesting: 'Harvesting',
      sale: 'Crop Sale',
      other: 'Other Activity'
    };
    return map[activityType] || activityType;
  }
  
  /**
   * Format activity type in Tamil
   */
  formatActivityTypeTamil(activityType) {
    const map = {
      land_preparation: 'நில தயாரிப்பு',
      ploughing: 'உழவு',
      seed_sowing: 'விதைத்தல்',
      fertilizer_application: 'உரமிடுதல்',
      irrigation: 'நீர்ப்பாசனம்',
      weeding: 'களை எடுத்தல்',
      pest_control: 'பூச்சி கட்டுப்பாடு',
      harvesting: 'அறுவடை',
      sale: 'விற்பனை',
      other: 'மற்ற செயல்பாடு'
    };
    return map[activityType] || activityType;
  }
  
  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'read',
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
  
  /**
   * Get notification statistics for user
   */
  async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const result = {
        pending: 0,
        delivered: 0,
        read: 0,
        responded: 0,
        failed: 0
      };
      
      stats.forEach(stat => {
        result[stat._id] = stat.count;
      });
      
      return result;
      
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

export default new NotificationService();
