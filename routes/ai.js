import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { Groq } from 'groq-sdk';
import { getEnvKeys, shouldRotate } from '../utils/apiKeys.js';
import { DEMO_AI_CHAT_RESPONSES } from '../middleware/demoMode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const router = express.Router();

let groqKeys = getEnvKeys('GROQ');
if (!groqKeys.length && process.env.GROQ_API_KEY) {
  groqKeys = [process.env.GROQ_API_KEY];
}

router.post('/generate', async (req, res) => {
  try {
    // Demo mode - return mock AI responses
    if (req.isDemo) {
      const { input } = req.body || {};
      const inputLower = (input || '').toLowerCase();

      // Find matching demo response
      const match = DEMO_AI_CHAT_RESPONSES.find(r => inputLower.includes(r.question));
      if (match) {
        return res.json({ success: true, text: match.response });
      }

      // Default demo response
      return res.json({
        success: true,
        text: 'I can help you with irrigation, pest control, and fertilizer recommendations for your rice field. What specific information do you need?'
      });
    }

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

export default router;
