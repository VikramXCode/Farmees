import express from 'express';
const router = express.Router();
import AIInteraction from '../models/AIInteraction.js';


// Save AI interaction
router.post('/', async (req, res) => {
  try {
    const interaction = new AIInteraction(req.body);
    await interaction.save();
    res.status(201).json(interaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get AI interactions for a land
router.get('/land/:landId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const interactions = await AIInteraction.find({ landId: req.params.landId })
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI interactions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const interactions = await AIInteraction.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update interaction feedback
router.put('/:interactionId/feedback', async (req, res) => {
  try {
    const interaction = await AIInteraction.findByIdAndUpdate(
      req.params.interactionId,
      { feedback: req.body },
      { new: true }
    );

    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    res.json(interaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get interaction statistics
router.get('/stats/:landId', async (req, res) => {
  try {
    const stats = await AIInteraction.aggregate([
      { $match: { landId: req.params.landId } },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          averageRating: { $avg: '$feedback.rating' },
          helpfulCount: { $sum: { $cond: ['$feedback.helpful', 1, 0] } },
          lastInteraction: { $max: '$timestamp' }
        }
      }
    ]);

    res.json(stats[0] || {
      totalInteractions: 0,
      averageRating: 0,
      helpfulCount: 0,
      lastInteraction: null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

