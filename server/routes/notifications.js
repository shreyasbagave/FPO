import express from 'express';
import { getCollection, generateId } from '../data/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notificationsCollection = await getCollection('notifications');
    const query = { userId: req.user.id };
    
    const notifications = await notificationsCollection
      .find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .toArray();
    
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread notifications count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const notificationsCollection = await getCollection('notifications');
    const count = await notificationsCollection.countDocuments({
      userId: req.user.id,
      read: false,
    });
    
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, message } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and message are required' 
      });
    }

    const notificationsCollection = await getCollection('notifications');
    const newNotification = {
      id: await generateId('notifications'),
      userId: req.user.id,
      type,
      message,
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    };

    await notificationsCollection.insertOne(newNotification);

    res.status(201).json({ success: true, notification: newNotification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationsCollection = await getCollection('notifications');
    const result = await notificationsCollection.findOneAndUpdate(
      { 
        id: parseInt(req.params.id),
        userId: req.user.id // Ensure user can only update their own notifications
      },
      { $set: { read: true } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found or access denied' 
      });
    }

    res.json({ success: true, notification: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const notificationsCollection = await getCollection('notifications');
    const result = await notificationsCollection.updateMany(
      { 
        userId: req.user.id,
        read: false
      },
      { $set: { read: true } }
    );

    res.json({ 
      success: true, 
      message: `Marked ${result.modifiedCount} notifications as read` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationsCollection = await getCollection('notifications');
    const result = await notificationsCollection.deleteOne({ 
      id: parseInt(req.params.id),
      userId: req.user.id // Ensure user can only delete their own notifications
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found or access denied' 
      });
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete all notifications
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const notificationsCollection = await getCollection('notifications');
    const result = await notificationsCollection.deleteMany({ 
      userId: req.user.id
    });

    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} notifications` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

