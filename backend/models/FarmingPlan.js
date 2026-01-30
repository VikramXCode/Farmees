import mongoose from 'mongoose';

const farmingPlanSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  landId: {
    type: String,
    required: true,
    index: true
  },
  planName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // Crop and Budget Details
  cropName: {
    type: String,
    required: true
  },
  totalBudget: {
    type: Number,
    required: true
  },
  includeFertilizers: {
    type: Boolean,
    default: false
  },
  plannedAreaHectares: {
    type: Number,
    required: true
  },
  
  // Cost Breakdown
  budgetAllocation: {
    seedCost: { type: Number, default: 0 },
    fertilizerCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    otherCosts: { type: Number, default: 0 },
    totalAllocated: { type: Number, default: 0 }
  },
  
  // Seed Details
  seedDetails: {
    variety: { type: String },
    quantityKg: { type: Number },
    costPerKg: { type: Number },
    totalCost: { type: Number }
  },
  
  // Fertilizer Details (if included)
  fertilizerDetails: [{
    name: { type: String },
    type: { type: String }, // NPK, Urea, DAP, etc.
    quantityKg: { type: Number },
    costPerKg: { type: Number },
    totalCost: { type: Number },
    applicationStage: { type: String } // sowing, vegetative, flowering, etc.
  }],
  
  // Expected Outcomes
  expectedYield: {
    tonsPerHectare: { type: Number },
    totalTons: { type: Number },
    marketPricePerTon: { type: Number },
    expectedRevenue: { type: Number },
    expectedProfit: { type: Number },
    roi: { type: Number }
  },
  
  // Timeline
  startDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: {
    type: Date
  },
  planningMonths: {
    type: Number,
    default: 6
  },
  
  // Execution Tracking
  activities: [{
    activityType: {
      type: String,
      enum: ['land_preparation', 'ploughing', 'seed_sowing', 'fertilizer_application', 
             'irrigation', 'weeding', 'pest_control', 'harvesting', 'sale', 'other'],
      required: true
    },
    description: { type: String },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending'
    },
    cost: { type: Number, default: 0 },
    notes: { type: String },
    images: [{ type: String }],
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // AI Suggestions based on activities
  aiSuggestions: [{
    suggestionText: { type: String },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['next_step', 'warning', 'optimization', 'reminder']
    },
    dueDate: { type: Date },
    dismissed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Progress Tracking
  progress: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    currentStage: {
      type: String,
      enum: ['planning', 'preparation', 'sowing', 'growth', 'maintenance', 'harvesting', 'sale', 'completed'],
      default: 'planning'
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Financial Tracking
  actualCosts: {
    seedCost: { type: Number, default: 0 },
    fertilizerCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    otherCosts: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  
  // Harvest & Sale Tracking
  harvest: {
    actualYieldTons: { type: Number, default: 0 },
    harvestDate: { type: Date },
    quality: { type: String, enum: ['excellent', 'good', 'average', 'poor'] },
    notes: { type: String }
  },
  
  sale: {
    quantitySoldTons: { type: Number, default: 0 },
    pricePerTon: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    saleDate: { type: Date },
    buyer: { type: String },
    notes: { type: String },
    completed: { type: Boolean, default: false }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  finalizedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
farmingPlanSchema.index({ userId: 1, status: 1 });
farmingPlanSchema.index({ landId: 1, status: 1 });
farmingPlanSchema.index({ status: 1, 'progress.currentStage': 1 });

// Virtual for budget utilization percentage
farmingPlanSchema.virtual('budgetUtilization').get(function() {
  return this.totalBudget > 0 ? (this.actualCosts.totalSpent / this.totalBudget) * 100 : 0;
});

// Method to add activity
farmingPlanSchema.methods.addActivity = function(activityData) {
  this.activities.push(activityData);
  this.updatedAt = new Date();
  return this.save();
};

// Method to update activity status
farmingPlanSchema.methods.updateActivity = function(activityId, updates) {
  const activity = this.activities.id(activityId);
  if (activity) {
    Object.assign(activity, updates);
    this.updatedAt = new Date();
    return this.save();
  }
  throw new Error('Activity not found');
};

// Method to add AI suggestion
farmingPlanSchema.methods.addSuggestion = function(suggestionData) {
  this.aiSuggestions.push(suggestionData);
  return this.save();
};

// Method to calculate progress
farmingPlanSchema.methods.calculateProgress = async function() {
  // Check if sale is completed - that's the final step
  if (this.sale && this.sale.completed) {
    this.progress.percentage = 100;
    this.progress.currentStage = 'completed';
    this.status = 'completed';
    this.progress.lastUpdated = new Date();
    await this.save();
    return 100;
  }
  
  // Define percentage allocation for each activity type
  const activityWeights = {
    'land_preparation': 10,
    'ploughing': 5,
    'seed_sowing': 15,
    'fertilizer_application': 10,
    'irrigation': 10,
    'weeding': 10,
    'pest_control': 10,
    'harvesting': 25,
    'sale': 5,
    'other': 1  // Dynamic activities contribute 1% each
  };
  
  // Track which activity types have been completed (only count each type once)
  const completedTypes = new Set();
  let totalProgress = 0;
  let otherActivitiesCount = 0;
  
  this.activities.forEach(activity => {
    if (activity.status === 'completed') {
      const activityType = activity.activityType || 'other';
      
      if (activityType === 'other') {
        // Count each 'other' activity separately (each adds 1%)
        otherActivitiesCount++;
      } else if (!completedTypes.has(activityType)) {
        // Only count each predefined activity type once
        completedTypes.add(activityType);
        const weight = activityWeights[activityType] || 0;
        totalProgress += weight;
      }
    }
  });
  
  // Add progress from 'other' activities
  totalProgress += otherActivitiesCount;
  
  // Cap at 95% if sale is not completed (leave 5% for final sale activity)
  this.progress.percentage = Math.min(totalProgress, 95);
  this.progress.lastUpdated = new Date();
  
  // Update stage based on latest completed activity
  const lastCompleted = this.activities
    .filter(a => a.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedDate ? new Date(a.completedDate) : new Date(0);
      const dateB = b.completedDate ? new Date(b.completedDate) : new Date(0);
      return dateB - dateA;
    })[0];
  
  if (lastCompleted) {
    if (lastCompleted.activityType === 'harvesting') {
      this.progress.currentStage = 'harvesting';
    } else if (['pest_control', 'weeding', 'irrigation', 'fertilizer_application'].includes(lastCompleted.activityType)) {
      this.progress.currentStage = 'maintenance';
    } else if (lastCompleted.activityType === 'seed_sowing') {
      this.progress.currentStage = 'sowing';
    } else if (['land_preparation', 'ploughing'].includes(lastCompleted.activityType)) {
      this.progress.currentStage = 'preparation';
    } else if (lastCompleted.activityType === 'other') {
      // Keep current stage for 'other' activities
      if (!this.progress.currentStage || this.progress.currentStage === 'planning') {
        this.progress.currentStage = 'growth';
      }
    }
  }
  
  await this.save();
  return this.progress.percentage;
};

// Method to update actual costs
farmingPlanSchema.methods.updateActualCosts = function() {
  this.actualCosts.seedCost = this.activities
    .filter(a => a.activityType === 'seed_sowing')
    .reduce((sum, a) => sum + (a.cost || 0), 0);
    
  this.actualCosts.fertilizerCost = this.activities
    .filter(a => a.activityType === 'fertilizer_application')
    .reduce((sum, a) => sum + (a.cost || 0), 0);
    
  this.actualCosts.laborCost = this.activities
    .filter(a => ['land_preparation', 'ploughing', 'weeding', 'harvesting'].includes(a.activityType))
    .reduce((sum, a) => sum + (a.cost || 0), 0);
    
  this.actualCosts.otherCosts = this.activities
    .filter(a => !['seed_sowing', 'fertilizer_application', 'land_preparation', 'ploughing', 'weeding', 'harvesting'].includes(a.activityType))
    .reduce((sum, a) => sum + (a.cost || 0), 0);
    
  this.actualCosts.totalSpent = 
    this.actualCosts.seedCost + 
    this.actualCosts.fertilizerCost + 
    this.actualCosts.laborCost + 
    this.actualCosts.otherCosts;
    
  return this.save();
};

const FarmingPlan = mongoose.model('FarmingPlan', farmingPlanSchema);

export default FarmingPlan;
