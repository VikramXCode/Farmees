import express from 'express';
const router = express.Router();
import {
  getComprehensiveAnalytics,
  calculateYieldPrediction,
  generatePriceForecast,
  calculateRiskAssessment,
  CROP_YIELD_BASELINES,
  CROP_PRICE_DATA
} from '../services/analyticsService.js';


// GET /api/analytics - Get comprehensive analytics
router.get('/', async (req, res) => {
  try {
    const { crops, area, soilHealth, location } = req.query;

    const analytics = await getComprehensiveAnalytics({
      crops: crops ? crops.split(',') : ['Rice'],
      totalArea: parseFloat(area) || 5,
      soilHealth: soilHealth || 'good',
      weatherForecast: [], // Would integrate with weather service
      pestAlerts: [], // Fetch from database
      location: location || 'Tamil Nadu'
    });

    res.json(analytics);
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// GET /api/analytics/yield - Get yield prediction only
router.get('/yield', async (req, res) => {
  try {
    const { crop = 'Rice', area = 5, soilHealth = 'good', weather = 'normal', pestPressure = 'low' } = req.query;

    const prediction = calculateYieldPrediction(
      crop,
      parseFloat(area),
      soilHealth,
      weather,
      pestPressure
    );

    res.json(prediction);
  } catch (err) {
    console.error('GET /api/analytics/yield error:', err);
    res.status(500).json({ error: 'Failed to calculate yield prediction' });
  }
});

// GET /api/analytics/price - Get price forecast only
router.get('/price', async (req, res) => {
  try {
    const { crop = 'Rice', months = 6 } = req.query;

    const forecast = generatePriceForecast(crop, parseInt(months));

    res.json(forecast);
  } catch (err) {
    console.error('GET /api/analytics/price error:', err);
    res.status(500).json({ error: 'Failed to generate price forecast' });
  }
});

// GET /api/analytics/risk - Get risk assessment only
router.get('/risk', async (req, res) => {
  try {
    const { crops, location = 'Tamil Nadu' } = req.query;

    const assessment = calculateRiskAssessment(
      crops ? crops.split(',') : ['Rice'],
      [], // Weather forecast
      [], // Fetch pest alerts from database
      location
    );

    res.json(assessment);
  } catch (err) {
    console.error('GET /api/analytics/risk error:', err);
    res.status(500).json({ error: 'Failed to calculate risk assessment' });
  }
});

// GET /api/analytics/crops - Get supported crops list
router.get('/crops', (req, res) => {
  const crops = Object.keys(CROP_YIELD_BASELINES)
    .filter(c => c !== 'default')
    .map(crop => ({
      name: crop.charAt(0).toUpperCase() + crop.slice(1),
      key: crop,
      avgYield: CROP_YIELD_BASELINES[crop].average,
      priceInfo: CROP_PRICE_DATA[crop] || CROP_PRICE_DATA['default']
    }));

  res.json(crops);
});

export default router;

