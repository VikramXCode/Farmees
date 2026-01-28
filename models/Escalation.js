const mongoose = require('mongoose');

const EscalationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    landId: { type: String },
    landRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Land' },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    query: { type: String, required: true },
    context: { type: Object },
    suggestions: { type: [String], default: [] },
    district: { type: String },
    state: { type: String },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'notified', 'in-progress', 'resolved', 'closed'],
      default: 'pending',
      index: true,
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Escalation', EscalationSchema);
