import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all dispatches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const dispatchesCollection = await getCollection('dispatches');
    let query = {};
    
    if (req.user.role === 'Retailer') {
      query.retailerId = req.user.id;
    } else if (req.user.role === 'MAHAFPC') {
      // MAHAFPC can see all dispatches
    } else if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    const dispatches = await dispatchesCollection.find(query).toArray();
    res.json({ success: true, dispatches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get dispatch by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const dispatchesCollection = await getCollection('dispatches');
    const dispatch = await dispatchesCollection.findOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch not found' });
    }
    
    res.json({ success: true, dispatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create dispatch (MAHAFPC creates dispatch to retailer)
router.post('/', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const { fpoId, retailerId, productId, quantity, rate, date, lotThreshold } = req.body;
    
    if (!fpoId || !retailerId || !productId || !quantity || !rate || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'FPO ID, retailer ID, product ID, quantity, rate, and date are required' 
      });
    }

    // Get FPO, retailer, and product details
    const usersCollection = await getCollection('users');
    const retailersCollection = await getCollection('retailers');
    const productsCollection = await getCollection('products');
    
    const fpo = await usersCollection.findOne({ id: fpoId, role: 'FPO' });
    const retailer = await retailersCollection.findOne({ id: retailerId });
    const product = await productsCollection.findOne({ id: productId });

    if (!fpo) {
      return res.status(404).json({ success: false, message: 'FPO not found' });
    }
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Retailer not found' });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const dispatchesCollection = await getCollection('dispatches');
    const newDispatch = {
      id: await generateId('dispatches'),
      date,
      fpoId,
      fpoName: fpo.name,
      retailerId,
      retailerName: retailer.name,
      productId,
      productName: product.name,
      quantity: parseFloat(quantity),
      rate: parseFloat(rate),
      amount: parseFloat(quantity) * parseFloat(rate),
      status: 'pending',
      lotThreshold: parseFloat(lotThreshold) || 20000,
    };

    await dispatchesCollection.insertOne(newDispatch);

    res.status(201).json({ success: true, dispatch: newDispatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update dispatch status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status is required (pending, completed, rejected)' 
      });
    }

    const dispatchesCollection = await getCollection('dispatches');
    const dispatch = await dispatchesCollection.findOne({ 
      id: parseInt(req.params.id) 
    });

    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch not found' });
    }

    // Check authorization
    if (req.user.role === 'Retailer' && dispatch.retailerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const result = await dispatchesCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    res.json({ success: true, dispatch: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update dispatch
router.put('/:id', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const dispatchesCollection = await getCollection('dispatches');
    
    if (req.body.quantity || req.body.rate) {
      const dispatch = await dispatchesCollection.findOne({ 
        id: parseInt(req.params.id) 
      });
      if (dispatch) {
        const quantity = req.body.quantity || dispatch.quantity;
        const rate = req.body.rate || dispatch.rate;
        req.body.amount = parseFloat(quantity) * parseFloat(rate);
      }
    }

    const result = await dispatchesCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Dispatch not found' });
    }

    res.json({ success: true, dispatch: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

