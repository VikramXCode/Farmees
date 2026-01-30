import cron from 'node-cron';
import notificationService from '../services/notificationService.js';
import mongoose from 'mongoose';

/**
 * Notification Scheduler
 * Runs cron jobs to send scheduled notifications
 * Processes overdue activities
 */
class NotificationScheduler {
  
  constructor() {
    this.jobs = [];
  }
  
  /**
   * Initialize and start all cron jobs
   */
  start() {
    console.log('Starting notification scheduler...');
    
    // Every hour: Process scheduled notifications
    const hourlyJob = cron.schedule('0 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Running hourly notification job`);
      try {
        await notificationService.processScheduledNotifications();
      } catch (error) {
        console.error('Error in hourly notification job:', error);
      }
    });
    
    this.jobs.push({ name: 'hourly-notifications', job: hourlyJob });
    
    // Every 30 minutes: Process overdue activities
    const overdueJob = cron.schedule('*/30 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Running overdue notification job`);
      try {
        await notificationService.sendOverdueNotifications();
      } catch (error) {
        console.error('Error in overdue notification job:', error);
      }
    });
    
    this.jobs.push({ name: 'overdue-notifications', job: overdueJob });
    
    // Daily at 6 AM: Send daily summary notifications
    const dailySummaryJob = cron.schedule('0 6 * * *', async () => {
      console.log(`[${new Date().toISOString()}] Running daily summary job`);
      try {
        await this.sendDailySummaries();
      } catch (error) {
        console.error('Error in daily summary job:', error);
      }
    });
    
    this.jobs.push({ name: 'daily-summaries', job: dailySummaryJob });
    
    console.log(`Notification scheduler started with ${this.jobs.length} jobs`);
  }
  
  /**
   * Stop all cron jobs
   */
  stop() {
    console.log('Stopping notification scheduler...');
    
    for (const { name, job } of this.jobs) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }
    
    this.jobs = [];
    console.log('Notification scheduler stopped');
  }
  
  /**
   * Send daily summary to farmers
   */
  async sendDailySummaries() {
    try {
      const FarmingPlan = mongoose.model('FarmingPlan');
      const Notification = mongoose.model('Notification');
      const User = mongoose.model('User');
      
      // Find all active plans with activities scheduled for today or tomorrow
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 2);
      
      const activePlans = await FarmingPlan.find({
        status: { $in: ['active', 'in_progress'] },
        'activities.scheduledDate': {
          $gte: today,
          $lte: tomorrow
        }
      }).populate('userId');
      
      for (const plan of activePlans) {
        // Get activities scheduled for today and tomorrow
        const upcomingActivities = plan.activities.filter(activity => {
          const scheduledDate = new Date(activity.scheduledDate);
          return scheduledDate >= today && scheduledDate <= tomorrow && activity.status === 'pending';
        });
        
        if (upcomingActivities.length > 0) {
          const activityList = upcomingActivities
            .map(a => `- ${this.formatActivityType(a.activityType)} on ${new Date(a.scheduledDate).toLocaleDateString()}`)
            .join('\n');
          
          await Notification.create({
            userId: plan.userId._id,
            planId: plan._id,
            type: 'summary',
            titleEnglish: `Your Farming Activities`,
            titleTamil: `உங்கள் வேளாண்மை செயல்பாடுகள்`,
            messageEnglish: `You have ${upcomingActivities.length} activities in the next 2 days for ${plan.cropName}:\n${activityList}`,
            messageTamil: `${plan.cropName} க்கு அடுத்த 2 நாட்களில் ${upcomingActivities.length} செயல்பாடுகள் உள்ளன`,
            scheduledFor: new Date(),
            deliveryChannels: ['in_app'],
            priority: 'medium'
          });
        }
      }
      
      console.log(`Daily summaries sent to farmers with upcoming activities`);
      
    } catch (error) {
      console.error('Error sending daily summaries:', error);
    }
  }
  
  /**
   * Format activity type
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
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.jobs.length > 0,
      jobs: this.jobs.map(j => ({ name: j.name, running: true }))
    };
  }
}

export default new NotificationScheduler();
