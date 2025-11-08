import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all sales (filtered by FPO if FPO user, all if MAHAFPC)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const salesCollection = await getCollection('sales');
    let query = {};
    
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    const sales = await salesCollection.find(query).toArray();
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get sale by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const salesCollection = await getCollection('sales');
    const sale = await salesCollection.findOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    res.json({ success: true, sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create sale (FPO creates sale to MAHAFPC)
router.post('/', authenticateToken, authorizeRole('FPO'), async (req, res) => {
  try {
    const { productId, quantity, rate, date } = req.body;
    
    if (!productId || !quantity || !rate || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, quantity, rate, and date are required' 
      });
    }

    // Get FPO and product details
    const usersCollection = await getCollection('users');
    const productsCollection = await getCollection('products');
    
    const fpo = await usersCollection.findOne({ id: req.user.id, role: 'FPO' });
    const product = await productsCollection.findOne({ id: productId });

    if (!fpo) {
      return res.status(404).json({ success: false, message: 'FPO not found' });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const salesCollection = await getCollection('sales');
    const newSale = {
      id: await generateId('sales'),
      date,
      time: new Date().toLocaleTimeString(),
      fpoId: req.user.id,
      fpoName: fpo.name,
      productId,
      productName: product.name,
      quantity: parseFloat(quantity),
      rate: parseFloat(rate),
      amount: parseFloat(quantity) * parseFloat(rate),
      status: 'pending',
    };

    await salesCollection.insertOne(newSale);

    // Create activity log
    const activitiesCollection = await getCollection('activities');
    await activitiesCollection.insertOne({
      id: await generateId('activities'),
      date,
      time: new Date().toLocaleTimeString(),
      type: 'sale',
      quantity: parseFloat(quantity),
      productName: product.name,
      fpoId: req.user.id,
    });

    res.status(201).json({ success: true, sale: newSale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update sale status (MAHAFPC can approve/reject)
router.put('/:id/status', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status is required (pending, completed, rejected)' 
      });
    }

    const salesCollection = await getCollection('sales');
    const sale = await salesCollection.findOne({ 
      id: parseInt(req.params.id) 
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const result = await salesCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    // Update inventory when sale is completed - subtract quantity from inventory
    if (status === 'completed' && sale.status !== 'completed') {
      const inventoryCollection = await getCollection('inventory');
      const existingInventory = await inventoryCollection.findOne({
        productId: sale.productId,
        fpoId: sale.fpoId,
      });

      if (existingInventory) {
        // Decrement inventory quantity
        const newQuantity = Math.max(0, existingInventory.quantity - sale.quantity);
        await inventoryCollection.findOneAndUpdate(
          { productId: sale.productId, fpoId: sale.fpoId },
          {
            $set: { quantity: newQuantity },
          }
        );
      }
    }

    // If sale status changed from completed to something else, add quantity back
    if (sale.status === 'completed' && status !== 'completed') {
      const inventoryCollection = await getCollection('inventory');
      const existingInventory = await inventoryCollection.findOne({
        productId: sale.productId,
        fpoId: sale.fpoId,
      });

      if (existingInventory) {
        // Increment inventory quantity back
        await inventoryCollection.findOneAndUpdate(
          { productId: sale.productId, fpoId: sale.fpoId },
          {
            $inc: { quantity: sale.quantity },
          }
        );
      }
    }

    res.json({ success: true, sale: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update sale
router.put('/:id', authenticateToken, authorizeRole('FPO'), async (req, res) => {
  try {
    const salesCollection = await getCollection('sales');
    const sale = await salesCollection.findOne({ 
      id: parseInt(req.params.id) 
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (sale.fpoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.body.quantity || req.body.rate) {
      const quantity = req.body.quantity || sale.quantity;
      const rate = req.body.rate || sale.rate;
      req.body.amount = parseFloat(quantity) * parseFloat(rate);
    }

    const result = await salesCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    res.json({ success: true, sale: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

