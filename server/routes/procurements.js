import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all procurements (filtered by FPO if FPO user)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const procurementsCollection = await getCollection('procurements');
    let query = {};
    
    // If FPO user, only show their procurements
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    const procurements = await procurementsCollection.find(query).toArray();
    res.json({ success: true, procurements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get procurement by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const procurementsCollection = await getCollection('procurements');
    const procurement = await procurementsCollection.findOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement not found' });
    }
    
    res.json({ success: true, procurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create procurement
router.post('/', authenticateToken, authorizeRole('FPO'), async (req, res) => {
  try {
    const { farmerId, productId, quantity, rate, date } = req.body;
    
    if (!farmerId || !productId || !quantity || !rate || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Farmer ID, product ID, quantity, rate, and date are required' 
      });
    }

    // Get farmer and product details
    const farmersCollection = await getCollection('farmers');
    const productsCollection = await getCollection('products');
    
    // Verify farmer belongs to this FPO user
    const farmer = await farmersCollection.findOne({ 
      id: farmerId,
      fpoId: req.user.id 
    });
    const product = await productsCollection.findOne({ id: productId });

    if (!farmer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Farmer not found or does not belong to your FPO' 
      });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const procurementsCollection = await getCollection('procurements');
    // Quantity is stored in tons, rate is per ton
    // Amount = quantity_in_tons * rate_per_ton
    const newProcurement = {
      id: await generateId('procurements'),
      date,
      farmerId,
      farmerName: farmer.name,
      farmerMobileNumber: farmer.mobileNumber,
      farmerVillageName: farmer.villageName,
      productId,
      productName: product.name,
      quantity: parseFloat(quantity), // Stored in tons
      rate: parseFloat(rate), // Rate per ton
      amount: parseFloat(quantity) * parseFloat(rate), // Calculation: tons * rate_per_ton
      fpoId: req.user.id,
    };

    await procurementsCollection.insertOne(newProcurement);

    // Update inventory - add procurement quantity to inventory
    const inventoryCollection = await getCollection('inventory');
    const existingInventory = await inventoryCollection.findOne({
      productId,
      fpoId: req.user.id,
    });

    if (existingInventory) {
      // Update existing inventory - add procurement quantity
      await inventoryCollection.findOneAndUpdate(
        { productId, fpoId: req.user.id },
        {
          $inc: { quantity: parseFloat(quantity) }, // Increment quantity
        },
        { returnDocument: 'after' }
      );
    } else {
      // Create new inventory entry
      const newInventory = {
        id: await generateId('inventory'),
        productId,
        productName: product.name,
        quantity: parseFloat(quantity),
        minStock: 0,
        maxStock: 0,
        unit: product.unit,
        fpoId: req.user.id,
      };
      await inventoryCollection.insertOne(newInventory);
    }

    // Create activity log
    const activitiesCollection = await getCollection('activities');
    await activitiesCollection.insertOne({
      id: await generateId('activities'),
      date,
      time: new Date().toLocaleTimeString(),
      type: 'procurement',
      quantity: parseFloat(quantity),
      productName: product.name,
      fpoId: req.user.id,
    });

    res.status(201).json({ success: true, procurement: newProcurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update procurement
router.put('/:id', authenticateToken, authorizeRole('FPO'), async (req, res) => {
  try {
    const procurementsCollection = await getCollection('procurements');
    const procurement = await procurementsCollection.findOne({ 
      id: parseInt(req.params.id) 
    });

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement not found' });
    }

    if (procurement.fpoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Recalculate amount if quantity or rate changed
    if (req.body.quantity || req.body.rate) {
      const quantity = req.body.quantity || procurement.quantity;
      const rate = req.body.rate || procurement.rate;
      // Quantity is in tons, rate is per ton
      req.body.amount = parseFloat(quantity) * parseFloat(rate);
    }

    // Update inventory if quantity changed
    if (req.body.quantity && req.body.quantity !== procurement.quantity) {
      const inventoryCollection = await getCollection('inventory');
      const existingInventory = await inventoryCollection.findOne({
        productId: procurement.productId,
        fpoId: req.user.id,
      });

      if (existingInventory) {
        // Calculate quantity difference
        const quantityDiff = parseFloat(req.body.quantity) - procurement.quantity;
        const newQuantity = Math.max(0, existingInventory.quantity + quantityDiff);
        
        await inventoryCollection.findOneAndUpdate(
          { productId: procurement.productId, fpoId: req.user.id },
          {
            $set: { quantity: newQuantity },
          }
        );
      }
    }

    const result = await procurementsCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    res.json({ success: true, procurement: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete procurement
router.delete('/:id', authenticateToken, authorizeRole('FPO'), async (req, res) => {
  try {
    const procurementsCollection = await getCollection('procurements');
    const procurement = await procurementsCollection.findOne({ 
      id: parseInt(req.params.id) 
    });

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement not found' });
    }

    if (procurement.fpoId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update inventory - subtract procurement quantity from inventory
    const inventoryCollection = await getCollection('inventory');
    const existingInventory = await inventoryCollection.findOne({
      productId: procurement.productId,
      fpoId: req.user.id,
    });

    if (existingInventory) {
      // Decrement inventory quantity
      const newQuantity = Math.max(0, existingInventory.quantity - procurement.quantity);
      await inventoryCollection.findOneAndUpdate(
        { productId: procurement.productId, fpoId: req.user.id },
        {
          $set: { quantity: newQuantity },
        }
      );
    }

    const result = await procurementsCollection.deleteOne({ 
      id: parseInt(req.params.id) 
    });

    res.json({ success: true, message: 'Procurement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

