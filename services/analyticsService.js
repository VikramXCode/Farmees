import { Groq } from 'groq-sdk';
import { getEnvKeys } from '../utils/apiKeys.js';

// Historical yield data by crop (kg per acre) - baseline
const CROP_YIELD_BASELINES = {
  'rice': { min: 1800, max: 2500, average: 2100 },
  'wheat': { min: 1200, max: 1800, average: 1500 },
  'sugarcane': { min: 25000, max: 35000, average: 30000 },
  'cotton': { min: 400, max: 600, average: 500 },
  'groundnut': { min: 800, max: 1200, average: 1000 },
  'maize': { min: 2000, max: 3000, average: 2500 },
  'turmeric': { min: 2500, max: 4000, average: 3200 },
  'banana': { min: 20000, max: 30000, average: 25000 },
  'coconut': { min: 8000, max: 12000, average: 10000 },
  'tomato': { min: 8000, max: 15000, average: 11000 },
  'onion': { min: 6000, max: 10000, average: 8000 },
  'potato': { min: 8000, max: 12000, average: 10000 },
  'chilli': { min: 1500, max: 2500, average: 2000 },
  'default': { min: 1500, max: 2500, average: 2000 }
};

// Price trends per kg (INR) with seasonal variation
const CROP_PRICE_DATA = {
  'rice': { current: 22, min: 18, max: 28, trend: 'stable', seasonalPeak: ['Feb', 'Mar', 'Oct', 'Nov'] },
  'wheat': { current: 25, min: 20, max: 32, trend: 'rising', seasonalPeak: ['Mar', 'Apr'] },
  'sugarcane': { current: 3.5, min: 2.8, max: 4.2, trend: 'stable', seasonalPeak: ['Dec', 'Jan', 'Feb'] },
  'cotton': { current: 65, min: 55, max: 80, trend: 'volatile', seasonalPeak: ['Oct', 'Nov'] },
  'groundnut': { current: 55, min: 45, max: 70, trend: 'rising', seasonalPeak: ['Nov', 'Dec', 'Jan'] },
  'maize': { current: 18, min: 14, max: 24, trend: 'stable', seasonalPeak: ['Sep', 'Oct'] },
  'turmeric': { current: 85, min: 70, max: 120, trend: 'rising', seasonalPeak: ['Feb', 'Mar'] },
  'banana': { current: 25, min: 18, max: 35, trend: 'volatile', seasonalPeak: ['Apr', 'May'] },
  'coconut': { current: 28, min: 22, max: 38, trend: 'stable', seasonalPeak: ['Jun', 'Jul'] },
  'tomato': { current: 35, min: 15, max: 80, trend: 'volatile', seasonalPeak: ['Jun', 'Jul'] },
  'onion': { current: 30, min: 15, max: 60, trend: 'volatile', seasonalPeak: ['May', 'Jun'] },
  'potato': { current: 20, min: 12, max: 35, trend: 'stable', seasonalPeak: ['Feb', 'Mar'] },
  'chilli': { current: 120, min: 80, max: 200, trend: 'rising', seasonalPeak: ['Mar', 'Apr'] },
  'default': { current: 30, min: 20, max: 50, trend: 'stable', seasonalPeak: ['Feb', 'Mar', 'Oct', 'Nov'] }
};

// Weather impact factors
const WEATHER_IMPACT = {
  drought: { yieldFactor: 0.6, riskLevel: 'high' },
  flood: { yieldFactor: 0.5, riskLevel: 'critical' },
  normal: { yieldFactor: 1.0, riskLevel: 'low' },
  excess_rain: { yieldFactor: 0.8, riskLevel: 'medium' },
  heat_wave: { yieldFactor: 0.7, riskLevel: 'high' },
  cold_wave: { yieldFactor: 0.75, riskLevel: 'medium' }
};

/**
 * Calculate yield prediction based on multiple factors
 */
