import express from 'express';
const router = express.Router();


// GET /api/connect/nearby-farmers?district=&area=&limit=
// Returns a lightweight list of nearby farmers. 
// Currently returns an empty list as real geospatial search is pending implementation.
router.get('/nearby-farmers', async (req, res) => {
  try {
    // Real geospatial search would go here
    // For now, return empty arrays as no demo data
    res.json({
      officers: [],
      experts: [],
      farmers: [],
      userLands: []
    });
  } catch (err) {
    console.error('GET /api/connect/nearby-farmers error', err);
    res.status(500).json({ error: 'Failed to fetch nearby farmers' });
  }
});

export default router;

