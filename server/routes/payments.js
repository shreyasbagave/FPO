import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all payments (filtered by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const paymentsCollection = await getCollection('payments');
    let query = {};
    
    if (req.user.role === 'FPO') {
      // FPO can see their own payments (both farmer payments and MAHAFPC payments)
      query.fpoId = req.user.id;
    } else if (req.user.role === 'MAHAFPC') {
      // MAHAFPC can see all payments (filter out farmer payments if needed)
      // For now, show all payments
    }

    const payments = await paymentsCollection.find(query).toArray();
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const paymentsCollection = await getCollection('payments');
    const payment = await paymentsCollection.findOne({ 
      id: parseInt(req.params.id) 
    });
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create payment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, amount, date, fpoId, farmerId, description, status } = req.body;
    
    // If farmerId is provided, it's a farmer payment (FPO to Farmer)
    if (farmerId) {
      if (!amount || !date || !farmerId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Amount, date, and farmer ID are required' 
        });
      }

      // Verify farmer belongs to this FPO user
      const farmersCollection = await getCollection('farmers');
      const farmer = await farmersCollection.findOne({ 
        id: farmerId,
        fpoId: req.user.id 
      });

      if (!farmer) {
        return res.status(404).json({ 
          success: false, 
          message: 'Farmer not found or does not belong to your FPO' 
        });
      }

      const paymentsCollection = await getCollection('payments');
      const newPayment = {
        id: await generateId('payments'),
        type: 'farmer_payment',
        amount: parseFloat(amount),
        date,
        farmerId,
        farmerName: farmer.name,
        fpoId: req.user.id,
        description: description || 'Payment to farmer',
        status: 'completed', // Farmer payments are immediately completed
      };

      await paymentsCollection.insertOne(newPayment);
      return res.status(201).json({ success: true, payment: newPayment });
    }

    // Otherwise, it's a MAHAFPC to FPO payment
    if (!type || !amount || !date || !fpoId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type, amount, date, and FPO ID are required' 
      });
    }

    // Get FPO details
    const usersCollection = await getCollection('users');
    const fpo = await usersCollection.findOne({ id: fpoId, role: 'FPO' });

    if (!fpo) {
      return res.status(404).json({ success: false, message: 'FPO not found' });
    }

    const paymentsCollection = await getCollection('payments');
    const newPayment = {
      id: await generateId('payments'),
      type,
      amount: parseFloat(amount),
      date,
      fpoId,
      fpoName: fpo.name,
      status: status || 'pending',
      description: description || '',
    };

    await paymentsCollection.insertOne(newPayment);

    res.status(201).json({ success: true, payment: newPayment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update payment status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status is required (pending, completed, rejected)' 
      });
    }

    const paymentsCollection = await getCollection('payments');
    const result = await paymentsCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, payment: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update payment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const paymentsCollection = await getCollection('payments');
    const result = await paymentsCollection.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, payment: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

