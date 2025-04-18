const { verifyToken } = require('../utils/auth');
const User = require('../models/User');

/**
 * Middleware to authenticate users
 * Verifies JWT token from the authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        details: 'No valid token provided'
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify and decode token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        message: 'Authentication failed', 
        details: 'Invalid or expired token'
      });
    }
    
    // Find user by id from decoded token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Authentication failed', 
        details: 'User not found'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

/**
 * Middleware to authorize host and admin roles
 * Must be used after authenticate middleware
 */
const authorizeHost = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required', 
      details: 'Please authenticate first'
    });
  }
  
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied', 
      details: 'Host privileges required'
    });
  }
  
  next();
};

/**
 * Middleware to authorize admin role only
 * Must be used after authenticate middleware
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required', 
      details: 'Please authenticate first'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied', 
      details: 'Admin privileges required'
    });
  }
  
  next();
};

/**
 * Middleware to verify event ownership
 * Checks if the authenticated user is the host of the specified event
 * Must be used after authenticate middleware
 */
const verifyEventOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        details: 'Please authenticate first'
      });
    }
    
    const { eventCode } = req.params;
    
    // If user is admin, allow access
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is host and owns this event
    if (req.user.role === 'host' && req.user.events.includes(eventCode)) {
      return next();
    }
    
    return res.status(403).json({ 
      message: 'Access denied', 
      details: 'You do not have permission to access this event'
    });
  } catch (error) {
    console.error('Event ownership verification error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

module.exports = {
  authenticate,
  authorizeHost,
  authorizeAdmin,
  verifyEventOwnership
}; 