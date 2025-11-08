import express from 'express';
import { getCollection } from '../data/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const procurementsCollection = await getCollection('procurements');
    const salesCollection = await getCollection('sales');
    const inventoryCollection = await getCollection('inventory');
    const paymentsCollection = await getCollection('payments');
    const dispatchesCollection = await getCollection('dispatches');

    let query = {};
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    // Get totals
    const procurements = await procurementsCollection.find(query).toArray();
    const sales = await salesCollection.find(query).toArray();
    const inventory = await inventoryCollection.find(query).toArray();
    const payments = await paymentsCollection.find(query).toArray();
    const dispatches = req.user.role === 'MAHAFPC' || req.user.role === 'Retailer'
      ? await dispatchesCollection.find(query).toArray()
      : [];

    // Calculate statistics
    const totalProcurement = procurements.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalInventory = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDispatches = dispatches.reduce((sum, d) => sum + (d.amount || 0), 0);

    const pendingSales = sales.filter(s => s.status === 'pending').length;
    const completedSales = sales.filter(s => s.status === 'completed').length;
    const pendingDispatches = dispatches.filter(d => d.status === 'pending').length;
    const completedDispatches = dispatches.filter(d => d.status === 'completed').length;

    res.json({
      success: true,
      analytics: {
        totalProcurement,
        totalSales,
        totalInventory,
        totalPayments,
        totalDispatches,
        pendingSales,
        completedSales,
        pendingDispatches,
        completedDispatches,
        totalProcurements: procurements.length,
        totalSalesCount: sales.length,
        totalInventoryItems: inventory.length,
        totalPaymentsCount: payments.length,
        totalDispatchesCount: dispatches.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get sales by product
router.get('/sales-by-product', authenticateToken, async (req, res) => {
  try {
    const salesCollection = await getCollection('sales');
    let query = {};
    
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    const sales = await salesCollection.find(query).toArray();
    
    // Group by product
    const salesByProduct = {};
    sales.forEach(sale => {
      if (!salesByProduct[sale.productName]) {
        salesByProduct[sale.productName] = {
          productName: sale.productName,
          totalQuantity: 0,
          totalAmount: 0,
          count: 0,
        };
      }
      salesByProduct[sale.productName].totalQuantity += sale.quantity || 0;
      salesByProduct[sale.productName].totalAmount += sale.amount || 0;
      salesByProduct[sale.productName].count += 1;
    });

    res.json({
      success: true,
      salesByProduct: Object.values(salesByProduct),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get procurement by product
router.get('/procurement-by-product', authenticateToken, async (req, res) => {
  try {
    const procurementsCollection = await getCollection('procurements');
    let query = {};
    
    if (req.user.role === 'FPO') {
      query.fpoId = req.user.id;
    }

    const procurements = await procurementsCollection.find(query).toArray();
    
    // Group by product
    const procurementByProduct = {};
    procurements.forEach(procurement => {
      if (!procurementByProduct[procurement.productName]) {
        procurementByProduct[procurement.productName] = {
          productName: procurement.productName,
          totalQuantity: 0,
          totalAmount: 0,
          count: 0,
        };
      }
      procurementByProduct[procurement.productName].totalQuantity += procurement.quantity || 0;
      procurementByProduct[procurement.productName].totalAmount += procurement.amount || 0;
      procurementByProduct[procurement.productName].count += 1;
    });

    res.json({
      success: true,
      procurementByProduct: Object.values(procurementByProduct),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

