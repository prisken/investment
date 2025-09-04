// Authentication middleware with fallback for development
let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (error) {
  console.warn('JWT module not available, using mock authentication');
  jwt = null;
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
  }

  try {
    if (jwt) {
      // Verify token with real JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    } else {
      // Mock token verification for development
      if (token.startsWith('mock-jwt-')) {
        const parts = token.split('-');
        if (parts.length >= 3) {
          const userId = parseInt(parts[2]);
          req.user = {
            id: userId,
            email: `user${userId}@example.com`,
            role: 'user'
          };
        } else {
          throw new Error('Invalid mock token format');
        }
      } else {
        throw new Error('Invalid token format');
      }
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Authentication token has expired. Please login again.'
      });
    }
    
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      message: 'Invalid authentication token. Please login again.'
    });
  }
};

// Optional authentication middleware (for endpoints that can work with or without auth)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      if (jwt) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
      } else {
        // Mock token verification
        if (token.startsWith('mock-jwt-')) {
          const parts = token.split('-');
          if (parts.length >= 3) {
            const userId = parseInt(parts[2]);
            req.user = {
              id: userId,
              email: `user${userId}@example.com`,
              role: 'user'
            };
          }
        }
      }
    } catch (error) {
      // Token is invalid, but we continue without authentication
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
};
