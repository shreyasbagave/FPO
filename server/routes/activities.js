import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all activities (filtered by FPO if FPO user)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const activitiesCollection = await getCollection('activities');
    let query = {};
    
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    // Optional date filter
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: req.query.startDate,
        $lte: req.query.endDate,
      };
    } else if (req.query.date) {
      query.date = req.query.date;
    }

    const activities = await activitiesCollection
      .find(query)
      .sort({ date: -1, time: -1 })
      .toArray();
    
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get activity by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const activitiesCollection = await getCollection('activities');
    const activity = await activitiesCollection.findOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    
    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create activity (usually created automatically by other operations)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, time, type, quantity, productName, fpoId } = req.body;
    
    if (!date || !time || !type || !productName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date, time, type, and product name are required' 
      });
    }

    const activitiesCollection = await getCollection('activities');
    const newActivity = {
      id: await generateId('activities'),
      date,
      time,
      type,
      quantity: quantity ? parseFloat(quantity) : 0,
      productName,
      fpoId: fpoId || (req.user.role === 'FPO' ? req.user.id : null),
    };

    await activitiesCollection.insertOne(newActivity);

    res.status(201).json({ success: true, activity: newActivity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

