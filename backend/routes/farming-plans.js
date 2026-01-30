import express from 'express';
const router = express.Router();
import FarmingPlan from '../models/FarmingPlan.js';
import { generateNextStepSuggestions } from '../services/planSuggestionService.js';
import activityPlanningService from '../services/activityPlanningService.js';
import notificationService from '../services/notificationService.js';
import weatherAnalysisService from '../services/weatherAnalysisService.js';
import aiRecommendationService from '../services/aiRecommendationService.js';
import Notification from '../models/Notification.js';

// Create a new farming plan
router.post('/', async (req, res) => {
  try {
    const plan = new FarmingPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating farming plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all plans for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { status, landId } = req.query;
    const query = { userId: req.params.userId };
    
    if (status) query.status = status;
    if (landId) query.landId = landId;
    
    const plans = await FarmingPlan.find(query).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single plan by ID
router.get('/:planId', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update plan
router.put('/:planId', async (req, res) => {
  try {
    const plan = await FarmingPlan.findByIdAndUpdate(
      req.params.planId,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// Finalize plan (change from draft to active)
router.post('/:planId/finalize', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    plan.status = 'active';
    plan.finalizedAt = new Date();
    
    // Generate initial AI suggestions
    const suggestions = await generateNextStepSuggestions(plan);
    plan.aiSuggestions.push(...suggestions);
    
    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('Error finalizing plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add activity to plan
router.post('/:planId/activities', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Validate required fields
    if (!req.body.activityType) {
      return res.status(400).json({ error: 'Activity type is required' });
    }
    
    // Validate activityType enum
    const validTypes = ['land_preparation', 'ploughing', 'seed_sowing', 'fertilizer_application', 
                       'irrigation', 'weeding', 'pest_control', 'harvesting', 'sale', 'other'];
    if (!validTypes.includes(req.body.activityType)) {
      return res.status(400).json({ 
        error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    await plan.addActivity(req.body);
    
    // Get the newly added activity (last one)
    const newActivity = plan.activities[plan.activities.length - 1];
    
    // Create activity reminders
    await notificationService.createActivityReminders(req.params.planId, newActivity);
    
    await plan.updateActualCosts();
    await plan.calculateProgress();
    
    // Generate new suggestions based on the activity
    const suggestions = await generateNextStepSuggestions(plan);
    if (suggestions.length > 0) {
      suggestions.forEach(s => plan.aiSuggestions.push(s));
      await plan.save();
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to add activity',
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : []
    });
  }
});

// Update activity status
router.put('/:planId/activities/:activityId', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    await plan.updateActivity(req.params.activityId, req.body);
    await plan.updateActualCosts();
    await plan.calculateProgress();
    
    // Generate new suggestions
    const suggestions = await generateNextStepSuggestions(plan);
    if (suggestions.length > 0) {
      suggestions.forEach(s => plan.aiSuggestions.push(s));
      await plan.save();
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get AI suggestions for next steps
router.get('/:planId/suggestions', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Filter active (non-dismissed) suggestions
    const activeSuggestions = plan.aiSuggestions
      .filter(s => !s.dismissed)
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    
    res.json(activeSuggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dismiss a suggestion
router.put('/:planId/suggestions/:suggestionId/dismiss', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const suggestion = plan.aiSuggestions.id(req.params.suggestionId);
    if (suggestion) {
      suggestion.dismissed = true;
      await plan.save();
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error dismissing suggestion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get plan analytics
router.get('/:planId/analytics', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const analytics = {
      budgetUtilization: plan.budgetUtilization,
      budgetRemaining: plan.totalBudget - plan.actualCosts.totalSpent,
      overBudget: plan.actualCosts.totalSpent > plan.totalBudget,
      progressPercentage: plan.progress.percentage,
      completedActivities: plan.activities.filter(a => a.status === 'completed').length,
      totalActivities: plan.activities.length,
      daysElapsed: Math.floor((new Date() - plan.startDate) / (1000 * 60 * 60 * 24)),
      daysRemaining: plan.expectedHarvestDate ? 
        Math.floor((plan.expectedHarvestDate - new Date()) / (1000 * 60 * 60 * 24)) : null,
      costBreakdown: {
        seed: {
          planned: plan.budgetAllocation.seedCost,
          actual: plan.actualCosts.seedCost,
          variance: plan.actualCosts.seedCost - plan.budgetAllocation.seedCost
        },
        fertilizer: {
          planned: plan.budgetAllocation.fertilizerCost,
          actual: plan.actualCosts.fertilizerCost,
          variance: plan.actualCosts.fertilizerCost - plan.budgetAllocation.fertilizerCost
        },
        labor: {
          planned: plan.budgetAllocation.laborCost,
          actual: plan.actualCosts.laborCost,
          variance: plan.actualCosts.laborCost - plan.budgetAllocation.laborCost
        },
        other: {
          planned: plan.budgetAllocation.otherCosts,
          actual: plan.actualCosts.otherCosts,
          variance: plan.actualCosts.otherCosts - plan.budgetAllocation.otherCosts
        }
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete plan
router.delete('/:planId', async (req, res) => {
  try {
    const plan = await FarmingPlan.findByIdAndDelete(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record harvest
router.post('/:planId/harvest', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const { actualYieldTons, harvestDate, quality, notes } = req.body;
    
    plan.harvest = {
      actualYieldTons,
      harvestDate: harvestDate || new Date(),
      quality,
      notes
    };
    
    plan.progress.currentStage = 'harvesting';
    
    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('Error recording harvest:', error);
    res.status(400).json({ error: error.message });
  }
});

// Record sale
router.post('/:planId/sale', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const { quantitySoldTons, pricePerTon, saleDate, buyer, notes } = req.body;
    
    plan.sale = {
      quantitySoldTons,
      pricePerTon,
      totalRevenue: quantitySoldTons * pricePerTon,
      saleDate: saleDate || new Date(),
      buyer,
      notes,
      completed: true
    };
    
    plan.progress.currentStage = 'completed';
    plan.status = 'completed';
    
    // Recalculate progress - will set to 100%
    await plan.calculateProgress();
    
    res.json(plan);
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get financial summary including profit/loss
router.get('/:planId/financial-summary', async (req, res) => {
  try {
    const plan = await FarmingPlan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const summary = {
      totalCost: plan.actualCosts.totalSpent,
      totalRevenue: plan.sale.totalRevenue || 0,
      profit: (plan.sale.totalRevenue || 0) - plan.actualCosts.totalSpent,
      profitMargin: plan.sale.totalRevenue > 0 
        ? (((plan.sale.totalRevenue - plan.actualCosts.totalSpent) / plan.sale.totalRevenue) * 100).toFixed(2)
        : 0,
      roi: plan.actualCosts.totalSpent > 0
        ? (((plan.sale.totalRevenue || 0) - plan.actualCosts.totalSpent) / plan.actualCosts.totalSpent * 100).toFixed(2)
        : 0,
      expectedVsActual: {
        yieldExpected: plan.expectedYield?.totalTons || 0,
        yieldActual: plan.harvest?.actualYieldTons || 0,
        revenueExpected: plan.expectedYield?.expectedRevenue || 0,
        revenueActual: plan.sale?.totalRevenue || 0,
        profitExpected: plan.expectedYield?.expectedProfit || 0,
        profitActual: (plan.sale.totalRevenue || 0) - plan.actualCosts.totalSpent
      }
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error calculating financial summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== NEW PHASE 1 ROUTES ====================

// Auto-generate activities from crop calendar
router.post('/:planId/generate-activities', async (req, res) => {
  try {
    const { planId } = req.params;
    const { season = 'all' } = req.body;
    
    const plan = await FarmingPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Generate activities from crop calendar database
    const generatedActivities = await activityPlanningService.generateActivityPlan(plan, season);
    
    if (generatedActivities.length === 0) {
      return res.status(404).json({ 
        error: 'No crop calendar found',
        message: 'Please add activities manually or contact admin to add crop calendar'
      });
    }
    
    // Add activities to plan (farmer can review before accepting)
    res.json({
      success: true,
      activities: generatedActivities,
      count: generatedActivities.length,
      message: 'Review these activities and accept to add to your plan'
    });
    
  } catch (error) {
    console.error('Error generating activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept auto-generated activities
router.post('/:planId/accept-generated-activities', async (req, res) => {
  try {
    const { planId } = req.params;
    const { activities } = req.body;
    
    const plan = await FarmingPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Add activities to plan
    for (const activity of activities) {
      plan.activities.push(activity);
      
      // Create reminders for this activity
      await notificationService.createActivityReminders(planId, activity);
    }
    
    await plan.save();
    await plan.calculateProgress();
    
    res.json({
      success: true,
      plan: plan,
      message: 'Activities added successfully'
    });
    
  } catch (error) {
    console.error('Error accepting activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get AI activity suggestions
router.get('/:planId/activity-suggestions/:activityType', async (req, res) => {
  try {
    const { planId, activityType } = req.params;
    
    const suggestions = await aiRecommendationService.generateActivitySuggestions(planId, activityType);
    
    res.json({
      success: true,
      activityType: activityType,
      suggestions: suggestions
    });
    
  } catch (error) {
    console.error('Error getting activity suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check for activity conflicts
router.post('/:planId/check-conflicts', async (req, res) => {
  try {
    const { planId } = req.params;
    const { activity } = req.body;
    
    const plan = await FarmingPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const conflictCheck = await activityPlanningService.checkConflicts(plan, activity);
    
    res.json(conflictCheck);
    
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get weather forecast for plan
router.get('/:planId/weather-forecast', async (req, res) => {
  try {
    const { planId } = req.params;
    
    const forecast = await weatherAnalysisService.getFarmingForecast(planId);
    
    res.json({
      success: true,
      forecast: forecast
    });
    
  } catch (error) {
    console.error('Error getting weather forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if activity should be delayed due to weather
router.post('/:planId/weather-check/:activityId', async (req, res) => {
  try {
    const { planId, activityId } = req.params;
    
    const weatherDecision = await weatherAnalysisService.shouldDelayActivity(planId, activityId);
    
    res.json(weatherDecision);
    
  } catch (error) {
    console.error('Error checking weather delay:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for user
router.get('/notifications/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    
    const notifications = await notificationService.getPendingNotifications(userId, parseInt(limit));
    
    res.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });
    
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Respond to notification
router.post('/notifications/:notificationId/respond', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { action, newDate, reason, note } = req.body;
    
    const responseData = { newDate, reason, note };
    const notification = await notificationService.respondToNotification(notificationId, action, responseData);
    
    res.json({
      success: true,
      notification: notification,
      message: `Activity ${action} successfully`
    });
    
  } catch (error) {
    console.error('Error responding to notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await notificationService.markAsRead(notificationId);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notification stats
router.get('/notifications/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await notificationService.getNotificationStats(userId);
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

