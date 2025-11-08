import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all farmers (filtered by FPO user)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const farmersCollection = await getCollection('farmers');
    let query = {};
    
    // If FPO user, only show their farmers
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }
    // MAHAFPC can see all farmers
    // Retailers cannot access farmers endpoint (will be blocked by authorizeRole if needed)

    const farmers = await farmersCollection.find(query).toArray();
    res.json({ success: true, farmers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get farmer by ID (only if belongs to FPO user)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const farmersCollection = await getCollection('farmers');
    let query = { id: parseInt(req.params.id) };
    
    // If FPO user, only allow access to their farmers
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    const farmer = await farmersCollection.findOne(query);
    
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }
    
    res.json({ success: true, farmer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create farmer (FPO only, automatically associates with FPO user)
router.post('/', authenticateToken, authorizeRole('FPO'), async (req, res) => {
  try {
    const { name, mobileNumber, villageName } = req.body;
    
    if (!name || !mobileNumber || !villageName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, mobile number, and village name are required' 
      });
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mobile number must be 10 digits' 
      });
    }

    const farmersCollection = await getCollection('farmers');
    
    // Check if farmer with same mobile number already exists for this FPO
    const existingFarmer = await farmersCollection.findOne({ 
      mobileNumber: mobileNumber,
      fpoId: req.user.id
    });

    if (existingFarmer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Farmer with this mobile number already exists' 
      });
    }

    const newFarmer = {
      id: await generateId('farmers'),
      name,
      mobileNumber,
      villageName,
      fpoId: req.user.id, // Associate with logged-in FPO user
      createdAt: new Date().toISOString(),
    };

    await farmersCollection.insertOne(newFarmer);

    res.status(201).json({ success: true, farmer: newFarmer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update farmer (only if belongs to FPO user)
router.put('/:id', authenticateToken, authorizeRole('FPO'), async (req, res) => {
  try {
    const farmersCollection = await getCollection('farmers');
    
    // Verify farmer belongs to this FPO user
    const farmer = await farmersCollection.findOne({ 
      id: parseInt(req.params.id),
      fpoId: req.user.id
    });

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found or access denied' });
    }

    // Validate mobile number if being updated
    if (req.body.mobileNumber) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(req.body.mobileNumber)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mobile number must be 10 digits' 
        });
      }

      // Check if mobile number already exists for another farmer of this FPO
      const existingFarmer = await farmersCollection.findOne({ 
        mobileNumber: req.body.mobileNumber,
        fpoId: req.user.id,
        id: { $ne: parseInt(req.params.id) }
      });

      if (existingFarmer) {
        return res.status(400).json({ 
          success: false, 
          message: 'Farmer with this mobile number already exists' 
        });
      }
    }

    const result = await farmersCollection.findOneAndUpdate(
      { id: parseInt(req.params.id), fpoId: req.user.id },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    res.json({ success: true, farmer: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete farmer (only if belongs to FPO user)
router.delete('/:id', authenticateToken, authorizeRole('FPO'), async (req, res) => {
  try {
    const farmersCollection = await getCollection('farmers');
    const result = await farmersCollection.deleteOne({ 
      id: parseInt(req.params.id),
      fpoId: req.user.id // Only delete if belongs to this FPO user
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found or access denied' });
    }

    res.json({ success: true, message: 'Farmer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
