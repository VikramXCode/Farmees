// MongoDB Schema for Labour Coordinator
import mongoose from 'mongoose';

const coordinatorSchema = new mongoose.Schema({
  // Link to existing User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Basic Info
  name: { type: String, required: true },
  phone: { type: String, required: true },

  // Location & Service Area
  location: {
    district: { type: String, required: true },
    area: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  serviceRadius: { type: Number, default: 25 }, // km

  // Capabilities
  skillsOffered: [{
    type: String,
    enum: [
      'land_preparation',
      'sowing',
      'transplanting',
      'weeding',
      'fertilizing',
      'pest_control',
      'irrigation',
      'harvesting',
      'post_harvest',
      'general'
    ]
  }],

  // Worker Pool Summary
  workerCount: { type: Number, default: 0 },

  // Accountability Metrics
  reliabilityScore: { type: Number, default: 50, min: 0, max: 100 },
  totalRequestsHandled: { type: Number, default: 0 },
  successfulCompletions: { type: Number, default: 0 },
  replacementsProvided: { type: Number, default: 0 },
  failedCommitments: { type: Number, default: 0 },

  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  isDemo: { type: Boolean, default: false },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
coordinatorSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate and update reliability score
coordinatorSchema.methods.updateReliabilityScore = function () {
  if (this.totalRequestsHandled === 0) {
    this.reliabilityScore = 50;
    return;
  }

  const completionRate = this.successfulCompletions / this.totalRequestsHandled;
  const replacementBonus = Math.min(this.replacementsProvided * 0.5, 10); // Max 10 points bonus
  const failurePenalty = this.failedCommitments * 2;

  this.reliabilityScore = Math.min(100, Math.max(0,
    (completionRate * 80) + replacementBonus + 10 - failurePenalty
  ));
};

// Indexes
coordinatorSchema.index({ 'location.district': 1, isActive: 1 });
coordinatorSchema.index({ reliabilityScore: -1 });
coordinatorSchema.index({ skillsOffered: 1 });

export default mongoose.model('Coordinator', coordinatorSchema);
