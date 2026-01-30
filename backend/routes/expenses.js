import express from 'express';
import Expense from '../models/Expense.js';
import FarmingPlan from '../models/FarmingPlan.js';
import Notification from '../models/Notification.js'; // Phase 1 notification model

const router = express.Router();

/**
 * Expense Routes - Phase 2.0
 * 
 * API endpoints for expense tracking, budget monitoring,
 * and CSV export functionality.
 * 
 * All routes consume Phase 1 farming plans in READ-ONLY mode.
 */

// ============================================================================
// POST /api/expenses - Create Expense
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { planId, userId, category, amount, date, description, notes, activityId } = req.body;
    
    // Validate required fields
    if (!planId || !userId || !category || amount === undefined || !date || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['planId', 'userId', 'category', 'amount', 'date', 'description']
      });
    }
    
    // Verify plan exists (Phase 1 read-only check)
    const plan = await FarmingPlan.findById(planId).select('totalBudget userId').lean();
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Verify ownership
    if (plan.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this plan' });
    }
    
    // Create expense
    const expense = new Expense({
      planId,
      userId,
      category,
      amount: parseFloat(amount),
      date: new Date(date),
      description: description.trim(),
      notes: notes ? notes.trim() : '',
      activityId: activityId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date()
    });
    
    await expense.save();
    
    // Calculate budget status
    const budgetStatus = await Expense.getBudgetStatus(planId, plan.totalBudget);
    
    // Check if budget alert should be triggered (80%+ threshold)
    if (budgetStatus.percentageUsed >= 80 && budgetStatus.alertLevel !== 'ok') {
      // Create Phase 1 notification (budget alert)
      await createBudgetAlertNotification(planId, userId, budgetStatus);
    }
    
    res.status(201).json({
      success: true,
      expense,
      budgetStatus
    });
    
  } catch (error) {
    console.error('Error creating expense:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      error: error.message || 'Failed to create expense',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================================================
// GET /api/expenses/plan/:planId - List Expenses
// ============================================================================
router.get('/plan/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { category, startDate, endDate, limit = 50, skip = 0 } = req.query;
    
    // Verify plan exists (Phase 1 read-only check)
    const plan = await FarmingPlan.findById(planId).select('_id').lean();
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Build query
    const query = { 
      planId,
      deletedAt: null // Exclude soft-deleted
    };
    
    // Apply filters
    if (category) {
      query.category = category;
    }
    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.date = query.date || {};
      query.date.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 }) // Newest first
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    // Get total count for pagination
    const total = await Expense.countDocuments(query);
    
    res.json({
      success: true,
      expenses,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      hasMore: (parseInt(skip) + expenses.length) < total
    });
    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch expenses',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================================================
// GET /api/expenses/budget-status/:planId - Get Budget Status
// ============================================================================
router.get('/budget-status/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Verify plan exists and get budget (Phase 1 read-only)
    const plan = await FarmingPlan.findById(planId).select('totalBudget').lean();
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Calculate budget status
    const budgetStatus = await Expense.getBudgetStatus(planId, plan.totalBudget);
    
    res.json({
      success: true,
      budgetStatus
    });
    
  } catch (error) {
    console.error('Error calculating budget status:', error);
    res.status(500).json({
      error: error.message || 'Failed to calculate budget status',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================================================
// PUT /api/expenses/:expenseId - Update Expense
// ============================================================================
router.put('/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const updates = req.body;
    
    // Find expense
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Check if soft-deleted
    if (expense.isDeleted()) {
      return res.status(400).json({ error: 'Cannot update deleted expense' });
    }
    
    // Verify ownership if userId provided
    if (updates.userId && expense.userId.toString() !== updates.userId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this expense' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['category', 'amount', 'date', 'description', 'notes', 'activityId'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'amount') {
          expense[field] = parseFloat(updates[field]);
        } else if (field === 'date') {
          expense[field] = new Date(updates[field]);
        } else if (field === 'description' || field === 'notes') {
          expense[field] = updates[field].trim();
        } else {
          expense[field] = updates[field];
        }
      }
    });
    
    expense.updatedAt = new Date();
    expense.syncedAt = new Date();
    
    await expense.save();
    
    // Recalculate budget status
    const plan = await FarmingPlan.findById(expense.planId).select('totalBudget').lean();
    const budgetStatus = await Expense.getBudgetStatus(expense.planId, plan.totalBudget);
    
    res.json({
      success: true,
      expense,
      budgetStatus
    });
    
  } catch (error) {
    console.error('Error updating expense:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      error: error.message || 'Failed to update expense',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================================================
// DELETE /api/expenses/:expenseId - Soft Delete Expense
// ============================================================================
router.delete('/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { userId } = req.query; // For ownership verification
    
    // Find expense
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Verify ownership
    if (userId && expense.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this expense' });
    }
    
    // Check if already deleted
    if (expense.isDeleted()) {
      return res.status(400).json({ error: 'Expense already deleted' });
    }
    
    // Soft delete
    await expense.softDelete();
    
    // Recalculate budget status (excluding this deleted expense)
    const plan = await FarmingPlan.findById(expense.planId).select('totalBudget').lean();
    const budgetStatus = await Expense.getBudgetStatus(expense.planId, plan.totalBudget);
    
    res.json({
      success: true,
      message: 'Expense deleted successfully',
      budgetStatus
    });
    
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete expense',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================================================
// GET /api/expenses/export/:planId - Export Expenses as CSV
// ============================================================================
router.get('/export/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { format = 'csv' } = req.query;
    
    // Phase 2.0: Only CSV supported
    if (format !== 'csv') {
      return res.status(400).json({ 
        error: 'Invalid format. Only CSV is supported in Phase 2.0' 
      });
    }
    
    // Verify plan exists (Phase 1 read-only)
    const plan = await FarmingPlan.findById(planId).select('planName cropName').lean();
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Fetch all expenses (not deleted)
    const expenses = await Expense.find({ 
      planId,
      deletedAt: null 
    })
      .sort({ date: -1 })
      .lean();
    
    // Generate CSV
    const csvHeader = 'Date,Category,Description,Amount (₹),Notes\n';
    const csvRows = expenses.map(exp => {
      const date = new Date(exp.date).toLocaleDateString('en-IN');
      const category = exp.category.charAt(0).toUpperCase() + exp.category.slice(1);
      const description = `"${exp.description.replace(/"/g, '""')}"`;
      const amount = exp.amount.toFixed(2);
      const notes = exp.notes ? `"${exp.notes.replace(/"/g, '""')}"` : '';
      return `${date},${category},${description},${amount},${notes}`;
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    // Set response headers
    const filename = `expenses_${plan.cropName}_${plan.planName}_${new Date().toISOString().split('T')[0]}.csv`
      .replace(/[^a-zA-Z0-9_.-]/g, '_'); // Sanitize filename
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Error exporting expenses:', error);
    res.status(500).json({
      error: error.message || 'Failed to export expenses',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================================================
// Helper Function: Create Budget Alert Notification (Phase 1 Integration)
// ============================================================================
async function createBudgetAlertNotification(planId, userId, budgetStatus) {
  try {
    // Get plan details for notification message
    const plan = await FarmingPlan.findById(planId).select('planName cropName').lean();
    if (!plan) return;
    
    // Determine alert message based on level
    let titleEnglish, titleTamil, messageEnglish, messageTamil, priority;
    
    if (budgetStatus.alertLevel === 'danger') {
      priority = 'urgent';
      if (budgetStatus.remaining < 0) {
        titleEnglish = '🚨 Budget Exceeded';
        titleTamil = '🚨 பட்ஜெட் மீறப்பட்டது';
        messageEnglish = `You've spent ₹${budgetStatus.totalSpent.toLocaleString('en-IN')} of ₹${budgetStatus.totalBudget.toLocaleString('en-IN')} (${budgetStatus.percentageUsed.toFixed(1)}% used). Over budget by ₹${Math.abs(budgetStatus.remaining).toLocaleString('en-IN')}.`;
        messageTamil = `நீங்கள் ₹${budgetStatus.totalBudget.toLocaleString('en-IN')} இல் ₹${budgetStatus.totalSpent.toLocaleString('en-IN')} செலவழித்துள்ளீர்கள் (${budgetStatus.percentageUsed.toFixed(1)}% பயன்படுத்தப்பட்டது). ₹${Math.abs(budgetStatus.remaining).toLocaleString('en-IN')} அதிகம்.`;
      } else {
        titleEnglish = '🚨 Critical Budget Alert';
        titleTamil = '🚨 முக்கிய பட்ஜெட் எச்சரிக்கை';
        messageEnglish = `${budgetStatus.percentageUsed.toFixed(1)}% of budget used for ${plan.planName}. Only ₹${budgetStatus.remaining.toLocaleString('en-IN')} remaining.`;
        messageTamil = `${plan.planName} க்கு பட்ஜெட்டில் ${budgetStatus.percentageUsed.toFixed(1)}% பயன்படுத்தப்பட்டது. ₹${budgetStatus.remaining.toLocaleString('en-IN')} மட்டுமே உள்ளது.`;
      }
    } else if (budgetStatus.alertLevel === 'warning') {
      priority = 'high';
      titleEnglish = '⚠️ Budget Warning';
      titleTamil = '⚠️ பட்ஜெட் எச்சரிக்கை';
      messageEnglish = `${budgetStatus.percentageUsed.toFixed(1)}% of budget used for ${plan.planName}. ₹${budgetStatus.remaining.toLocaleString('en-IN')} remaining.`;
      messageTamil = `${plan.planName} க்கு பட்ஜெட்டில் ${budgetStatus.percentageUsed.toFixed(1)}% பயன்படுத்தப்பட்டது. ₹${budgetStatus.remaining.toLocaleString('en-IN')} உள்ளது.`;
    }
    
    // Create Phase 1 notification using Notification model
    await Notification.create({
      userId,
      planId,
      type: 'budget_alert',
      titleEnglish,
      titleTamil,
      messageEnglish,
      messageTamil,
      priority,
      deliveryChannels: ['in_app'],
      scheduledFor: new Date(), // Deliver immediately
      isRead: false
    });
    
    console.log(`✓ Budget alert created for plan ${planId}: ${budgetStatus.percentageUsed.toFixed(1)}% budget used (${budgetStatus.alertLevel})`);
    
  } catch (error) {
    console.error('Error creating budget alert notification:', error);
    // Don't throw - notification creation is non-critical
  }
}

export default router;
