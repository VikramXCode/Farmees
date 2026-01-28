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
import { DEMO_PEST_ALERTS } from '../middleware/demoMode.js';


// Demo analytics data for quick loading
const DEMO_ANALYTICS = {
  crops: ['Rice', 'Sugarcane'],
  yieldPrediction: {
    crop: 'Rice',
    areaAcres: 5,
    predictedYieldKg: 10500,
    yieldPerAcre: 2100,
    rangeMin: 8925,
    rangeMax: 12075,
    confidence: 82,
    factors: {
      soilHealth: 'good',
      weatherCondition: 'normal',
      pestPressure: 'low',
      weatherRisk: 'low'
    },
    comparedToAverage: 0,
    unit: 'kg'
  },
  priceForecast: {
    crop: 'Rice',
    currentPrice: 22,
    trend: 'stable',
    priceUnit: '₹/kg',
    forecast: [
      { month: 'Jan', year: 2026, predictedPrice: 22.5, confidence: 85, isPeakSeason: false, recommendation: 'Hold if possible' },
      { month: 'Feb', year: 2026, predictedPrice: 23.2, confidence: 80, isPeakSeason: false, recommendation: 'Hold if possible' },
      { month: 'Mar', year: 2026, predictedPrice: 24.1, confidence: 75, isPeakSeason: false, recommendation: 'Hold if possible' },
      { month: 'Apr', year: 2026, predictedPrice: 23.8, confidence: 70, isPeakSeason: false, recommendation: 'Hold if possible' },
      { month: 'May', year: 2026, predictedPrice: 22.9, confidence: 65, isPeakSeason: false, recommendation: 'Hold if possible' },
      { month: 'Jun', year: 2026, predictedPrice: 21.5, confidence: 60, isPeakSeason: false, recommendation: 'Hold if possible' }
    ],
    bestSellingPeriod: 'Mar 2026',
    expectedPeakPrice: 24.1,
    seasonalPeakMonths: ['Oct', 'Nov']
  },
  riskAssessment: {
    risks: [
      {
        type: 'pest_outbreak',
        title: 'Pest Outbreak Risk',
        description: '2 high-severity pest alerts in your area.',
        probability: 65,
        severity: 'medium',
        icon: '🐛',
        affectedPests: ['Stem Borer', 'Brown Plant Hopper'],
        recommendations: ['Monitor fields daily', 'Apply preventive pesticides', 'Coordinate with nearby farmers']
      },
      {
        type: 'market',
        title: 'Market Opportunity',
        description: 'Rice prices stable with slight upward trend expected.',
        probability: 45,
        severity: 'low',
        icon: '📈',
        recommendations: ['Monitor mandi prices', 'Plan harvest timing', 'Explore direct sales']
      }
    ],
    overallRiskLevel: 'medium',
    overallScore: 35,
    assessmentDate: new Date().toISOString(),
    location: 'Erode, Tamil Nadu'
  },
  potentialRevenue: {
    minimum: 196350,
    expected: 231000,
    maximum: 291008,
    currency: '₹'
  },
  insights: [
    {
      title: 'Optimal Harvest Window',
      description: 'Based on price trends, consider harvesting in late February to catch peak prices in March.',
      priority: 'high',
      actionType: 'planned'
    },
    {
      title: 'Pest Prevention',
      description: 'Stem borer activity detected nearby. Apply preventive measures within 48 hours.',
      priority: 'high',
      actionType: 'immediate'
    },
    {
      title: 'Soil Health Check',
      description: 'Schedule soil testing before next season for optimal yield.',
      priority: 'medium',
      actionType: 'planned'
    },
    {
      title: 'Water Management',
      description: 'Current weather is favorable. Maintain regular irrigation schedule.',
      priority: 'low',
      actionType: 'monitor'
    }
  ],
  generatedAt: new Date().toISOString()
};

// GET /api/analytics - Get comprehensive analytics
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/analytics - isDemo:', req.isDemo);

    // Return demo data for quick response
    if (req.isDemo || req.headers['x-demo-mode'] === 'true') {
      return res.json({
        ...DEMO_ANALYTICS,
        generatedAt: new Date().toISOString()
      });
    }

    const { crops, area, soilHealth, location } = req.query;

    const analytics = await getComprehensiveAnalytics({
      crops: crops ? crops.split(',') : ['Rice'],
      totalArea: parseFloat(area) || 5,
      soilHealth: soilHealth || 'good',
      weatherForecast: [], // Would integrate with weather service
      pestAlerts: DEMO_PEST_ALERTS, // Use demo alerts for now
      location: location || 'Tamil Nadu'
    });

    res.json(analytics);
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    // Return demo data on error for better UX
    res.json({
      ...DEMO_ANALYTICS,
      generatedAt: new Date().toISOString(),
      _fallback: true
    });
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
      DEMO_PEST_ALERTS,
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

