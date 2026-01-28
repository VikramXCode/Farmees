// MongoDB Schema for Land Recommendations
const mongoose = require('mongoose');

const landRecommendationSchema = new mongoose.Schema({
  landId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['crop', 'fertilizer', 'treatment', 'irrigation', 'harvest'], 
    required: true 
  },
  recommendation: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 100, required: true },
  reasoning: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    required: true 
  },
  dueDate: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'completed'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
landRecommendationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
landRecommendationSchema.index({ landId: 1, status: 1 });
landRecommendationSchema.index({ userId: 1, status: 1 });
landRecommendationSchema.index({ type: 1, priority: 1 });
landRecommendationSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('LandRecommendation', landRecommendationSchema);
