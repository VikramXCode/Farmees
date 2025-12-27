'use strict';

const express = require('express');
const router = express.Router();
const { DEMO_CONNECT_DATA } = require('../middleware/demoMode');

// GET /api/connect/nearby-farmers?district=&area=&limit=
// Returns a lightweight list of nearby farmers. 
// Currently returns an empty list as real geospatial search is pending implementation.
router.get('/nearby-farmers', async (req, res) => {
  try {
    // Demo mode - return mock connect data with farmers
    if (req.isDemo) {
      return res.json({ 
        officers: DEMO_CONNECT_DATA.officers, 
        experts: DEMO_CONNECT_DATA.experts,
        farmers: DEMO_CONNECT_DATA.farmers || []
      });
    }

    // Return empty array until real farmer geospatial search is implemented
    // This removes the fake mock data which was causing privacy confusion
    res.json([]);
  } catch (err) {
    console.error('GET /api/connect/nearby-farmers error', err);
    res.status(500).json({ error: 'Failed to fetch nearby farmers' });
  }
});

module.exports = router;
