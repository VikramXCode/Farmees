import mongoose from 'mongoose';

const SoilReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  landId: {
    type: String,
    required: true,
    ref: 'Land'
  },
  userId: {
    type: String,
    required: true
  },

  // Core soil parameters
  pH: {
    type: Number,
    min: 0,
    max: 14
  },
  organicMatter: {
    type: Number,
    min: 0
  },
  nitrogen: {
    type: Number,
    min: 0
  },
  phosphorus: {
    type: Number,
    min: 0
  },
  potassium: {
    type: Number,
    min: 0
  },
  moisture: {
    type: Number,
    min: 0,
    max: 100
  },

  // Micronutrients
  zinc: Number,
  iron: Number,
  copper: Number,
  manganese: Number,
  sulfur: Number,
  boron: Number,

  // Soil properties
  texture: {
    type: String,
    enum: ['sandy', 'clay', 'loam', 'sandy-loam', 'clay-loam', 'silty-clay', 'silty-loam', 'silt']
  },
  cationExchangeCapacity: Number,
  electricalConductivity: Number,

  // Report metadata
  analysisDate: {
    type: Date,
    default: Date.now
  },
  laboratoryName: String,
  reportUrl: String, // Path to uploaded PDF/image
  extractionMethod: {
    type: String,
    enum: ['tesseract', 'easyocr', 'manual', 'fallback'],
    default: 'tesseract'
  },

  // OCR extraction details
  extractedText: String,
  extractionAccuracy: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },

  // AI recommendations based on this soil report
  recommendations: [{
    cropName: String,
    suitabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    reason: String,
    requirements: [String],
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status and tracking
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient queries
SoilReportSchema.index({ landId: 1 });
SoilReportSchema.index({ userId: 1 });
SoilReportSchema.index({ analysisDate: -1 });

// Update the updatedAt field before saving
SoilReportSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('SoilReport', SoilReportSchema);