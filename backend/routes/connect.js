'use strict';

const express = require('express');
const router = express.Router();

// GET /api/connect/nearby-farmers?district=&area=&limit=
// Returns a lightweight list of nearby farmers. Since we don't
// yet have geo/user profiles, return a deterministic mocked list
// keyed by district+area so UI can render the map.
router.get('/nearby-farmers', async (req, res) => {
  try {
    const { district = '', area = '', limit = 10 } = req.query;
    const baseName = `${decodeURIComponent(area || '')}-${decodeURIComponent(district || '')}`.trim() || 'Local';
    const seed = `${district}|${area}`;
    const items = [];
    // simple deterministic pseudo-random from seed
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
    const cropsList = [
      ['Rice', 'Banana'],
      ['Pepper', 'Coconut'],
      ['Tea', 'Coffee'],
      ['Cocoa', 'Arecanut'],
      ['Rubber', 'Veggies'],
      ['Paddy', 'Spices'],
    ];
    const names = ['Anil', 'Binu', 'Chitra', 'Deepa', 'Ebin', 'Fathima', 'Girish', 'Hari'];
    const count = Math.max(0, Math.min(12, Number(limit)));
    for (let i = 0; i < count; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      const name = names[(h >> 3) % names.length] + ' ' + String.fromCharCode(65 + ((h >> 5) % 26)) + '.';
      const crops = cropsList[(h >> 7) % cropsList.length];
      const rating = 3 + ((h >> 9) % 30) / 10; // 3.0 - 5.9
      items.push({
        id: `${h.toString(16)}-${i}`,
        name,
        district: district || 'Unknown',
        area: area || 'Nearby',
        crops,
        rating: Math.min(5, Math.round(rating * 10) / 10),
        isOnline: ((h >> 11) % 2) === 0,
      });
    }
    res.json(items);
  } catch (err) {
    console.error('GET /api/connect/nearby-farmers error', err);
    res.status(500).json({ error: 'Failed to fetch nearby farmers' });
  }
});

module.exports = router;
