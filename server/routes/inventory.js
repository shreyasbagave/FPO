import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get inventory (filtered by FPO if FPO user)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const inventoryCollection = await getCollection('inventory');
    let query = {};
    
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    const inventory = await inventoryCollection.find(query).toArray();
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get inventory by product ID
router.get('/product/:productId', authenticateToken, async (req, res) => {
  try {
    const inventoryCollection = await getCollection('inventory');
    let query = { productId: parseInt(req.params.productId) };
    
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    const inventory = await inventoryCollection.find(query).toArray();
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or update inventory
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity, minStock, maxStock, fpoId } = req.body;
    
    if (!productId || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID and quantity are required' 
      });
    }

    const productsCollection = await getCollection('products');
    const product = await productsCollection.findOne({ id: productId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const inventoryCollection = await getCollection('inventory');
    const targetFpoId = fpoId || (req.user.role === 'FPO' ? req.user.id : null);

    if (!targetFpoId) {
      return res.status(400).json({ 
        success: false, 
        message: 'FPO ID is required' 
      });
    }

    // Check if inventory exists
    const existing = await inventoryCollection.findOne({ 
      productId, 
      fpoId: targetFpoId 
    });

    if (existing) {
      // Update existing
      const result = await inventoryCollection.findOneAndUpdate(
        { productId, fpoId: targetFpoId },
        { 
          $set: { 
            quantity: parseFloat(quantity),
            minStock: minStock ? parseFloat(minStock) : existing.minStock,
            maxStock: maxStock ? parseFloat(maxStock) : existing.maxStock,
          } 
        },
        { returnDocument: 'after' }
      );
      res.json({ success: true, inventory: result.value });
    } else {
      // Create new
      const newInventory = {
        id: await generateId('inventory'),
        productId,
        productName: product.name,
        quantity: parseFloat(quantity),
        minStock: parseFloat(minStock) || 0,
        maxStock: parseFloat(maxStock) || 0,
        unit: product.unit,
        fpoId: targetFpoId,
      };

      await inventoryCollection.insertOne(newInventory);
      res.status(201).json({ success: true, inventory: newInventory });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update inventory quantity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const inventoryCollection = await getCollection('inventory');
    const inventory = await inventoryCollection.findOne({ 
      id: parseInt(req.params.id) 
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    if (req.user.role === 'FPO' && inventory.fpoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const result = await inventoryCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    res.json({ success: true, inventory: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

