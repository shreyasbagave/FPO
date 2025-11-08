import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './data/database.js';
import authRoutes from './routes/auth.js';
import farmerRoutes from './routes/farmers.js';
import productRoutes from './routes/products.js';
import procurementRoutes from './routes/procurements.js';
import salesRoutes from './routes/sales.js';
import inventoryRoutes from './routes/inventory.js';
import dispatchRoutes from './routes/dispatches.js';
import paymentRoutes from './routes/payments.js';
import activityRoutes from './routes/activities.js';
import analyticsRoutes from './routes/analytics.js';
import fpoRoutes from './routes/fpo.js';
import retailerRoutes from './routes/retailers.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow all origins in development, specific origins in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Set FRONTEND_URL in production
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/procurements', procurementRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/fpo', fpoRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Procurement API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Connect to MongoDB before starting server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

export default app;

