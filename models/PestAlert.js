'use strict';

const mongoose = require('mongoose');

const PestAlertSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    farmer: { type: String, required: true },
    district: { type: String, required: true },
    area: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: false },
      lon: { type: Number, required: false }
    },
    pest: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    description: { type: String, required: true },
    affected_area: { type: String, required: false },
    distance: { type: String, required: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PestAlert', PestAlertSchema);
