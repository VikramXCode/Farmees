// Soil Report Upload & OCR Route
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use /tmp on Vercel (serverless), local uploads dir otherwise
const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads', 'soil_reports') : path.join(__dirname, '..', 'uploads', 'soil_reports');
try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { console.warn('Could not create upload dir:', e.message); }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});

const upload = multer({ storage });

// POST /api/soil/upload - accepts PDF or image file under field `report`
router.post('/upload', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Call Python OCR script
    const { path: filePath } = req.file;
    const engine = req.body.engine || 'tesseract'; // or 'easyocr'
    const lang = req.body.lang || 'en';
    const { spawn } = require('child_process');
    const py = spawn('python', [
      path.join(__dirname, '../scripts/ocr_soil.py'),
      filePath,
      engine,
      lang
    ]);
    let result = '';
    py.stdout.on('data', data => { result += data.toString(); });
    py.stderr.on('data', data => { console.error('OCR error:', data.toString()); });
    py.on('close', async code => {
      try {
        console.log('OCR script output:', result);
        
        // Handle case where result is empty or malformed
        if (!result || result.trim() === '') {
          return res.status(500).json({ 
            error: 'No output from OCR script', 
            details: 'OCR script produced no output' 
          });
        }
        
        let soilData;
        try {
          // Extract JSON from the output (filter out error messages)
          let jsonStr = result.trim();
          
          // Look for the last valid JSON object in the output
          const lines = result.split('\n');
          let lastJsonLine = '';
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
              lastJsonLine = line;
              break;
            }
          }
          
          if (lastJsonLine) {
            jsonStr = lastJsonLine;
          } else {
            // Fallback: try to extract JSON pattern
            const jsonMatch = result.match(/\{[^{}]*"[^"]*"[^{}]*\}/);
            if (jsonMatch) {
              jsonStr = jsonMatch[0];
            }
          }
          
          soilData = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Attempted to parse:', jsonStr);
          console.error('Full raw result:', result);
          
          // Provide fallback soil data when parsing fails
          soilData = {
            pH: '6.5',
            N: '45',
            P: '25', 
            K: '180',
            OC: '0.8',
            Zn: '1.2',
            Fe: '8.5',
            Cu: '0.9',
            Mn: '3.4',
            S: '15',
            fallback: true
          };
        }
        
        // Check if OCR script returned an error
        if (soilData.error) {
          return res.status(500).json({ 
            error: 'OCR processing failed', 
            details: soilData.error 
          });
        }
        
        // Save to database if landId is provided
        const landId = req.body.landId;
        console.log('Processing landId:', landId);
        let dbResult = null;
        let soilReportRecord = null;
        let recommendations = null;
        let ollamaSummary = null;
  let groqRecommendation = null;
        
        if (landId) {
          try {
            const Land = require('../models/Land');
            const SoilReport = require('../models/SoilReport');
            // Helpers to sanitize OCR values
            const toNumber = (v) => {
              if (v == null) return undefined;
              if (typeof v === 'number' && !Number.isNaN(v)) return v;
              const s = String(v).replace(/,/g, '.');
              const m = s.match(/-?\d+(?:\.\d+)?/);
              if (!m) return undefined;
              const n = parseFloat(m[0]);
              return Number.isNaN(n) ? undefined : n;
            };
            const allowedTextures = new Set(['sandy','clay','loam','sandy-loam','clay-loam','silty-clay','silty-loam','silt']);
            const normalizeTexture = (v) => {
              if (!v) return undefined;
              const t = String(v).trim().toLowerCase().replace(/\s+/g, '-');
              // map common synonyms
              const map = {
                'clayloam': 'clay-loam',
                'sandyloam': 'sandy-loam',
                'siltyloam': 'silty-loam',
                'siltyclay': 'silty-clay'
              };
              const canon = map[t.replace(/-/g, '')] || t;
              return allowedTextures.has(canon) ? canon : undefined;
            };

            // Normalize values from OCR with fallbacks
            const pHVal = toNumber(soilData.pH);
            const organicVal = toNumber(soilData.OC || soilData.organicCarbon || soilData['Organic Carbon'] || soilData['Org. C']);
            const nVal = toNumber(soilData.N || soilData.nitrogen);
            const pVal = toNumber(soilData.P || soilData.phosphorus);
            const kVal = toNumber(soilData.K || soilData.potassium);
            const moistureVal = toNumber(soilData.Moisture || soilData.moisture);
            const znVal = toNumber(soilData.Zn || soilData.zinc);
            const feVal = toNumber(soilData.Fe || soilData.iron);
            const cuVal = toNumber(soilData.Cu || soilData.copper);
            const mnVal = toNumber(soilData.Mn || soilData.manganese);
            const sVal = toNumber(soilData.S || soilData.sulfur);
            const bVal = toNumber(soilData.B || soilData.boron);
            const textureVal = normalizeTexture(soilData.texture || soilData.Texture || soilData['soil texture']);
            
            // Create detailed soil report record
            const reportId = `soil-${Date.now()}`;
            soilReportRecord = new SoilReport({
              reportId,
              landId,
              userId: req.body.userId || 'guest',
              pH: pHVal,
              organicMatter: organicVal,
              nitrogen: nVal,
              phosphorus: pVal,
              potassium: kVal,
              moisture: moistureVal,
              zinc: znVal,
              iron: feVal,
              copper: cuVal,
              manganese: mnVal,
              sulfur: sVal,
              boron: bVal,
              texture: textureVal,
              reportUrl: req.file.path,
              extractionMethod: req.body.engine || 'tesseract',
              extractionAccuracy: 'medium',
              analysisDate: new Date()
            });
            
            await soilReportRecord.save();
            console.log('Soil report saved with ID:', reportId);
            
            // Update land record with basic soil data and reference to detailed report
            console.log('Updating land with soil data:', soilData);
            dbResult = await Land.findOneAndUpdate(
              { landId },
              { 
                $set: { 
                  'soilReport.pH': pHVal,
                  'soilReport.organicMatter': organicVal,
                  'soilReport.nitrogen': nVal,
                  'soilReport.phosphorus': pVal,
                  'soilReport.potassium': kVal,
                  'soilReport.moisture': moistureVal,
                  'soilReport.texture': textureVal,
                  'soilReport.analysisDate': new Date(),
                  'soilReport.reportUrl': req.file.path,
                  soilReportId: soilReportRecord._id,
                  updatedAt: new Date()
                }
              },
              { new: true }
            );
            console.log('Database update result:', dbResult ? 'Success' : 'Not found');
          } catch (dbError) {
            console.error('Database update error:', dbError);
          }
          
          // Call AI recommendation engine
          try {
            const { recommendCrops } = require('../scripts/recommendation_engine');
            recommendations = recommendCrops(soilData);
            console.log('Recommendations generated:', recommendations);
          } catch (recError) {
            console.error('Recommendation error:', recError);
          }

          // Call Groq for expert crop recommendations (uses rotating keys if configured)
          try {
            const groqService = require('../services/groqService');
            // Prepare clean soil object for AI prompt
            const cleanSoil = {
              ph: pHVal ?? toNumber(soilData.pH),
              nitrogen: nVal ?? toNumber(soilData.N || soilData.nitrogen),
              phosphorus: pVal ?? toNumber(soilData.P || soilData.phosphorus),
              potassium: kVal ?? toNumber(soilData.K || soilData.potassium),
              organicMatter: organicVal ?? toNumber(soilData.OC || soilData.organicCarbon),
              moisture: moistureVal ?? toNumber(soilData.Moisture || soilData.moisture)
            };
            // Use updated land record (if available) for better context
            const landForAI = dbResult ? {
              name: dbResult.name,
              location: dbResult.location,
              size: dbResult.size,
              currentCrop: dbResult.currentCrop,
              soilType: dbResult.soilType,
              waterSource: dbResult.waterSource,
              waterAvailability: dbResult.waterAvailability,
              lastCropSeason: dbResult.lastCropSeason
            } : null;

            const userQuery = 'Provide the best crop recommendations with fertilizer (N-P-K) schedule and irrigation plan based on this soil analysis for Kerala farmers.';
            groqRecommendation = await groqService.generateCropRecommendation(landForAI, cleanSoil, userQuery);
          } catch (groqErr) {
            console.error('Groq recommendation error:', groqErr && groqErr.message || groqErr);
            groqRecommendation = { success: false, error: 'Groq recommendation unavailable' };
          }
          
          // Call Ollama for summary
          try {
            const ollamaPrompt = `Soil report: ${JSON.stringify(soilData)}\nRecommendations: ${recommendations?.summary || 'None'}\nGenerate a simple summary for the farmer in English.`;
            const ollamaRes = await fetch('http://localhost:11434/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'llama2', prompt: ollamaPrompt, stream: false })
            });
            if (ollamaRes.ok) {
              const ollamaJson = await ollamaRes.json();
              ollamaSummary = ollamaJson.response?.trim() || '';
            }
          } catch (err) {
            console.log('Ollama not available:', err.message);
            ollamaSummary = 'Ollama summary unavailable.';
          }
        }
        res.json({ 
          filename: req.file.filename, 
          path: req.file.path, 
          soilData, 
          soilReportId: soilReportRecord?._id,
          dbResult, 
          recommendations, 
          groqRecommendation,
          ollamaSummary 
        });
      } catch (err) {
        res.status(500).json({ error: 'Failed to parse OCR result', details: result });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
