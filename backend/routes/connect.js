import express from 'express';
const router = express.Router();
import { DEMO_CONNECT_DATA } from '../middleware/demoMode.js';


// GET /api/connect/nearby-farmers?district=&area=&limit=
// Returns a lightweight list of nearby farmers. 
// Currently returns an empty list as real geospatial search is pending implementation.
router.get('/nearby-farmers', async (req, res) => {
  try {
    console.log('GET /api/connect/nearby-farmers - isDemo:', req.isDemo);
    console.log('Headers:', req.headers['x-demo-mode']);

    // Demo mode - return mock connect data with farmers
    // Also return demo data as fallback for better user experience
    if (req.isDemo || req.headers['x-demo-mode'] === 'true') {
      console.log('Returning demo farmers:', DEMO_CONNECT_DATA.farmers?.length || 0);
      console.log('Returning demo user lands:', DEMO_CONNECT_DATA.userLands?.length || 0);
      return res.json({
        officers: DEMO_CONNECT_DATA.officers,
        experts: DEMO_CONNECT_DATA.experts,
        farmers: DEMO_CONNECT_DATA.farmers || [],
        userLands: DEMO_CONNECT_DATA.userLands || []
      });
    }

    // For non-demo users, return demo data as sample (can be changed later for real data)
    // This ensures the map always has something to display
    res.json({
      officers: DEMO_CONNECT_DATA.officers,
      experts: DEMO_CONNECT_DATA.experts,
      farmers: DEMO_CONNECT_DATA.farmers || [],
      userLands: DEMO_CONNECT_DATA.userLands || []
    });
  } catch (err) {
    console.error('GET /api/connect/nearby-farmers error', err);
    res.status(500).json({ error: 'Failed to fetch nearby farmers' });
  }
});

export default router;

