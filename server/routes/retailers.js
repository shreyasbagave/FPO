import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all retailers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const retailersCollection = await getCollection('retailers');
    const retailers = await retailersCollection.find({}).toArray();
    res.json({ success: true, retailers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get retailer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const retailersCollection = await getCollection('retailers');
    const retailer = await retailersCollection.findOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Retailer not found' });
    }
    
    res.json({ success: true, retailer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create retailer
router.post('/', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    
    if (!name || !location || !contact) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, location, and contact are required' 
      });
    }

    const retailersCollection = await getCollection('retailers');
    const newRetailer = {
      id: await generateId('retailers'),
      name,
      location,
      contact,
    };

    await retailersCollection.insertOne(newRetailer);

    res.status(201).json({ success: true, retailer: newRetailer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update retailer
router.put('/:id', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const retailersCollection = await getCollection('retailers');
    const result = await retailersCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Retailer not found' });
    }

    res.json({ success: true, retailer: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete retailer
router.delete('/:id', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const retailersCollection = await getCollection('retailers');
    const result = await retailersCollection.deleteOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Retailer not found' });
    }

    res.json({ success: true, message: 'Retailer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

