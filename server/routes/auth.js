const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// In-memory user storage (for demo purposes)
// In a real app, this would be stored in a database
const users = [];

// Secret key for JWT signing
const JWT_SECRET = process.env.JWT_SECRET || 'find-your-vibe-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide all required fields',
        details: 'Username, email, and password are required'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (role defaults to 'user')
    const user = new User({ username, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Return user info (without password) and token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Please provide all required fields',
        details: 'Username and password are required'
      });
    }

    // Find user - check both username and email
    const user = await User.findOne({
      $or: [
        { username },
        { email: username } // Allow login with email as username
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user info and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        events: user.events
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // User is already attached to req by authenticate middleware
    res.json({
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      events: req.user.events
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

/**
 * @route   PUT /api/auth/role/:userId
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 */
router.put('/role/:userId', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    // Validate role
    if (!role || !['user', 'host', 'admin'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role',
        details: 'Role must be user, host, or admin'
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Export the router directly for Express
module.exports = router;

// Make authenticateToken available separately
module.exports.authenticateToken = authenticateToken; 