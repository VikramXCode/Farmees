import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Land from '../models/Land.js';
import soilDataService from '../services/soilDataService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for soil report uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/soil_reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'), false);
    }
  }
});

/**
 * POST /api/soil-analyzer/analyze
 * 
 * Step 1: Upload and analyze soil report
 * Returns parsed soil data for farmer review
 * Does NOT save to database yet
 */
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a soil report image or PDF to analyze'
      });
    }

    const { originalname, filename: savedFilename } = req.file;
    
    console.log('📊 Analyzing soil report:', {
      original: originalname,
      saved: savedFilename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Simulate OCR parsing based on filename
    const { ocrText, structuredData } = soilDataService.parsesoilReport(originalname);

    // Store in session for later confirmation
    soilDataService.storeSoilSession(originalname, ocrText, structuredData);

    // Return parsed data for review
    res.json({
      success: true,
      message: 'Soil report analyzed successfully',
      filename: originalname,
      uploadDate: new Date().toISOString(),
      confidence: 'High', // Demo: always high confidence
      parsedData: {
        location: {
          state: structuredData.state,
          district: structuredData.district,
          village: structuredData.village
        },
        soilProperties: {
          type: structuredData.soilType,
          pH: structuredData.pH,
          ec: structuredData.ec,
          organicCarbon: structuredData.organicCarbon
        },
        nutrients: {
          nitrogen: {
            value: structuredData.nutrients.nitrogen.value,
            unit: structuredData.nutrients.nitrogen.unit,
            status: structuredData.nutrients.nitrogen.status
          },
          phosphorus: {
            value: structuredData.nutrients.phosphorus.value,
            unit: structuredData.nutrients.phosphorus.unit,
            status: structuredData.nutrients.phosphorus.status
          },
          potassium: {
            value: structuredData.nutrients.potassium.value,
            unit: structuredData.nutrients.potassium.unit,
            status: structuredData.nutrients.potassium.status
          },
          zinc: {
            value: structuredData.nutrients.zinc.value,
            unit: structuredData.nutrients.zinc.unit,
            status: structuredData.nutrients.zinc.status
          },
          iron: {
            value: structuredData.nutrients.iron.value,
            unit: structuredData.nutrients.iron.unit,
            status: structuredData.nutrients.iron.status
          },
          boron: structuredData.nutrients.boron ? {
            value: structuredData.nutrients.boron.value,
            unit: structuredData.nutrients.boron.unit,
            status: structuredData.nutrients.boron.status
          } : null
        },
        healthStatus: structuredData.soilHealth,
        recommendations: structuredData.recommendations,
        recommendations_tamil: structuredData.recommendations_tamil || [],
        validityInfo: {
          message: 'Soil reports are typically valid for 1-2 years',
          recommendedRetestDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Soil analysis error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not delete file:', cleanupError.message);
      }
    }

    return res.status(500).json({
      error: 'Failed to analyze soil report',
      message: error.message
    });
  }
});

/**
 * POST /api/soil-analyzer/confirm
 * 
 * Step 2: Confirm and save soil data to selected land
 * Uses session data from analyze step
 */
router.post('/confirm', async (req, res) => {
  try {
    const { landId, userId } = req.body;

    if (!landId) {
      return res.status(400).json({
        error: 'Missing landId',
        message: 'Please select a land to save the soil data'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId',
        message: 'User identification is required'
      });
    }

    // Get soil data from session
    const session = soilDataService.getSoilSession();

    if (!session.structuredData) {
      return res.status(400).json({
        error: 'No soil data in session',
        message: 'Please analyze a soil report first before confirming'
      });
    }

    // Find the land
    const land = await Land.findOne({ landId: landId, userId: userId });

    if (!land) {
      return res.status(404).json({
        error: 'Land not found',
        message: `No land found with ID: ${landId} for this user`
      });
    }

    // Convert to land schema format
    const soilDataForLand = soilDataService.convertToLandSoilData(session.structuredData);

    // Save soil data to land
    land.soilData = soilDataForLand;
    land.lastSoilUpdate = new Date();
    
    // Also update basic soilType field for backwards compatibility
    if (soilDataForLand.soilType) {
      land.soilType = soilDataForLand.soilType;
    }

    await land.save();

    console.log('✅ Soil data confirmed and saved to land:', {
      landId: land.landId,
      landName: land.name,
      soilType: soilDataForLand.soilType,
      soilHealth: soilDataForLand.healthStatus
    });

    // Clear session after successful save
    soilDataService.clearSoilSession();

    res.json({
      success: true,
      message: 'Soil data saved to land successfully',
      land: {
        landId: land.landId,
        name: land.name,
        location: land.location,
        soilType: land.soilData.soilType,
        soilHealth: land.soilData.healthStatus,
        lastUpdated: land.lastSoilUpdate
      }
    });

  } catch (error) {
    console.error('❌ Soil confirmation error:', error);
    return res.status(500).json({
      error: 'Failed to save soil data',
      message: error.message
    });
  }
});

/**
 * GET /api/soil-analyzer/session
 * 
 * Get current session data (for review before confirmation)
 */
router.get('/session', async (req, res) => {
  try {
    const session = soilDataService.getSoilSession();

    if (!session.structuredData) {
      return res.status(404).json({
        hasSession: false,
        message: 'No active soil analysis session'
      });
    }

    res.json({
      hasSession: true,
      filename: session.filename,
      uploadDate: session.uploadDate,
      data: session.structuredData
    });

  } catch (error) {
    console.error('❌ Session retrieval error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve session data',
      message: error.message
    });
  }
});

/**
 * POST /api/soil-analyzer/cancel
 * 
 * Cancel current analysis session
 */
router.post('/cancel', async (req, res) => {
  try {
    soilDataService.clearSoilSession();
    
    res.json({
      success: true,
      message: 'Analysis session cancelled'
    });

  } catch (error) {
    console.error('❌ Session cancellation error:', error);
    return res.status(500).json({
      error: 'Failed to cancel session',
      message: error.message
    });
  }
});

/**
 * GET /api/soil-analyzer/health
 * 
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'soil-analyzer',
    timestamp: new Date().toISOString()
  });
});

export default router;
