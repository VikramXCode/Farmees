const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { isDemoUser, DEMO_DISEASE_ANALYSIS } = require('../middleware/demoMode');

// Use /tmp on Vercel (serverless), local uploads dir otherwise
const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '..', 'uploads');
try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { console.warn('Could not create upload dir:', e.message); }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});

const upload = multer({ storage });

// POST /api/diseases/identify - accepts single image file under field `image`
// This route calls Plant.id API for plant disease identification. Supports key rotation via env vars.
router.post('/identify', upload.single('image'), async (req, res) => {
  try {
    // Check if demo mode
    if (req.isDemo) {
      return res.json(DEMO_DISEASE_ANALYSIS);
    }

    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const { getEnvKeys, shouldRotate } = require('../utils/apiKeys');
    const keys = getEnvKeys('PLANT_ID');
    if (!keys.length) {
      return res.status(400).json({
        error: 'No Plant.id API keys configured. Use PLANT_ID_API_KEYS (comma-separated), PLANT_ID_API_KEY_1..N, or PLANT_ID_API_KEY in backend/.env'
      });
    }

    // Read uploaded file and convert to base64
    const imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });

    // Prepare request to Plant.id v3 health_assessment endpoint
    const url = 'https://plant.id/api/v3/health_assessment?details=local_name,description,url,treatment,classification,common_names,cause';

    let data = null;
    let lastError = null;
    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      const payload = { api_key: apiKey, images: [imageBase64] };
      let resp;
      try {
        resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (e) {
        lastError = e;
        continue;
      }
      if (resp.ok) {
        data = await resp.json();
        break;
      } else {
        const text = await resp.text();
        console.warn('Plant.id error with key index', i, 'status', resp.status);
        if (shouldRotate(resp.status, text) && i < keys.length - 1) {
          continue; // try next key
        }
        // non-rotatable or last key
        return res.status(502).json({ error: `External API error: ${resp.status}`, details: text });
      }
    }
    if (!data) {
      console.error('Plant.id request failed for all keys', lastError);
      return res.status(502).json({ error: 'Failed to reach Plant.id with available API keys' });
    }

    // Normalize disease and plant suggestions from multiple possible v3 shapes.
    let diseaseSuggestions = [];
    let plantSuggestions = [];

    const formatTreatment = (t) => {
      if (!t) return '';
      if (typeof t === 'string') return t;
      if (typeof t === 'object') {
        const parts = [];
        for (const key of Object.keys(t)) {
          const val = t[key];
          if (Array.isArray(val)) parts.push(`${key}: ${val.join(' ')}`);
          else parts.push(`${key}: ${String(val)}`);
        }
        return parts.join('\n');
      }
      return String(t);
    };

    // 1) Newer response shape: data.result.disease.suggestions
    if (data && data.result && data.result.disease && Array.isArray(data.result.disease.suggestions)) {
      diseaseSuggestions = data.result.disease.suggestions.map((sugg) => ({
        diseaseName: sugg.name || (sugg.details && sugg.details.local_name) || 'Unknown disease',
        probability: Math.round((sugg.probability || 0) * 100),
        description: (sugg.details && sugg.details.description) || '',
        treatment: formatTreatment(sugg.details && sugg.details.treatment),
        cause: (sugg.details && sugg.details.cause) || '',
        localNames: (sugg.details && sugg.details.local_name) || (sugg.details && sugg.details.common_names) || [],
        details: sugg
      }));
    }

    // 2) Alternate v3 shape: data.health_assessment.diseases
    else if (data && data.health_assessment && Array.isArray(data.health_assessment.diseases)) {
      diseaseSuggestions = data.health_assessment.diseases.map((d) => ({
        diseaseName: d.name || (d.classification && d.classification.scientific_name) || 'Unknown disease',
        probability: Math.round((d.probability || 0) * 100),
        description: d.description || d.details || '',
        treatment: formatTreatment(d.treatment || d.details && d.details.treatment),
        cause: d.cause || '',
        localNames: d.local_name || d.common_names || [],
        details: d
      }));
    }

    // Fallback plant/species suggestions in `suggestions` (older shapes)
    if (data && Array.isArray(data.suggestions)) {
      plantSuggestions = data.suggestions.map((s) => ({
        name: s.name || s.plant_name || 'Unknown',
        probability: Math.round((s.probability || 0) * 100),
        details: s
      }));
    }

    const result = {
      imagePath: `/api/diseases/uploads/${req.file.filename}`,
      diseaseSuggestions,
      plantSuggestions,
      raw: data
    };

    // Print the full Plant.id response to server logs for debugging
    try {
      console.log('Plant.id v3 response:');
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Could not stringify Plant.id response', e);
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Serve uploaded files (only in dev)
router.get('/uploads/:file', (req, res) => {
  const file = path.join(uploadDir, req.params.file);
  res.sendFile(file);
});

module.exports = router;
