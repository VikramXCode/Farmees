// API Routes for Land Recommendations
import express from 'express';
const router = express.Router();
import LandRecommendation from '../models/LandRecommendation.js';

// Create new recommendation
router.post('/', async (req, res) => {
  try {
    const recommendation = new LandRecommendation(req.body);
    await recommendation.save();
    res.status(201).json(recommendation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recommendations for a land
router.get('/land/:landId', async (req, res) => {
  try {
    const recommendations = await LandRecommendation.find({ landId: req.params.landId })
      .sort({ priority: -1, createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const recommendations = await LandRecommendation.find({ userId: req.params.userId })
      .sort({ priority: -1, createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update recommendation status
router.put('/:recommendationId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const recommendation = await LandRecommendation.findByIdAndUpdate(
      req.params.recommendationId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json(recommendation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending recommendations
router.get('/pending/:landId', async (req, res) => {
  try {
    const recommendations = await LandRecommendation.find({
      landId: req.params.landId,
      status: 'pending'
    }).sort({ priority: -1, dueDate: 1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overdue recommendations
router.get('/overdue/:landId', async (req, res) => {
  try {
    const recommendations = await LandRecommendation.find({
      landId: req.params.landId,
      status: 'pending',
      dueDate: { $lt: new Date() }
    }).sort({ dueDate: 1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete recommendation
router.delete('/:recommendationId', async (req, res) => {
  try {
    const recommendation = await LandRecommendation.findByIdAndDelete(req.params.recommendationId);

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
