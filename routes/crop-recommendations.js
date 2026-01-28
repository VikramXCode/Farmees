import express from 'express';
const router = express.Router();
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import Land from '../models/Land.js';
import SoilReport from '../models/SoilReport.js';
import groqService from '../services/groqService.js';
import { isDemoUser, DEMO_CROP_RECOMMENDATION } from '../middleware/demoMode.js';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for audio file uploads
const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use /tmp on Vercel (serverless), local uploads dir otherwise
    const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads', 'audio') : path.join(__dirname, '../uploads/audio');
    try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { console.warn('Could not create upload dir:', e.message); }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const audioUpload = multer({
  storage: audioStorage,
  fileFilter: function (req, file, cb) {
    // Accept audio files only
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/flac'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed (wav, mp3, ogg, webm, m4a, flac)'), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// Test endpoint to verify service is working
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Crop recommendation service is working',
      groqKeysLoaded: groqService.availableKeys ? groqService.availableKeys.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate AI-powered crop recommendation using Groq
router.post('/ai-generate', async (req, res) => {
  try {
    const { landId, userQuery = '', userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let landData = null;
    let soilData = null;

    // Fetch land data if landId is provided
    if (landId) {
      landData = await Land.findOne({ landId: landId, userId });
      if (!landData) {
        return res.status(404).json({ error: 'Land not found' });
      }

      // Fetch latest soil report for this land
      soilData = await SoilReport.findOne({
        landId,
        userId
      }).sort({ createdAt: -1 });
    }

    // Generate recommendation using Groq
    const result = await groqService.generateCropRecommendation(
      landData,
      soilData,
      userQuery
    );

    res.json({
      success: true,
      recommendation: result.recommendation,
      landData: landData ? {
        id: landData.landId,
        location: landData.location,
        size: landData.size,
        soilType: landData.soilType,
        currentCrop: landData.currentCrop
      } : null,
      soilData: soilData ? {
        ph: soilData.ph,
        nitrogen: soilData.nitrogen,
        phosphorus: soilData.phosphorus,
        potassium: soilData.potassium,
        organicMatter: soilData.organicMatter,
        moisture: soilData.moisture
      } : null,
      metadata: {
        keyUsed: result.keyUsed,
        model: result.model,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI crop recommendation generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate AI crop recommendation',
        details: error.message
      });
    }
  }
});

// Chat with the recommendation bot
router.post('/chat', async (req, res) => {
  try {
    const { messages, landId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    let landData = null;
    let soilData = null;

    // Fetch context data if landId is provided
    if (landId) {
      landData = await Land.findOne({ landId: landId, userId });
      if (landData) {
        soilData = await SoilReport.findOne({
          landId,
          userId
        }).sort({ createdAt: -1 });
      }
    }

    // Chat with Groq
    const result = await groqService.chatWithBot(messages, landData, soilData);

    res.json({
      success: true,
      response: result.response,
      metadata: {
        keyUsed: result.keyUsed,
        contextUsed: {
          land: landData ? true : false,
          soil: soilData ? true : false
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
});

// Speech-to-text transcription endpoint
router.post('/speech-to-text', audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { userId, language = 'en' } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Create a file stream for Groq API
    const audioFile = fs.createReadStream(req.file.path);
    audioFile.path = req.file.path; // Groq SDK needs the path property

    // Transcribe audio using Groq with specified language
    const result = await groqService.transcribeAudio(audioFile, language);

    // Clean up the uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting audio file:', err);
    });

    res.json({
      success: true,
      transcription: result.text,
      metadata: {
        keyUsed: result.keyUsed,
        model: result.model,
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);

    // Clean up the uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting audio file on error:', err);
      });
    }

    res.status(500).json({
      error: 'Failed to transcribe audio',
      details: error.message
    });
  }
});

// Advanced crop recommendation based on comprehensive land analysis
router.get('/crops/:landId', async (req, res) => {
  try {
    const { landId } = req.params;
    console.log('Generating recommendations for land:', landId);

    // Fetch complete land data with soil reports
    const land = await Land.findOne({ landId, isActive: true });
    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    // Fetch latest soil report for detailed analysis
    const soilReport = await SoilReport.findOne({ landId }).sort({ analysisDate: -1 });

    // Analyze all available data
    const analysis = await analyzeCompleteData(land, soilReport);

    // Generate recommendations
    const recommendations = generateIntelligentRecommendations(analysis);

    res.json({
      landInfo: {
        name: land.name,
        location: land.location,
        soilType: land.soilType,
        currentCrop: land.currentCrop
      },
      analysis,
      recommendations,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recommendation generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function analyzeCompleteData(land, soilReport) {
  const analysis = {
    soilHealth: {},
    climatePattern: {},
    cropPerformance: {},
    riskFactors: [],
    opportunities: []
  };

  // Soil Health Analysis
  if (soilReport) {
    analysis.soilHealth = {
      pH: {
        value: soilReport.pH,
        status: getpHStatus(soilReport.pH),
        recommendation: getpHRecommendation(soilReport.pH)
      },
      nutrients: {
        nitrogen: {
          value: soilReport.nitrogen,
          status: getNutrientStatus('nitrogen', soilReport.nitrogen),
          deficiency: soilReport.nitrogen < 40
        },
        phosphorus: {
          value: soilReport.phosphorus,
          status: getNutrientStatus('phosphorus', soilReport.phosphorus),
          deficiency: soilReport.phosphorus < 20
        },
        potassium: {
          value: soilReport.potassium,
          status: getNutrientStatus('potassium', soilReport.potassium),
          deficiency: soilReport.potassium < 150
        }
      },
      organicMatter: {
        value: soilReport.organicMatter,
        status: soilReport.organicMatter > 3 ? 'good' : soilReport.organicMatter > 1.5 ? 'fair' : 'poor'
      }
    };
  } else {
    analysis.soilHealth = land.soilReport || {};
  }

  // Climate Pattern Analysis
  if (land.weatherHistory && land.weatherHistory.length > 0) {
    const recentWeather = land.weatherHistory.slice(-30); // Last 30 days
    analysis.climatePattern = {
      avgTemperature: recentWeather.reduce((sum, w) => sum + w.temperature, 0) / recentWeather.length,
      totalRainfall: recentWeather.reduce((sum, w) => sum + (w.rainfall || 0), 0),
      avgHumidity: recentWeather.reduce((sum, w) => sum + w.humidity, 0) / recentWeather.length,
      dominantCondition: getMostFrequent(recentWeather.map(w => w.conditions))
    };
  }

  // Crop Performance Analysis
  if (land.cropHistory && land.cropHistory.length > 0) {
    analysis.cropPerformance = {
      averageYield: land.cropHistory.reduce((sum, c) => sum + (c.yield || 0), 0) / land.cropHistory.length,
      successfulCrops: land.cropHistory.filter(c => c.yield > 0).map(c => c.cropName),
      seasonalPattern: analyzeSeasonalPattern(land.cropHistory)
    };
  }

  // Risk Factor Analysis
  if (land.pestDiseaseHistory && land.pestDiseaseHistory.length > 0) {
    const recentIssues = land.pestDiseaseHistory.slice(-12); // Last 12 records
    analysis.riskFactors = recentIssues.map(issue => ({
      type: issue.type,
      name: issue.name,
      frequency: 'recurring',
      preventionTips: getPestPreventionTips(issue.name)
    }));
  }

  return analysis;
}

function generateIntelligentRecommendations(analysis) {
  const recommendations = [];

  // Soil-based recommendations
  if (analysis.soilHealth.pH) {
    if (analysis.soilHealth.pH.value < 6.0) {
      recommendations.push({
        category: 'Acid-tolerant crops',
        crops: ['Potato', 'Sweet Potato', 'Blueberry', 'Tea', 'Coffee'],
        reason: `Soil pH is ${analysis.soilHealth.pH.value}, which is acidic`,
        suitabilityScore: 85,
        requirements: ['Consider lime application to raise pH', 'Use acid-tolerant varieties']
      });
    } else if (analysis.soilHealth.pH.value > 8.0) {
      recommendations.push({
        category: 'Alkaline-tolerant crops',
        crops: ['Barley', 'Sugar beet', 'Asparagus', 'Cabbage'],
        reason: `Soil pH is ${analysis.soilHealth.pH.value}, which is alkaline`,
        suitabilityScore: 80,
        requirements: ['Consider sulfur application to lower pH', 'Monitor iron availability']
      });
    } else {
      recommendations.push({
        category: 'General crops',
        crops: ['Rice', 'Wheat', 'Maize', 'Tomato', 'Beans', 'Vegetables'],
        reason: `Soil pH is ${analysis.soilHealth.pH.value}, which is optimal for most crops`,
        suitabilityScore: 90,
        requirements: ['Maintain current pH levels', 'Regular nutrient management']
      });
    }
  }

  // Nutrient-based recommendations
  if (analysis.soilHealth.nutrients) {
    const nutrients = analysis.soilHealth.nutrients;

    if (nutrients.nitrogen && nutrients.nitrogen.deficiency) {
      recommendations.push({
        category: 'Nitrogen-efficient crops',
        crops: ['Legumes (Beans, Peas)', 'Soybean', 'Groundnut', 'Lentils'],
        reason: 'Low nitrogen levels detected',
        suitabilityScore: 75,
        requirements: ['These crops can fix their own nitrogen', 'Apply nitrogen fertilizer for other crops']
      });
    }

    if (nutrients.phosphorus && nutrients.phosphorus.deficiency) {
      recommendations.push({
        category: 'Low phosphorus requirement',
        crops: ['Millets', 'Sorghum', 'Barley'],
        reason: 'Low phosphorus levels detected',
        suitabilityScore: 70,
        requirements: ['Apply phosphorus fertilizer', 'Consider rock phosphate application']
      });
    }

    if (nutrients.potassium && !nutrients.potassium.deficiency) {
      recommendations.push({
        category: 'Potassium-loving crops',
        crops: ['Banana', 'Sugarcane', 'Potato', 'Tobacco'],
        reason: 'Good potassium levels available',
        suitabilityScore: 85,
        requirements: ['Maintain potassium levels', 'Regular soil testing']
      });
    }
  }

  // Climate-based recommendations
  if (analysis.climatePattern) {
    const climate = analysis.climatePattern;

    if (climate.totalRainfall > 1000) {
      recommendations.push({
        category: 'High rainfall crops',
        crops: ['Rice', 'Sugarcane', 'Banana', 'Coconut'],
        reason: `High rainfall pattern detected (${climate.totalRainfall}mm)`,
        suitabilityScore: 85,
        requirements: ['Ensure proper drainage', 'Monitor for fungal diseases']
      });
    } else if (climate.totalRainfall < 300) {
      recommendations.push({
        category: 'Drought-resistant crops',
        crops: ['Millets', 'Sorghum', 'Cotton', 'Sesame'],
        reason: `Low rainfall pattern detected (${climate.totalRainfall}mm)`,
        suitabilityScore: 80,
        requirements: ['Implement drip irrigation', 'Mulching recommended']
      });
    }

    if (climate.avgTemperature > 30) {
      recommendations.push({
        category: 'Heat-tolerant crops',
        crops: ['Okra', 'Chili', 'Watermelon', 'Muskmelon'],
        reason: `High average temperature (${climate.avgTemperature.toFixed(1)}°C)`,
        suitabilityScore: 75,
        requirements: ['Provide shade during peak summer', 'Increase irrigation frequency']
      });
    }
  }

  // Historical performance recommendations
  if (analysis.cropPerformance && analysis.cropPerformance.successfulCrops) {
    recommendations.push({
      category: 'Proven performers',
      crops: analysis.cropPerformance.successfulCrops,
      reason: 'Based on your successful crop history',
      suitabilityScore: 95,
      requirements: ['Continue best practices', 'Consider expanding area']
    });
  }

  // Sort recommendations by suitability score
  recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return recommendations;
}

// Helper functions
function getpHStatus(pH) {
  if (pH < 5.5) return 'very_acidic';
  if (pH < 6.0) return 'acidic';
  if (pH <= 7.5) return 'optimal';
  if (pH <= 8.5) return 'alkaline';
  return 'very_alkaline';
}

function getpHRecommendation(pH) {
  if (pH < 6.0) return 'Apply lime to increase pH';
  if (pH > 8.0) return 'Apply sulfur to decrease pH';
  return 'pH is in optimal range';
}

function getNutrientStatus(nutrient, value) {
  const thresholds = {
    nitrogen: { low: 40, medium: 80, high: 120 },
    phosphorus: { low: 20, medium: 40, high: 60 },
    potassium: { low: 150, medium: 300, high: 450 }
  };

  const threshold = thresholds[nutrient];
  if (!threshold || !value) return 'unknown';

  if (value < threshold.low) return 'low';
  if (value < threshold.medium) return 'medium';
  if (value < threshold.high) return 'high';
  return 'very_high';
}

function getMostFrequent(arr) {
  return arr.sort((a, b) =>
    arr.filter(v => v === a).length - arr.filter(v => v === b).length
  ).pop();
}

function analyzeSeasonalPattern(cropHistory) {
  const seasons = {};
  cropHistory.forEach(crop => {
    const month = new Date(crop.plantingDate).getMonth();
    const season = getSeason(month);
    if (!seasons[season]) seasons[season] = [];
    seasons[season].push(crop.cropName);
  });
  return seasons;
}

function getSeason(month) {
  if (month >= 3 && month <= 5) return 'summer';
  if (month >= 6 && month <= 9) return 'monsoon';
  if (month >= 10 && month <= 2) return 'winter';
  return 'unknown';
}

function getPestPreventionTips(pestName) {
  const tips = {
    'Stem Borer': ['Use pheromone traps', 'Apply neem oil', 'Maintain field hygiene'],
    'Leaf Spot': ['Ensure proper spacing', 'Avoid overhead irrigation', 'Apply fungicide'],
    'Aphids': ['Use reflective mulch', 'Encourage beneficial insects', 'Spray insecticidal soap']
  };
  return tips[pestName] || ['Regular monitoring', 'Integrated pest management'];
}

export default router;
