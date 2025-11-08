import express from 'express';
import bcrypt from 'bcryptjs';
import { getCollection, generateId } from '../data/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Login endpoint with username/password and role
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    if (!role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role is required' 
      });
    }

    // Validate role
    const validRoles = ['FPO', 'MAHAFPC', 'Retailer'];
    const normalizedRole = role === 'MLP' ? 'Retailer' : role;
    
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }

    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ 
      $or: [
        { username: username },
        { email: username }
      ],
      role: normalizedRole // Filter by role
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username, password, or role' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username, password, or role' 
      });
    }

    // Verify role matches
    if (user.role !== normalizedRole) {
      return res.status(401).json({ 
        success: false, 
        message: 'Role mismatch. Please select the correct role.' 
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        location: user.location,
        contact: user.contact,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { username, password, name, email, role, location, contact } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, password, name, and role are required' 
      });
    }

    // Validate role
    const validRoles = ['FPO', 'MAHAFPC', 'Retailer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be FPO, MAHAFPC, or Retailer' 
      });
    }

    // Check if username already exists
    const usersCollection = await getCollection('users');
    const existingUser = await usersCollection.findOne({ 
      $or: [
        { username: username },
        { email: email || '' }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: await generateId('users'),
      username,
      password: hashedPassword,
      name,
      email: email || '',
      role,
      location: location || '',
      contact: contact || '',
      createdAt: new Date().toISOString(),
    };

    await usersCollection.insertOne(newUser);

    // Generate token for auto-login
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      token,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        location: newUser.location,
        contact: newUser.contact,
        email: newUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email is required' 
      });
    }

    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ 
      $or: [
        { username: username || '' },
        { email: email || '' }
      ]
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ 
        success: true, 
        message: 'If the account exists, a password reset link has been sent' 
      });
    }

    // In production, send email with reset token
    // For now, we'll generate a reset token and store it
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    await usersCollection.updateOne(
      { id: user.id },
      { 
        $set: { 
          resetToken,
          resetTokenExpiry: resetTokenExpiry.toISOString()
        } 
      }
    );

    // In production, send email here
    console.log(`Reset token for ${user.username}: ${resetToken}`);
    console.log(`Token expires at: ${resetTokenExpiry.toISOString()}`);

    res.json({ 
      success: true, 
      message: 'If the account exists, a password reset link has been sent',
      // In development, return the token (remove in production)
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ resetToken });

    if (!user || !user.resetTokenExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Check if token is expired
    const expiryDate = new Date(user.resetTokenExpiry);
    if (expiryDate < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token has expired' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await usersCollection.updateOne(
      { id: user.id },
      { 
        $set: { 
          password: hashedPassword
        },
        $unset: {
          resetToken: '',
          resetTokenExpiry: ''
        }
      }
    );

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get users by role (for admin purposes)
router.get('/users/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const usersCollection = await getCollection('users');
    
    const users = await usersCollection
      .find({ role: role })
      .project({ password: 0, resetToken: 0, resetTokenExpiry: 0 }) // Exclude sensitive data
      .toArray();

    const userList = users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      location: u.location,
      contact: u.contact,
      email: u.email,
    }));

    res.json({ success: true, users: userList });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;
