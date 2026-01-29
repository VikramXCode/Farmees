/**
 * Soil Report Routes - DEMO-STABLE Implementation
 * 
 * Flow:
 * 1. POST /soil/upload - Upload and simulate OCR parsing
 * 2. GET /dummy - View raw OCR text (debug/display only)
 * 3. POST /land/attach-soil - Attach structured soil data to land
 * 4. Crop recommendation reads from land's soil data (NOT OCR text)
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import Land from '../models/Land.js';
import SoilReport from '../models/SoilReport.js';
import soilDataService from '../services/soilDataService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================================
// MULTER CONFIGURATION
// ====================================

// Use /tmp on Vercel (serverless), local uploads dir otherwise
const uploadDir = process.env.VERCEL 
  ? path.join(os.tmpdir(), 'uploads', 'soil_reports') 
  : path.join(__dirname, '..', 'uploads', 'soil_reports');

// Ensure upload directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create upload dir:', e.message);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Preserve original filename for demo matching
    const originalName = file.originalname;
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).slice(2, 8);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    // Format: originalname_timestamp_random.ext
    cb(null, `${baseName}_${timestamp}_${randomString}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// ====================================
// ROUTE 1: UPLOAD & PARSE SOIL REPORT
// ====================================

/**
 * POST /api/soil/upload
 * 
 * Accepts: multipart/form-data with field name 'file'
 * Simulates OCR parsing based on filename
 * Stores both OCR text (display) and structured data (for land)
 * 
 * Response:
 * {
 *   "parsed": true,
 *   "message": "Soil report parsed successfully",
 *   "filename": "soil_report1.pdf",
 *   "preview": {
 *     "soilType": "Loamy",
 *     "pH": 6.8,
 *     "soilHealth": "Good"
 *   }
 * }
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please provide a file with field name "file"'
      });
    }

    const { originalname, filename: savedFilename } = req.file;
    
    console.log('📄 Soil report upload:', {
      original: originalname,
      saved: savedFilename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Simulate OCR parsing based on filename
    const { ocrText, structuredData } = soilDataService.parsesoilReport(originalname);

    // Store in session for /dummy route and land attachment
    soilDataService.storeSoilSession(originalname, ocrText, structuredData);

    // Optional: Save to database for persistence
    try {
      const soilReport = new SoilReport({
        userId: req.body.userId || 'demo_user',
        filename: originalname,
        filePath: req.file.path,
        ocrText: ocrText,
        structuredData: structuredData,
        uploadDate: new Date()
      });
      await soilReport.save();
      console.log('✅ Soil report saved to database:', soilReport._id);
    } catch (dbError) {
      console.warn('⚠️ Could not save to database:', dbError.message);
      // Continue even if DB save fails (session storage is sufficient)
    }

    // Return success with preview
    return res.json({
      parsed: true,
      message: 'Soil report parsed successfully',
      filename: originalname,
      uploadDate: new Date().toISOString(),
      preview: {
        soilType: structuredData.soilType,
        pH: structuredData.pH,
        soilHealth: structuredData.soilHealth,
        state: structuredData.state,
        district: structuredData.district,
        village: structuredData.village
      }
    });

  } catch (error) {
    console.error('❌ Soil upload error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not delete file:', cleanupError.message);
      }
    }

    return res.status(500).json({
      error: 'Failed to process soil report',
      message: error.message
    });
  }
});

// ====================================
// ROUTE 2: VIEW OCR TEXT (DEBUG)
// ====================================

/**
 * GET /api/dummy
 * 
 * Returns raw OCR-parsed text for display/debugging
 * This is NOT used for crop recommendations
 * 
 * Response:
 * {
 *   "hasData": true,
 *   "filename": "soil_report1.pdf",
 *   "uploadDate": "2026-01-29T...",
 *   "ocrText": "═══ SOIL ANALYSIS REPORT ═══\n..."
 * }
 */
router.get('/dummy', (req, res) => {
  try {
    const session = soilDataService.getSoilSession();

    if (!session.ocrText) {
      return res.json({
        hasData: false,
        message: 'No soil report uploaded yet',
        instructions: 'Upload a soil report using POST /api/soil/upload'
      });
    }

    return res.json({
      hasData: true,
      filename: session.filename,
      uploadDate: session.timestamp,
      ocrText: session.ocrText
    });

  } catch (error) {
    console.error('❌ Dummy route error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve OCR data',
      message: error.message
    });
  }
});

// ====================================
// ROUTE 3: ATTACH SOIL DATA TO LAND
// ====================================

/**
 * POST /api/land/attach-soil
 * 
 * Attaches structured soil data to a specific land
 * This is what crop recommendation will use
 * 
 * Request body:
 * {
 *   "land_id": "507f1f77bcf86cd799439011"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Soil data attached to land successfully",
 *   "landId": "...",
 *   "soilData": { ... }
 * }
 */