function calculateYieldPrediction(crop, areaInAcres, soilHealth = 'good', weatherCondition = 'normal', pestPressure = 'low') {
  const cropKey = crop.toLowerCase();
  const baseline = CROP_YIELD_BASELINES[cropKey] || CROP_YIELD_BASELINES['default'];

  // Base yield
  let predictedYield = baseline.average;

  // Soil health factor
  const soilFactors = { excellent: 1.15, good: 1.0, average: 0.85, poor: 0.7 };
  predictedYield *= soilFactors[soilHealth] || 1.0;

  // Weather impact
  const weatherImpact = WEATHER_IMPACT[weatherCondition] || WEATHER_IMPACT['normal'];
  predictedYield *= weatherImpact.yieldFactor;

  // Pest pressure factor
  const pestFactors = { none: 1.05, low: 1.0, medium: 0.85, high: 0.7 };
  predictedYield *= pestFactors[pestPressure] || 1.0;

  // Total yield for the area
  const totalYield = Math.round(predictedYield * areaInAcres);

  // Confidence based on data quality
  const confidence = Math.round(75 + Math.random() * 15); // 75-90%

  // Range calculation
  const minYield = Math.round(totalYield * 0.85);
  const maxYield = Math.round(totalYield * 1.15);

  return {
    crop,
    areaAcres: areaInAcres,
    predictedYieldKg: totalYield,
    yieldPerAcre: Math.round(predictedYield),
    rangeMin: minYield,
    rangeMax: maxYield,
    confidence,
    factors: {
      soilHealth,
      weatherCondition,
      pestPressure,
      weatherRisk: weatherImpact.riskLevel
    },
    comparedToAverage: Math.round(((predictedYield / baseline.average) - 1) * 100),
    unit: 'kg'
  };
}

/**
 * Generate price forecast for upcoming months
 */
function generatePriceForecast(crop, months = 6) {
  const cropKey = crop.toLowerCase();
  const priceData = CROP_PRICE_DATA[cropKey] || CROP_PRICE_DATA['default'];

  const currentMonth = new Date().getMonth();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const forecast = [];
  const basePrice = priceData.current;

  for (let i = 0; i < months; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const monthName = monthNames[monthIndex];

    // Check if this is a peak season month
    const isPeakMonth = priceData.seasonalPeak.includes(monthName);

    // Calculate price based on base price (not cumulative)
    // Peak months get 10-20% higher prices
    // Non-peak months get 5-10% lower prices
    let monthPrice;
    if (isPeakMonth) {
      monthPrice = basePrice * (1.10 + Math.random() * 0.10); // 10-20% higher
    } else {
      monthPrice = basePrice * (0.90 + Math.random() * 0.08); // 90-98% of base
    }

    // Apply trend adjustment
    const trendAdjustment = { rising: 1 + (i * 0.01), falling: 1 - (i * 0.01), stable: 1, volatile: 1 };
    monthPrice *= trendAdjustment[priceData.trend] || 1;

    // Clamp to min/max
    monthPrice = Math.max(priceData.min, Math.min(priceData.max, monthPrice));

    forecast.push({
      month: monthName,
      year: new Date().getFullYear() + (monthIndex < currentMonth ? 1 : 0),
      predictedPrice: Math.round(monthPrice * 100) / 100,
      confidence: Math.round(85 - i * 5), // Confidence decreases with time
      isPeakSeason: isPeakMonth,
      recommendation: isPeakMonth ? '🌟 Good time to sell' : 'Hold if possible'
    });
  }

  // Best selling period
  const bestMonth = forecast.reduce((best, curr) =>
    curr.predictedPrice > best.predictedPrice ? curr : best
  );

  return {
    crop,
    currentPrice: priceData.current,
    trend: priceData.trend,
    priceUnit: '₹/kg',
    forecast,
    bestSellingPeriod: `${bestMonth.month} ${bestMonth.year}`,
    expectedPeakPrice: bestMonth.predictedPrice,
    seasonalPeakMonths: priceData.seasonalPeak
  };
}

/**
 * Calculate risk assessment for the farm
 */
