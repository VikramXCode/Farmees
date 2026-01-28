// MongoDB Schema for AI Interactions
import mongoose from 'mongoose';

const contextSchema = new mongoose.Schema({
  selectedLand: { type: String },
  weatherData: { type: mongoose.Schema.Types.Mixed },
  marketData: { type: mongoose.Schema.Types.Mixed },
  recentActivities: [{ type: String }]
});

const feedbackSchema = new mongoose.Schema({
  helpful: { type: Boolean },
  rating: { type: Number, min: 1, max: 5 },
  comments: { type: String }
});

const aiInteractionSchema = new mongoose.Schema({
  landId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  userMessage: { type: String, required: true },
  aiResponse: { type: String, required: true },
  context: contextSchema,
  feedback: feedbackSchema
});

// Indexes for better query performance
aiInteractionSchema.index({ landId: 1, timestamp: -1 });
aiInteractionSchema.index({ userId: 1, timestamp: -1 });
aiInteractionSchema.index({ timestamp: -1 });

export default mongoose.model('AIInteraction', aiInteractionSchema);
