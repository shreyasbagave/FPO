import express from 'express';
import { getCollection } from '../data/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all FPOs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const usersCollection = await getCollection('users');
    const fpos = await usersCollection
      .find({ role: 'FPO' })
      .project({ password: 0 })
      .toArray();
    
    res.json({ success: true, fpos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get FPO by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const usersCollection = await getCollection('users');
    const fpo = await usersCollection.findOne({ 
      id: parseInt(req.params.id),
      role: 'FPO'
    });
    
    if (!fpo) {
      return res.status(404).json({ success: false, message: 'FPO not found' });
    }
    
    delete fpo.password;
    res.json({ success: true, fpo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get FPO daily records
router.get('/:id/daily-records', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const { date } = req.query;
    const fpoId = parseInt(req.params.id);

    const procurementsCollection = await getCollection('procurements');
    const salesCollection = await getCollection('sales');
    const activitiesCollection = await getCollection('activities');

    let procurementQuery = { fpoId };
    let salesQuery = { fpoId };
    let activityQuery = { fpoId };

    if (date) {
      procurementQuery.date = date;
      salesQuery.date = date;
      activityQuery.date = date;
    }

    const procurements = await procurementsCollection.find(procurementQuery).toArray();
    const sales = await salesCollection.find(salesQuery).toArray();
    const activities = await activitiesCollection.find(activityQuery).toArray();

    res.json({
      success: true,
      dailyRecords: {
        procurements,
        sales,
        activities,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

