import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import { getEnvKeys, shouldRotate } from '../utils/apiKeys.js';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use /tmp on Vercel (serverless), local uploads dir otherwise
const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '..', 'uploads');
try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { console.warn('Could not create upload dir:', e.message); }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

const upload = multer({ storage });

// POST /api/pests/identify - accepts single image file under field `image`
// Calls Kindwise insect identification API. Set KINDWISE_API_KEY in backend/.env
router.post('/identify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const keys = getEnvKeys('KINDWISE');
    if (!keys.length) return res.status(400).json({ error: 'No Kindwise keys configured. Use KINDWISE_API_KEYS (csv), KINDWISE_API_KEY_1..N, or KINDWISE_API_KEY in backend/.env' });

    // Read uploaded file and convert to base64
    const imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });

    // Kindwise insect identification endpoint
    const url = 'https://insect.kindwise.com/api/v1/identification';

    let data = null;
    let lastResp = null;
    let lastText = '';
    let lastErr = null;

    for (let kIndex = 0; kIndex < keys.length; kIndex++) {
      const apiKey = keys[kIndex];
      // Prepare payload for JSON/base64 attempts per key
      const payload = { api_key: apiKey, images: [imageBase64] };

      // Try several JSON header variants sequentially
      const jsonAttempts = [
        { name: 'json:Authorization-Bearer', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` } },
        { name: 'json:x-api-key', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey } },
        { name: 'json:Authorization-Api-Key', headers: { 'Content-Type': 'application/json', 'Authorization': `Api-Key ${apiKey}` } },
        { name: 'json:Authorization-Token', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${apiKey}` } },
        { name: 'json:no-header', headers: { 'Content-Type': 'application/json' } }
      ];

      let resp = null;
      for (const attempt of jsonAttempts) {
        try {
          try { console.log('Kindwise: attempting', attempt.name, 'with key', kIndex); } catch (e) { }
          resp = await fetch(url, { method: 'POST', headers: attempt.headers, body: JSON.stringify(payload) });
        } catch (e) {
          console.warn('Kindwise network error on', attempt.name, e.message || e);
          lastErr = e;
          resp = null;
        }
        if (resp && resp.ok) {
          try {
            const text = await resp.clone().text();
            console.log('Kindwise response (truncated):', text.slice(0, 8192));
          } catch (e) { }
          data = await resp.json();
          try { console.log('Kindwise: succeeded with', attempt.name); } catch (e) { }
          break;
        }
        if (resp && !resp.ok) {
          try {
            lastText = await resp.clone().text();
            console.warn('Kindwise', attempt.name, 'status', resp.status, 'body(truncated):', lastText.slice(0, 8192));
          } catch (e) { lastText = ''; }
          lastResp = resp;
        }
      }
      if (data) break;

      // If JSON attempts failed, try multipart variations for this key
      if (!data) {
        const multipartFieldNames = ['image', 'images[]'];
        const multipartHeaderVariants = [
          { name: 'multipart:x-api-key', extraHeaders: { 'x-api-key': apiKey } },
          { name: 'multipart:Authorization-Api-Key', extraHeaders: { 'Authorization': `Api-Key ${apiKey}` } },
          { name: 'multipart:Authorization-Token', extraHeaders: { 'Authorization': `Token ${apiKey}` } },
          { name: 'multipart:no-header', extraHeaders: {} }
        ];

        for (const fieldName of multipartFieldNames) {
          for (const hv of multipartHeaderVariants) {
            try {
              try { console.log('Kindwise: multipart attempt', fieldName, hv.name, 'with key', kIndex); } catch (e) { }
              let form;
              let headers = {};

              form = new FormData();
              form.append(fieldName, fs.createReadStream(req.file.path));
              form.append('api_key', apiKey);

              if (typeof form.getHeaders === 'function') {
                headers = Object.assign({}, form.getHeaders(), hv.extraHeaders);
              } else {
                headers = Object.assign({}, hv.extraHeaders);
              }

              resp = await fetch(url, { method: 'POST', headers, body: form });
            } catch (e) {
              console.warn('Kindwise multipart network error', fieldName, hv.name, e.message || e);
              lastErr = e;
              resp = null;
            }
            if (resp && resp.ok) {
              try {
                const text = await resp.clone().text();
                console.log('Kindwise multipart response (truncated):', text.slice(0, 8192));
              } catch (e) { }
              data = await resp.json();
              try { console.log('Kindwise: multipart succeeded', fieldName, hv.name); } catch (e) { }
              break;
            }
            if (resp && !resp.ok) {
              try {
                lastText = await resp.clone().text();
                console.warn('Kindwise multipart', fieldName, hv.name, 'status', resp.status, 'body(truncated):', lastText.slice(0, 8192));
              } catch (e) { lastText = ''; }
              lastResp = resp;
            }
          }
          if (data) break;
        }
      }

      if (data) break;

      // decide whether to rotate to next key
      const status = lastResp && lastResp.status;
      if (shouldRotate(status, lastText) && kIndex < keys.length - 1) {
        console.warn('Rotating Kindwise API key due to status', status);
        continue; // use next key
      } else {
        break; // don't rotate further if non-rotatable or last key
      }
    }

    // If still no data, return an error with safe diagnostics
    if (!data) {
      try { fs.unlinkSync(req.file.path); } catch (e) { }
      const status = (lastResp && lastResp.status) || 502;
      return res.status(status).json({ error: 'Kindwise insect API did not return a successful response', status, details: lastText || (lastErr && lastErr.message) });
    }

    // Normalize Kindwise responses into a consistent pestSuggestions array
    const pestSuggestions = [];
    // Prefer the path data.result.classification.suggestions
    if (data && data.result && data.result.classification && Array.isArray(data.result.classification.suggestions)) {
      for (const s of data.result.classification.suggestions) {
        const name = s.name || s.label || 'Unknown';
        const probability = (typeof s.probability === 'number') ? s.probability : (s.confidence || null);
        pestSuggestions.push({ name, probability, raw: s });
      }
    }

    // fallback shapes
    if (pestSuggestions.length === 0 && data.results && Array.isArray(data.results)) {
      for (const r of data.results) {
        const name = r.name || r.common_name || r.label || 'Unknown';
        const probability = (typeof r.probability === 'number') ? r.probability : (typeof r.score === 'number' ? r.score : null);
        pestSuggestions.push({ name, probability, raw: r });
      }
    }

    if (pestSuggestions.length === 0 && Array.isArray(data.suggestions)) {
      for (const s of data.suggestions) {
        const name = s.name || s.label || 'Unknown';
        const probability = s.probability || s.confidence || null;
        pestSuggestions.push({ name, probability, raw: s });
      }
    }

    if (pestSuggestions.length === 0 && data.prediction) {
      const p = data.prediction;
      const name = p.name || p.label || 'Unknown';
      const probability = p.probability || p.confidence || null;
      pestSuggestions.push({ name, probability, raw: p });
    }

    // Sort by probability if present
    pestSuggestions.sort((a, b) => {
      const pa = (a.probability == null) ? -1 : a.probability;
      const pb = (b.probability == null) ? -1 : b.probability;
      return pb - pa;
    });

    const topResult = pestSuggestions.length ? pestSuggestions[0] : null;

    // Cleanup uploaded file
    try { fs.unlinkSync(req.file.path); } catch (e) { }

    // Attach helpful extras for the frontend
    const raw = Object.assign({}, data);
    raw.model_version = data.model_version || data.model || null;
    // ensure raw.input.images[0] is accessible when present
    if (!raw.input && data.input) raw.input = data.input;

    return res.json({ pestSuggestions, topResult, raw });
  } catch (err) {
    console.error('Error in /api/pests/identify:', err);
    try { if (req.file) fs.unlinkSync(req.file.path); } catch (e) { }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

