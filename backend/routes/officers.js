import express from 'express';
import Officer from '../models/Officer.js';
const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const { district, state, active } = req.query;
    const q = {};
    if (district) q.$or = [
      { district: new RegExp('^' + district + '$', 'i') },
      { 'coverage.districts': new RegExp('^' + district + '$', 'i') },
    ];
    if (state) {
      q.$and = q.$and || [];
      q.$and.push({
        $or: [
          { state: new RegExp('^' + state + '$', 'i') },
          { 'coverage.states': new RegExp('^' + state + '$', 'i') },
        ]
      });
    }
    if (active !== undefined) q.isActive = active !== 'false';
    const officers = await Officer.find(q).lean();
    res.json({ success: true, count: officers.length, officers });
  } catch (err) {
    console.error('List officers error', err);
    res.status(500).json({ success: false, error: 'Failed to fetch officers' });
  }
});

export default router;

