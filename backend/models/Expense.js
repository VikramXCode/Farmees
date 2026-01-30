import mongoose from 'mongoose';

/**
 * Expense Model - Phase 2.0
 * 
 * Tracks farmer expenses for farming plans with category-wise breakdown
 * and budget monitoring. Integrates with Phase 1 farming plans (read-only).
 * 
 * Features:
 * - Category-based expense tracking
 * - Budget threshold alerts
 * - Soft delete support
 * - Offline sync tracking (syncedAt timestamp)
 * - Optional linking to Phase 1 activities
 */

const expenseSchema = new mongoose.Schema({
  // References
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Plan ID is required'],
    index: true,
    ref: 'FarmingPlan'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    index: true,
    ref: 'User'
  },
  
  // Expense Details
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['seeds', 'fertilizer', 'pesticides', 'labour', 'equipment', 'transport', 'other'],
      message: '{VALUE} is not a valid category'
    },
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
    validate: {
      validator: function(value) {
        return value >= 0 && Number.isFinite(value);
      },
      message: 'Amount must be a valid positive number'
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true,
    validate: {
      validator: function(value) {
        // Date cannot be in the future
        return value <= new Date();
      },
      message: 'Expense date cannot be in the future'
    }
  },
  
  // Description & Notes
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    minlength: [2, 'Description must be at least 2 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  
  // Optional Link to Phase 1 Activity
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: 'FarmingPlan.activities'
  },
  
  // Receipt Photo (Phase 2.0: null, Phase 2.2: S3 URL)
  receiptPhoto: {
    type: String,
    default: null,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow null
        // Simple URL validation (http:// or https://)
        return /^https?:\/\/.+/.test(value);
      },
      message: 'Receipt photo must be a valid URL'
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Offline Sync Tracking
  syncedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Soft Delete
  deletedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound Indexes for Performance
expenseSchema.index({ planId: 1, date: -1 }); // List expenses by plan, newest first
expenseSchema.index({ planId: 1, category: 1 }); // Category filtering
expenseSchema.index({ userId: 1, createdAt: -1 }); // User's recent expenses
expenseSchema.index({ planId: 1, deletedAt: 1 }); // Exclude soft-deleted

// Virtual: Format amount as currency
expenseSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString('en-IN')}`;
});

// Virtual: Category display name (bilingual support)
expenseSchema.virtual('categoryLabel').get(function() {
  const labels = {
    seeds: { en: 'Seeds', ta: 'விதைகள்' },
    fertilizer: { en: 'Fertilizer', ta: 'உரம்' },
    pesticides: { en: 'Pesticides', ta: 'பூச்சிக்கொல்லி' },
    labour: { en: 'Labour', ta: 'தொழிலாளர்' },
    equipment: { en: 'Equipment', ta: 'உபகரணங்கள்' },
    transport: { en: 'Transport', ta: 'போக்குவரத்து' },
    other: { en: 'Other', ta: 'மற்றவை' }
  };
  return labels[this.category] || { en: this.category, ta: this.category };
});

// Pre-save Middleware: Update timestamps
expenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // If this is a new document being synced from offline
  if (this.isNew && this.syncedAt) {
    // Keep the original syncedAt from offline queue
  } else if (this.isModified()) {
    // Update syncedAt when modified
    this.syncedAt = new Date();
  }
  
  next();
});

// Static Method: Get total spent for a plan
expenseSchema.statics.getTotalSpent = async function(planId, excludeDeleted = true) {
  const matchQuery = { planId: mongoose.Types.ObjectId(planId) };
  if (excludeDeleted) {
    matchQuery.deletedAt = null;
  }
  
  const result = await this.aggregate([
    { $match: matchQuery },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

// Static Method: Get category-wise breakdown
expenseSchema.statics.getCategoryBreakdown = async function(planId, excludeDeleted = true) {
  const matchQuery = { planId: mongoose.Types.ObjectId(planId) };
  if (excludeDeleted) {
    matchQuery.deletedAt = null;
  }
  
  const result = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { amount: -1 } }
  ]);
  
  return result.map(item => ({
    category: item._id,
    amount: item.amount,
    count: item.count
  }));
};

// Static Method: Calculate budget status
expenseSchema.statics.getBudgetStatus = async function(planId, totalBudget) {
  const totalSpent = await this.getTotalSpent(planId);
  const categoryBreakdown = await this.getCategoryBreakdown(planId);
  
  const remaining = totalBudget - totalSpent;
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Calculate category percentages
  const categoryBreakdownWithPercentage = categoryBreakdown.map(cat => ({
    ...cat,
    percentage: totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0
  }));
  
  // Determine alert level
  let alertLevel = 'ok';
  if (percentageUsed >= 90) {
    alertLevel = 'danger';
  } else if (percentageUsed >= 70) {
    alertLevel = 'warning';
  }
  
  // Get last expense date
  const lastExpense = await this.findOne({ 
    planId: mongoose.Types.ObjectId(planId),
    deletedAt: null 
  })
    .sort({ date: -1 })
    .select('date')
    .lean();
  
  return {
    totalBudget,
    totalSpent: Math.round(totalSpent * 100) / 100, // Round to 2 decimals
    remaining: Math.round(remaining * 100) / 100,
    percentageUsed: Math.round(percentageUsed * 10) / 10, // Round to 1 decimal
    categoryBreakdown: categoryBreakdownWithPercentage,
    alertLevel,
    lastExpenseDate: lastExpense ? lastExpense.date : null
  };
};

// Instance Method: Soft delete
expenseSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Instance Method: Restore soft-deleted expense
expenseSchema.methods.restore = function() {
  this.deletedAt = null;
  this.updatedAt = new Date();
  return this.save();
};

// Instance Method: Check if expense is deleted
expenseSchema.methods.isDeleted = function() {
  return this.deletedAt !== null;
};

// Query Helper: Exclude deleted expenses
expenseSchema.query.notDeleted = function() {
  return this.where({ deletedAt: null });
};

// Query Helper: Only deleted expenses
expenseSchema.query.onlyDeleted = function() {
  return this.where({ deletedAt: { $ne: null } });
};

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