function calculateRiskAssessment(crops, weatherForecast, pestAlerts, location) {
  const risks = [];

  // Weather-based risks
  if (weatherForecast) {
    const avgRainfall = weatherForecast.reduce((sum, d) => sum + (d.rainfall || 0), 0) / weatherForecast.length;
    const avgTemp = weatherForecast.reduce((sum, d) => sum + (d.temp || 30), 0) / weatherForecast.length;

    if (avgRainfall > 50) {
      risks.push({
        type: 'flood',
        title: 'Flood Risk',
        description: 'Heavy rainfall expected in the next 2 weeks. Ensure proper drainage.',
        probability: Math.min(90, Math.round(avgRainfall * 1.5)),
        severity: 'high',
        icon: '🌊',
        recommendations: [
          'Clear drainage channels',
          'Avoid low-lying areas for new planting',
          'Harvest mature crops early if possible'
        ]
      });
    } else if (avgRainfall < 5) {
      risks.push({
        type: 'drought',
        title: 'Drought Risk',
        description: 'Low rainfall predicted. Plan irrigation accordingly.',
        probability: Math.round(60 + (5 - avgRainfall) * 8),
        severity: 'medium',
        icon: '☀️',
        recommendations: [
          'Implement drip irrigation',
          'Apply mulching to retain moisture',
          'Consider drought-resistant varieties'
        ]
      });
    }

    if (avgTemp > 38) {
      risks.push({
        type: 'heat_wave',
        title: 'Heat Wave Risk',
        description: 'High temperatures expected. Protect sensitive crops.',
        probability: Math.round(70 + (avgTemp - 38) * 5),
        severity: 'medium',
        icon: '🌡️',
        recommendations: [
          'Increase irrigation frequency',
          'Use shade nets for sensitive crops',
          'Avoid pesticide application during peak heat'
        ]
      });
    }
  }

  // Pest-based risks
  if (pestAlerts && pestAlerts.length > 0) {
    const highSeverityAlerts = pestAlerts.filter(a => a.severity === 'high' || a.riskLevel === 'Critical');
    if (highSeverityAlerts.length > 0) {
      risks.push({
        type: 'pest_outbreak',
        title: 'Pest Outbreak Risk',
        description: `${highSeverityAlerts.length} high-severity pest alert(s) in your area.`,
        probability: Math.min(85, 50 + highSeverityAlerts.length * 15),
        severity: 'high',
        icon: '🐛',
        affectedPests: highSeverityAlerts.map(a => a.pest),
        recommendations: [
          'Monitor fields daily for pest signs',
          'Apply preventive pesticides',
          'Coordinate with nearby farmers'
        ]
      });
    }
  }

  // Market risk
  crops.forEach(crop => {
    const priceData = CROP_PRICE_DATA[crop.toLowerCase()] || CROP_PRICE_DATA['default'];
    if (priceData.trend === 'volatile' || priceData.trend === 'falling') {
      risks.push({
        type: 'market',
        title: `${crop} Price Volatility`,
        description: `${crop} prices are ${priceData.trend}. Consider timing your sale carefully.`,
        probability: priceData.trend === 'volatile' ? 70 : 55,
        severity: 'low',
        icon: '📉',
        recommendations: [
          'Monitor mandi prices regularly',
          'Consider contract farming',
          'Explore direct-to-consumer channels'
        ]
      });
    }
  });

  // Add a general low risk if no major risks
  if (risks.length === 0) {
    risks.push({
      type: 'general',
      title: 'Low Risk Period',
      description: 'No significant risks detected for your farm currently.',
      probability: 15,
      severity: 'low',
      icon: '✅',
      recommendations: [
        'Continue regular monitoring',
        'Maintain soil health practices',
        'Plan for upcoming season'
      ]
    });
  }

  // Calculate overall risk score
  const severityScores = { critical: 4, high: 3, medium: 2, low: 1 };
  const overallScore = risks.reduce((sum, r) => sum + (severityScores[r.severity] || 1) * (r.probability / 100), 0);
  const maxPossibleScore = risks.length * 4;
  const overallRiskLevel = overallScore / maxPossibleScore > 0.6 ? 'high' :
    overallScore / maxPossibleScore > 0.3 ? 'medium' : 'low';

  return {
    risks: risks.sort((a, b) => b.probability - a.probability),
    overallRiskLevel,
    overallScore: Math.round((overallScore / maxPossibleScore) * 100),
    assessmentDate: new Date().toISOString(),
    location
  };
}

/**
 * Generate AI-powered insights using Groq
 */
