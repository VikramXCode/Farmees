// MongoDB Schema for Farm Worker (managed by Coordinator)
import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  // Link to Coordinator
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator',
    required: true
  },

  // Basic Info
  name: { type: String, required: true },
  phone: { type: String, required: true },

  // Skills
  skills: [{
    type: {
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
      ],
      required: true
    },
    experienceYears: { type: Number, default: 0 }
  }],

  // Availability (weekly schedule)
  availability: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: false }
  },

  // Standby flag - available as backup
  isStandby: { type: Boolean, default: false },

  // Reliability Tracking
  reliabilityScore: { type: Number, default: 50, min: 0, max: 100 },
  totalAssignments: { type: Number, default: 0 },
  completedAssignments: { type: Number, default: 0 },
  cancelledAssignments: { type: Number, default: 0 },

  // Status
  isActive: { type: Boolean, default: true },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDemo: { type: Boolean, default: false }
});

// Update timestamp on save
workerSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate and update reliability score
workerSchema.methods.updateReliabilityScore = function () {
  if (this.totalAssignments === 0) {
    this.reliabilityScore = 50;
    return;
  }

  const completionRate = this.completedAssignments / this.totalAssignments;
  const cancellationPenalty = this.cancelledAssignments * 5;

  this.reliabilityScore = Math.min(100, Math.max(0,
    (completionRate * 90) + 10 - cancellationPenalty
  ));
};

// Check if worker is available on a specific day
workerSchema.methods.isAvailableOn = function (date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[new Date(date).getDay()];
  return this.availability[dayName] === true;
};

// Check if worker has a specific skill
workerSchema.methods.hasSkill = function (skillType) {
  return this.skills.some(s => s.type === skillType);
};

// Indexes
workerSchema.index({ coordinatorId: 1, isActive: 1 });
workerSchema.index({ 'skills.type': 1 });
workerSchema.index({ reliabilityScore: -1 });
workerSchema.index({ isStandby: 1, isActive: 1 });

export default mongoose.model('Worker', workerSchema);