router.post('/land/attach-soil', async (req, res) => {
  try {
    const { land_id } = req.body;

    if (!land_id) {
      return res.status(400).json({
        error: 'Missing land_id',
        message: 'Please provide a land_id in the request body'
      });
    }

    // Get current soil session
    const session = soilDataService.getSoilSession();

    if (!session.structuredData) {
      return res.status(400).json({
        error: 'No soil data available',
        message: 'Please upload a soil report first using POST /api/soil/upload'
      });
    }

    // Find the land by landId (custom string ID, not MongoDB _id)
    const land = await Land.findOne({ landId: land_id });

    if (!land) {
      return res.status(404).json({
        error: 'Land not found',
        message: `No land found with landId: ${land_id}`
      });
    }

    // Convert structured data to Land schema format
    const soilDataForLand = soilDataService.convertToLandSoilData(session.structuredData);

    // Update land with soil data
    // Store as a nested object for clean organization
    land.soilData = soilDataForLand;
    land.lastSoilUpdate = new Date();

    await land.save();

    console.log('✅ Soil data attached to land:', {
      landId: land._id,
      landName: land.name,
      soilType: soilDataForLand.soilType,
      soilHealth: soilDataForLand.soilHealth
    });

    return res.json({
      success: true,
      message: 'Soil data attached to land successfully',
      landId: land._id,
      landName: land.name,
      soilData: {
        soilType: soilDataForLand.soilType,
        pH: soilDataForLand.pH,
        soilHealth: soilDataForLand.soilHealth,
        analysisDate: soilDataForLand.analysisDate
      }
    });

  } catch (error) {
    console.error('❌ Attach soil error:', error);
    return res.status(500).json({
      error: 'Failed to attach soil data',
      message: error.message
    });
  }
});

// ====================================
// ROUTE 4: GET LAND SOIL DATA
// ====================================

/**
 * GET /api/land/:landId/soil
 * 
 * Retrieves soil data for a specific land
 * This is what crop recommendation service should call
 */
router.get('/land/:landId/soil', async (req, res) => {
  try {
    const { landId } = req.params;

    const land = await Land.findById(landId);

    if (!land) {
      return res.status(404).json({
        error: 'Land not found',
        message: `No land found with ID: ${landId}`
      });
    }

    if (!land.soilData) {
      return res.status(404).json({
        error: 'No soil data',
        message: 'This land does not have soil data attached. Please upload and attach a soil report first.'
      });
    }

    return res.json({
      success: true,
      landId: land._id,
      landName: land.name,
      soilData: land.soilData,
      lastUpdate: land.lastSoilUpdate
    });

  } catch (error) {
    console.error('❌ Get land soil error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve land soil data',
      message: error.message
    });
  }
});

// ====================================
// ROUTE 5: CLEAR SOIL SESSION
// ====================================

/**
 * POST /api/soil/clear
 * 
 * Clears the current soil session
 * Useful for testing or starting fresh
 */
router.post('/clear', (req, res) => {
  try {
    soilDataService.clearSoilSession();
    
    return res.json({
      success: true,
      message: 'Soil session cleared successfully'
    });
  } catch (error) {
    console.error('❌ Clear session error:', error);
    return res.status(500).json({
      error: 'Failed to clear session',
      message: error.message
    });
  }
});

// ====================================
// ROUTE 4: PARSE BY FILENAME (ALIAS)
// ====================================

/**
 * POST /api/soil-report/parse
 * 
 * Alternative parsing method - accepts filename directly
 * Used when file is already uploaded or for testing
 * 
 * Request body:
 * {
 *   "fileName": "soil_report1.png"
 * }
 * 
 * Response: Full parsed soil data matching the spec
 */
router.post('/parse', async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({
        error: 'Missing fileName',
        message: 'Please provide fileName in the request body'
      });
    }

    console.log('📄 Parsing soil report by filename:', fileName);

    // Simulate OCR parsing based on filename
    const { ocrText, structuredData } = soilDataService.parsesoilReport(fileName);

    // Store in session
    soilDataService.storeSoilSession(fileName, ocrText, structuredData);

    // Return complete parsed data in the exact format specified
    const response = {
      name: structuredData.farmerName || "Farmer",
      state: structuredData.state,
      district: structuredData.district,
      village: structuredData.village,
      soil_type: structuredData.soilType,
      ph: structuredData.pH,
      ec: structuredData.ec,
      organic_carbon: structuredData.organicCarbon,
      nutrients: {
        N: {
          value: structuredData.nutrients.nitrogen.value,
          status: structuredData.nutrients.nitrogen.status
        },
        P: {
          value: structuredData.nutrients.phosphorus.value,
          status: structuredData.nutrients.phosphorus.status
        },
        K: {
          value: structuredData.nutrients.potassium.value,
          status: structuredData.nutrients.potassium.status
        }
      },
      micronutrients: {
        Zn: structuredData.nutrients.zinc.status,
        Fe: structuredData.nutrients.iron.status,
        B: structuredData.nutrients.boron?.status || 'N/A'
      },
      overall_health: structuredData.soilHealth,
      recommendations: structuredData.recommendations,
      recommendations_tamil: structuredData.recommendations_tamil || []
    };

    return res.json(response);

  } catch (error) {
    console.error('❌ Parse error:', error);
    return res.status(500).json({
      error: 'Failed to parse soil report',
      message: error.message
    });
  }
});

// ====================================
// HEALTH CHECK
// ====================================

router.get('/health', (req, res) => {
  const session = soilDataService.getSoilSession();
  
  res.json({
    status: 'ok',
    service: 'soil-report-service',
    features: {
      upload: 'enabled',
      ocrSimulation: 'enabled',
      landAttachment: 'enabled'
    },
    currentSession: {
      hasData: !!session.structuredData,
      filename: session.filename || null,
      timestamp: session.timestamp || null
    }
  });
});

export default router;
