const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Groq = require('groq-sdk');
const { getEnvKeys, shouldRotate } = require('../utils/apiKeys');

const router = express.Router();

let groqKeys = getEnvKeys('GROQ');
if (!groqKeys.length && process.env.GROQ_API_KEY) {
  groqKeys = [process.env.GROQ_API_KEY];
}

router.post('/generate', async (req, res) => {
  try {
    const { input, systemPrompt, context, model } = req.body || {};
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ success: false, error: 'input is required' });
    }
    if (!groqKeys.length) {
      return res.status(500).json({ success: false, error: 'GROQ_API_KEY(S) not configured' });
    }

    const sys = systemPrompt || 'You are a helpful farming assistant. Keep answers concise and practical.';
    const chosenModel = model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    const messages = [
      { role: 'system', content: sys },
      ...(context ? [{ role: 'system', content: `Context:\n${typeof context === 'string' ? context : JSON.stringify(context).slice(0, 4000)}` }] : []),
      { role: 'user', content: input }
    ];

    let text = '';
    let lastErr = null;
    for (let i = 0; i < groqKeys.length; i++) {
      try {
        const client = new Groq({ apiKey: groqKeys[i] });
        const completion = await client.chat.completions.create({
          model: chosenModel,
          messages,
          temperature: 0.4,
          max_tokens: 512,
        });
        text = (completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content || '').trim();
        if (text) break;
      } catch (e) {
        lastErr = e;
        const status = (e && (e.status || (e.response && e.response.status))) || 0;
        const body = (e && (e.response && e.response.data)) || (e && e.message) || '';
        if (shouldRotate(status, body) && i < groqKeys.length - 1) continue;
        break;
      }
    }

    if (!text) {
      throw lastErr || new Error('No text from Groq');
    }

    return res.json({ success: true, text, model: chosenModel });
  } catch (err) {
    console.error('Groq generate error', (err && (err.response && err.response.data)) || err && err.message || err);
    return res.status(500).json({ success: false, error: 'Groq generation failed' });
  }
});

module.exports = router;
