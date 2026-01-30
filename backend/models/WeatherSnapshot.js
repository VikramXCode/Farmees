import mongoose from 'mongoose';

/**
 * WeatherSnapshot Schema
 * Stores weather data used for activity decisions (audit trail)
 */
const weatherSnapshotSchema = new mongoose.Schema({
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmingPlan',
    required: true,
    index: true
  },
  
  activityId: {
    type: String,
    index: true
  },
  
  // Location context
  location: {
    lat: Number,
    lon: Number,
    city: String,
    district: String,
    state: String
  },
  
  // When this snapshot was taken
  snapshotDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Forecast data (7-10 days)
  forecast: [{
    date: {
      type: Date,
      required: true
    },
    
    tempMin: Number,
    tempMax: Number,
    tempAvg: Number,
    
    humidity: Number,
    
    rainfall: {
      probability: Number, // 0-100
      amount: Number // mm
    },
    
    windSpeed: Number,
    
    condition: String, // clear, rain, cloudy, storm
    
    uvIndex: Number,
    
    // Derived farming impacts
    farmingImpact: {
      irrigationNeeded: Boolean,
      pestRisk: String, // low, medium, high
      diseaseRisk: String,
      heatStress: Boolean,
      coldStress: Boolean
    }
  }],
  
  // Decision made based on this weather
  decision: {
    action: String, // delay, proceed, reschedule, warning
    reason: String,
    affectedActivityType: String,
    suggestedDate: Date
  },
  
  // API source
  weatherSource: {
    type: String,
    default: 'openweather'
  },
  
  // Raw API response (for debugging)
  rawData: mongoose.Schema.Types.Mixed
  
}, {
  timestamps: true
});

// Indexes
weatherSnapshotSchema.index({ planId: 1, snapshotDate: -1 });
weatherSnapshotSchema.index({ 'forecast.date': 1 });
weatherSnapshotSchema.index({ activityId: 1 });

// Auto-delete old snapshots after 90 days
weatherSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const WeatherSnapshot = mongoose.model('WeatherSnapshot', weatherSnapshotSchema);

export default WeatherSnapshot;
