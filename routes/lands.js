// API Routes for Land Management
import express from 'express';
const router = express.Router();
import Land from '../models/Land.js';
import AIInteraction from '../models/AIInteraction.js';
import LandRecommendation from '../models/LandRecommendation.js';

// Create new land data
router.post('/', async (req, res) => {
  try {
    console.log('Creating land with data:', req.body);
    const landData = new Land(req.body);
    await landData.save();
    console.log('Land created successfully:', landData.landId, landData.name);
    res.status(201).json(landData);
  } catch (error) {
    console.error('Land creation error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get all lands for a user (MUST come before /:landId)
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('Fetching lands for user:', req.params.userId);
    // In demo mode, only return demo lands
    const filter = req.isDemo
      ? { userId: req.params.userId, isActive: true, isDemo: true }
      : { userId: req.params.userId, isActive: true, isDemo: { $ne: true } };

    const lands = await Land.find(filter).sort({ updatedAt: -1 });
    console.log(`Found ${lands.length} lands for user ${req.params.userId}:`, lands.map(l => ({ id: l.landId, name: l.name })));
    res.json(lands);
  } catch (error) {
    console.error('Error fetching user lands:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get land data by ID
router.get('/:landId', async (req, res) => {
  try {
    const land = await Land.findOne({ landId: req.params.landId, isActive: true });
    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }
    res.json(land);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update land data
router.put('/:landId', async (req, res) => {
  try {
    const land = await Land.findOneAndUpdate(
      { landId: req.params.landId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    res.json(land);
  } catch (error) {
    console.error('Update error:', error);
    return res.status(400).json({ error: error?.message || 'Update failed' });
  }
});

// Delete land (soft delete)
router.delete('/:landId', async (req, res) => {
  try {
    const land = await Land.findOneAndUpdate(
      { landId: req.params.landId },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    res.json({ message: 'Land deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update weather data for a land
router.put('/:landId/weather', async (req, res) => {
  try {
    const land = await Land.findOneAndUpdate(
      { landId: req.params.landId },
      {
        $push: { weatherHistory: req.body },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    res.json(land);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add crop record
router.put('/:landId/crop', async (req, res) => {
  try {
    const land = await Land.findOneAndUpdate(
      { landId: req.params.landId },
      {
        $push: { cropHistory: req.body },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    res.json(land);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add pest/disease record
router.put('/:landId/pest-disease', async (req, res) => {
  try {
    const land = await Land.findOneAndUpdate(
      { landId: req.params.landId },
      {
        $push: { pestDiseaseHistory: req.body },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    res.json(land);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add treatment record
router.put('/:landId/treatment', async (req, res) => {
  try {
    const land = await Land.findOneAndUpdate(
      { landId: req.params.landId },
      {
        $push: { treatmentHistory: req.body },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    res.json(land);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update market data
router.put('/:landId/market', async (req, res) => {
  try {
    const land = await Land.findOneAndUpdate(
      { landId: req.params.landId },
      {
        marketData: req.body,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    res.json(land);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update AI context
router.put('/:landId/ai-context', async (req, res) => {
  try {
    const land = await Land.findOneAndUpdate(
      { landId: req.params.landId },
      {
        'aiContext': { ...req.body, lastInteraction: new Date() },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    res.json(land);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get land analytics
router.get('/:landId/analytics', async (req, res) => {
  try {
    const land = await Land.findOne({ landId: req.params.landId, isActive: true });

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    // Calculate analytics
    const analytics = {
      totalCrops: land.cropHistory.length,
      totalTreatments: land.treatmentHistory.length,
      pestDiseaseCount: land.pestDiseaseHistory.length,
      averageYield: land.cropHistory.reduce((sum, crop) => sum + (crop.yield || 0), 0) / land.cropHistory.length || 0,
      recentWeather: land.weatherHistory.slice(-7), // Last 7 days
      currentMarketPrice: land.marketData[0]?.currentPrice || 0,
      aiInteractions: await AIInteraction.countDocuments({ landId: req.params.landId }),
      pendingRecommendations: await LandRecommendation.countDocuments({
        landId: req.params.landId,
        status: 'pending'
      })
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