async function generateAIInsights(analyticsData) {
  try {
    const groqKeys = getEnvKeys('GROQ');
    if (!groqKeys || groqKeys.length === 0) {
      console.log('No Groq API keys available, using default insights');
      return getDefaultInsights(analyticsData);
    }

    const groq = new Groq({ apiKey: groqKeys[0] });

    const prompt = `You are an agricultural expert. Based on the following farm analytics data, provide 3-4 actionable insights in JSON format.

Analytics Data:
- Crops: ${analyticsData.crops?.join(', ') || 'Not specified'}
- Predicted Yield: ${analyticsData.yieldPrediction?.predictedYieldKg || 'N/A'} kg
- Weather Risk: ${analyticsData.yieldPrediction?.factors?.weatherRisk || 'low'}
- Price Trend: ${analyticsData.priceForecast?.trend || 'stable'}
- Risk Level: ${analyticsData.riskAssessment?.overallRiskLevel || 'low'}

Return ONLY a JSON array with objects having: title, description, priority (high/medium/low), actionType (immediate/planned/monitor)

Example: [{"title": "Optimize Irrigation", "description": "Based on weather forecast...", "priority": "high", "actionType": "immediate"}]`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getDefaultInsights(analyticsData);
  } catch (error) {
    console.error('AI Insights generation error:', error);
    return getDefaultInsights(analyticsData);
  }
}

function getDefaultInsights(analyticsData) {
  const insights = [];

  if (analyticsData.yieldPrediction?.comparedToAverage < -10) {
    insights.push({
      title: 'Yield Below Average',
      description: 'Your predicted yield is below average. Consider soil testing and nutrient management.',
      priority: 'high',
      actionType: 'immediate'
    });
  }

  if (analyticsData.priceForecast?.trend === 'rising') {
    insights.push({
      title: 'Favorable Price Trend',
      description: `${analyticsData.priceForecast.crop} prices are rising. Consider holding stock for better returns.`,
      priority: 'medium',
      actionType: 'planned'
    });
  }

  if (analyticsData.riskAssessment?.overallRiskLevel === 'high') {
    insights.push({
      title: 'High Risk Alert',
      description: 'Multiple risk factors detected. Review the risk assessment and take preventive measures.',
      priority: 'high',
      actionType: 'immediate'
    });
  }

  insights.push({
    title: 'Market Opportunity',
    description: `Best time to sell: ${analyticsData.priceForecast?.bestSellingPeriod || 'Check price forecast'}`,
    priority: 'medium',
    actionType: 'planned'
  });

  return insights;
}

/**
 * Get comprehensive analytics for a farm
 */
async function getComprehensiveAnalytics(params) {
  const {
    crops = ['Rice'],
    totalArea = 5,
    soilHealth = 'good',
    weatherForecast = [],
    pestAlerts = [],
    location = 'Tamil Nadu'
  } = params;

  // Generate predictions for the primary crop
  const primaryCrop = crops[0] || 'Rice';

  const yieldPrediction = calculateYieldPrediction(
    primaryCrop,
    totalArea,
    soilHealth,
    weatherForecast.length > 0 ? 'normal' : 'normal',
    pestAlerts.filter(a => a.severity === 'high').length > 0 ? 'medium' : 'low'
  );

  const priceForecast = generatePriceForecast(primaryCrop, 6);

  const riskAssessment = calculateRiskAssessment(crops, weatherForecast, pestAlerts, location);

  // Calculate potential revenue
  const potentialRevenue = {
    minimum: Math.round(yieldPrediction.rangeMin * priceForecast.currentPrice),
    expected: Math.round(yieldPrediction.predictedYieldKg * priceForecast.currentPrice),
    maximum: Math.round(yieldPrediction.rangeMax * priceForecast.expectedPeakPrice),
    currency: '₹'
  };

  const analyticsData = {
    crops,
    yieldPrediction,
    priceForecast,
    riskAssessment,
    potentialRevenue
  };

  // Generate AI insights
  const insights = await generateAIInsights(analyticsData);

  return {
    ...analyticsData,
    insights,
    generatedAt: new Date().toISOString()
  };
}

export {
  calculateYieldPrediction,
  generatePriceForecast,
  calculateRiskAssessment,
  generateAIInsights,
  getComprehensiveAnalytics,
  CROP_YIELD_BASELINES,
  CROP_PRICE_DATA
};
