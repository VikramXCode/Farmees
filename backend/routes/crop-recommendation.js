/**
 * Proxy route for crop recommendation service
 */
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Python service URL - configure based on environment
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/crop-recommendation
 * Proxies crop recommendation requests to Python FastAPI microservice
 */
router.post('/', async (req, res) => {
  try {
    const {
      state,
      district,
      land_area_hectare,
      budget_inr,
      planning_months,
      date,
      soil_type,
      ph,
      temperature,
      soil_report_uploaded
    } = req.body;

    // Validate required fields
    if (!state || !district || !land_area_hectare || !budget_inr || !planning_months || !date) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['state', 'district', 'land_area_hectare', 'budget_inr', 'planning_months', 'date']
      });
    }

    // Forward request to Python microservice
    const pythonResponse = await axios.post(
      `${PYTHON_SERVICE_URL}/crop-recommendation`,
      {
        state,
        district,
        land_area_hectare: parseFloat(land_area_hectare),
        budget_inr: parseFloat(budget_inr),
        planning_months: parseInt(planning_months),
        date,
        soil_type: soil_type || null,
        ph: ph ? parseFloat(ph) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        soil_report_uploaded: soil_report_uploaded || false
      },
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Return Python service response
    res.json(pythonResponse.data);

  } catch (error) {
    console.error('Crop recommendation proxy error:', error.message);

    if (error.response) {
      // Python service returned an error
      return res.status(error.response.status).json({
        error: error.response.data.detail || 'Recommendation service error',
        details: error.response.data
      });
    } else if (error.code === 'ECONNREFUSED') {
      // Python service is not running
      return res.status(503).json({
        error: 'Crop recommendation service unavailable',
        message: 'Please ensure Python microservice is running'
      });
    } else {
      // Other errors
      return res.status(500).json({
        error: 'Failed to get crop recommendation',
        message: error.message
      });
    }
  }
});

/**
 * GET /api/crop-recommendation/health
 * Check if Python service is reachable
 */
router.get('/health', async (req, res) => {
  try {
    const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/`, {
      timeout: 5000
    });
    
    res.json({
      status: 'connected',
      python_service: pythonResponse.data,
      url: PYTHON_SERVICE_URL
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: error.message,
      url: PYTHON_SERVICE_URL
    });
  }
});

export default router;
