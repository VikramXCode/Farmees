import express from 'express';
const router = express.Router();
import PestAlert from '../models/PestAlert.js';
import { DEMO_PEST_ALERTS } from '../middleware/demoMode.js';
import { fuzzCoordinates } from '../utils/geoUtils.js';

// GET /api/alerts/pests?district=&area=&limit=
router.get('/pests', async (req, res) => {
  try {
    console.log('GET /api/alerts/pests - isDemo:', req.isDemo, 'header:', req.headers['x-demo-mode']);

    // Demo mode - return mock pest alerts
    // Also check header directly as fallback
    if (req.isDemo || req.headers['x-demo-mode'] === 'true') {
      console.log('Returning demo pest alerts:', DEMO_PEST_ALERTS.length);
      return res.json(DEMO_PEST_ALERTS);
    }

    const { district, area, limit = 50 } = req.query;
    const query = {};
    if (district) query.district = district;
    if (area) query.area = area;

    const alerts = await PestAlert.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    // If no alerts in database, return demo alerts for better UX
    if (alerts.length === 0) {
      console.log('No alerts in DB, returning demo alerts as fallback');
      return res.json(DEMO_PEST_ALERTS);
    }



    res.json(alerts.map(a => {
      let lat = a.coordinates?.lat;
      let lon = a.coordinates?.lon;

      // If we have valid coordinates, fuzz them
      if (typeof lat === 'number' && typeof lon === 'number') {
        [lat, lon] = fuzzCoordinates([lat, lon], 2); // 2km radius fuzz
      }

      return {
        id: a._id.toString(),
        farmer: a.farmer,
        location: `${a.area}, ${a.district}`,
        pest: a.pest,
        severity: a.severity,
        description: a.description,
        distance: a.distance || null,
        timestamp: a.timestamp,
        affected_area: a.affected_area,
        latitude: lat,
        longitude: lon
      };
    }));
  } catch (err) {
    console.error('GET /api/alerts/pests error', err);
    res.status(500).json({ error: 'Failed to fetch pest alerts' });
  }
});

// POST /api/alerts/pests
router.post('/pests', async (req, res) => {
  try {
    const {
      userId,
      farmer,
      district,
      area,
      coordinates,
      pest,
      severity,
      description,
      affected_area
    } = req.body;

    if (!userId || !farmer || !district || !area || !pest || !severity || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const alert = await PestAlert.create({
      userId,
      farmer,
      district,
      area,
      coordinates: coordinates || {},
      pest,
      severity,
      description,
      affected_area
    });

    res.status(201).json({ success: true, id: alert._id.toString() });
  } catch (err) {
    console.error('POST /api/alerts/pests error', err);
    res.status(500).json({ error: 'Failed to create pest alert' });
  }
});

export default router;
