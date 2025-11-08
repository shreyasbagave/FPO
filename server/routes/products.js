import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const productsCollection = await getCollection('products');
    const products = await productsCollection.find({}).toArray();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get product by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const productsCollection = await getCollection('products');
    const product = await productsCollection.findOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create product
router.post('/', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const { name, unit, category } = req.body;
    
    if (!name || !unit || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, unit, and category are required' 
      });
    }

    const productsCollection = await getCollection('products');
    const newProduct = {
      id: await generateId('products'),
      name,
      unit,
      category,
    };

    await productsCollection.insertOne(newProduct);

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update product
router.put('/:id', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const productsCollection = await getCollection('products');
    const result = await productsCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete product
router.delete('/:id', authenticateToken, authorizeRole('MAHAFPC'), async (req, res) => {
  try {
    const productsCollection = await getCollection('products');
    const result = await productsCollection.deleteOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
