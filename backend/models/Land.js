// MongoDB Schema for Land Data
const mongoose = require('mongoose');

const soilReportSchema = new mongoose.Schema({
  pH: { type: Number, min: 0, max: 14 },
  nitrogen: { type: Number, min: 0 },
  phosphorus: { type: Number, min: 0 },
  potassium: { type: Number, min: 0 },
  organicMatter: { type: Number, min: 0, max: 100 },
  moisture: { type: Number, min: 0, max: 100 },
  texture: { type: String },
  analysisDate: { type: Date, default: Date.now },
  reportUrl: { type: String }
});

const weatherHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, min: 0, max: 100 },
  rainfall: { type: Number, min: 0 },
  windSpeed: { type: Number, min: 0 },
  conditions: { type: String, required: true }
});

const cropHistorySchema = new mongoose.Schema({
  cropName: { type: String, required: true },
  plantingDate: { type: Date, required: true },
  harvestDate: { type: Date },
  yield: { type: Number, min: 0 },
  notes: { type: String }
});

const pestDiseaseHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['pest', 'disease'], required: true },
  name: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  treatment: { type: String, required: true },
  status: { type: String, enum: ['active', 'resolved', 'prevented'], required: true },
  images: [{ type: String }]
});

const treatmentHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['fertilizer', 'pesticide', 'herbicide', 'irrigation'], required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  notes: { type: String }
});

const priceHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  market: { type: String, required: true }
});

const marketDataSchema = new mongoose.Schema({
  cropName: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  priceHistory: [priceHistorySchema],
  demand: { type: String, enum: ['low', 'medium', 'high'], required: true },
  forecast: {
    nextMonth: { type: Number },
    nextQuarter: { type: Number }
  }
});

const recommendedActionSchema = new mongoose.Schema({
  action: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed', 'overdue'], required: true }
});

const aiContextSchema = new mongoose.Schema({
  lastInteraction: { type: Date, default: Date.now },
  commonQuestions: [{ type: String }],
  recommendedActions: [recommendedActionSchema],
  preferences: {
    communicationStyle: { type: String, enum: ['technical', 'simple', 'detailed'], default: 'simple' },
    focusAreas: [{ type: String }],
    alertLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }
});

const landSchema = new mongoose.Schema({
  landId: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  
  // Basic Land Information
  name: { type: String, required: true },
  location: { type: String, required: true },
  postalCode: { type: String }, // Postal/PIN code for approximate location
  soilType: { type: String, required: true },
  currentCrop: { type: String, required: true },
  waterAvailability: { type: String, enum: ['high', 'medium', 'low'], required: true },
  
  // Coordinates for map display (can be derived from postal code)
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  
  // Soil Analysis Data - Reference to SoilReport collection
  soilReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SoilReport'
  },
  // Keep basic soil info for quick access
  soilReport: soilReportSchema,
  
  // Historical Data
  weatherHistory: [weatherHistorySchema],
  cropHistory: [cropHistorySchema],
  pestDiseaseHistory: [pestDiseaseHistorySchema],
  treatmentHistory: [treatmentHistorySchema],
  marketData: [marketDataSchema],
  
  // AI Context
  aiContext: aiContextSchema,
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isDemo: { type: Boolean, default: false }
});

// Update the updatedAt field before saving
landSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
landSchema.index({ userId: 1, isActive: 1 });
landSchema.index({ landId: 1 }, { unique: true }); // explicit unique index for landId
landSchema.index({ 'aiContext.lastInteraction': -1 });

module.exports = mongoose.model('Land', landSchema);
