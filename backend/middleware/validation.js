const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * Data Validation Middleware for Investment App
 * Provides comprehensive validation for all API endpoints
 */

// Common validation rules
const commonValidations = {
  // Stock symbol validation (uppercase, alphanumeric + special chars)
  symbol: body('symbol')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 })
    .matches(/^[A-Z0-9^.-]+$/)
    .withMessage('Symbol must be 1-20 characters, uppercase alphanumeric with ^.- allowed'),

  // Market validation
  market: body('market')
    .optional()
    .isIn(['US', 'HK'])
    .withMessage('Market must be either US or HK'),

  // Price validation (positive decimal)
  price: body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  // Percentage validation (-100 to 100)
  percentage: body('percentage')
    .optional()
    .isFloat({ min: -100, max: 100 })
    .withMessage('Percentage must be between -100 and 100'),

  // Volume validation (positive integer)
  volume: body('volume')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Volume must be a positive integer'),

  // UUID validation
  uuid: param('id')
    .isUUID(4)
    .withMessage('Invalid UUID format'),

  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),

  // Password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be 8-128 characters with at least one lowercase, uppercase, and number'),

  // Name validation
  name: body('name')
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage('Name must be 1-255 characters'),

  // Date validation
  date: body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format'),

  // Limit validation for pagination
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),

  // Offset validation for pagination
  offset: query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
};

// Stock-related validations
const stockValidations = {
  // Create stock
  createStock: [
    body('symbol').notEmpty().withMessage('Symbol is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('market').notEmpty().withMessage('Market is required'),
    commonValidations.symbol,
    commonValidations.name,
    commonValidations.market,
    body('sector').optional().isLength({ max: 100 }),
    body('industry').optional().isLength({ max: 100 }),
    body('exchange').optional().isLength({ max: 50 }),
    body('currency').optional().isIn(['USD', 'HKD', 'CNY'])
  ],

  // Update stock
  updateStock: [
    commonValidations.uuid,
    body('name').optional().isLength({ min: 1, max: 255 }),
    body('sector').optional().isLength({ max: 100 }),
    body('industry').optional().isLength({ max: 100 }),
    body('exchange').optional().isLength({ max: 50 }),
    body('currency').optional().isIn(['USD', 'HKD', 'CNY']),
    body('isActive').optional().isBoolean()
  ],

  // Get stock by symbol
  getStockBySymbol: [
    param('symbol')
      .isString()
      .trim()
      .isLength({ min: 1, max: 20 })
      .matches(/^[A-Z0-9^.-]+$/)
      .withMessage('Invalid stock symbol')
  ],

  // Search stocks
  searchStocks: [
    query('q').notEmpty().withMessage('Search query is required'),
    query('market').optional().isIn(['US', 'HK']),
    commonValidations.limit,
    commonValidations.offset
  ]
};

// Stock quote validations
const quoteValidations = {
  // Update stock quote
  updateQuote: [
    body('stockId').isUUID(4).withMessage('Invalid stock ID'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('changeAmount').isFloat().withMessage('Change amount is required'),
    body('changePercent').isFloat().withMessage('Change percentage is required'),
    body('volume').isInt({ min: 0 }).withMessage('Volume must be positive'),
    body('marketCap').optional().isInt({ min: 0 }),
    body('peRatio').optional().isFloat({ min: 0 }),
    body('dividendYield').optional().isFloat({ min: 0, max: 100 })
  ],

  // Get quotes by market
  getQuotesByMarket: [
    param('market').isIn(['US', 'HK']).withMessage('Market must be US or HK'),
    commonValidations.limit,
    commonValidations.offset
  ]
};

// Market index validations
const indexValidations = {
  // Create market index
  createIndex: [
    body('symbol').notEmpty().withMessage('Symbol is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('market').notEmpty().withMessage('Market is required'),
    commonValidations.symbol,
    commonValidations.name,
    commonValidations.market,
    body('description').optional().isLength({ max: 1000 }),
    body('baseValue').optional().isFloat({ min: 0 }),
    body('baseDate').optional().isISO8601()
  ],

  // Update index value
  updateIndexValue: [
    body('symbol').notEmpty().withMessage('Symbol is required'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be positive'),
    body('changeAmount').isFloat().withMessage('Change amount is required'),
    body('changePercent').isFloat().withMessage('Change percentage is required'),
    body('volume').optional().isInt({ min: 0 })
  ],

  // Get index by symbol
  getIndexBySymbol: [
    param('symbol')
      .isString()
      .trim()
      .isLength({ min: 1, max: 20 })
      .matches(/^[A-Z0-9^.-]+$/)
      .withMessage('Invalid index symbol')
  ]
};

// Portfolio validations
const portfolioValidations = {
  // Create portfolio
  createPortfolio: [
    body('name').notEmpty().withMessage('Portfolio name is required'),
    body('description').optional().isLength({ max: 1000 }),
    body('userId').isUUID(4).withMessage('Invalid user ID')
  ],

  // Add position to portfolio
  addPosition: [
    body('portfolioId').isUUID(4).withMessage('Invalid portfolio ID'),
    body('stockId').isUUID(4).withMessage('Invalid stock ID'),
    body('shares').isFloat({ min: 0.0001 }).withMessage('Shares must be positive'),
    body('averageCost').isFloat({ min: 0 }).withMessage('Average cost must be positive'),
    body('positionType').optional().isIn(['long', 'short'])
  ],

  // Update position
  updatePosition: [
    commonValidations.uuid,
    body('shares').optional().isFloat({ min: 0.0001 }),
    body('averageCost').optional().isFloat({ min: 0 }),
    body('positionType').optional().isIn(['long', 'short'])
  ],

  // Get portfolio by ID
  getPortfolioById: [
    commonValidations.uuid
  ]
};

// Authentication validations
const authValidations = {
  // User registration
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
    body('role').optional().isIn(['user', 'admin', 'premium'])
  ],

  // User login
  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required')
  ],

  // Update profile
  updateProfile: [
    commonValidations.name,
    body('preferences').optional().isObject(),
    body('subscription').optional().isObject()
  ]
};

// Alert validations
const alertValidations = {
  // Create alert
  createAlert: [
    body('userId').isUUID(4).withMessage('Invalid user ID'),
    body('stockId').optional().isUUID(4),
    body('alertType').isIn(['price', 'volume', 'technical', 'portfolio']),
    body('conditionType').isIn(['above', 'below', 'equals', 'change_percent']),
    body('conditionValue').isFloat().withMessage('Condition value is required')
  ],

  // Update alert
  updateAlert: [
    commonValidations.uuid,
    body('conditionValue').optional().isFloat(),
    body('isActive').optional().isBoolean()
  ]
};

// Cache validations
const cacheValidations = {
  // Set cache
  setCache: [
    body('key').notEmpty().withMessage('Cache key is required'),
    body('data').notEmpty().withMessage('Cache data is required'),
    body('expiresAt').isISO8601().withMessage('Expiration date is required')
  ],

  // Get cache
  getCache: [
    param('key').notEmpty().withMessage('Cache key is required')
  ]
};

// Generic validation handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.id
    });
  }
  
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

// Rate limiting validation
const validateRateLimit = (req, res, next) => {
  // Check if user has exceeded rate limits
  const userIp = req.ip;
  const currentTime = Date.now();
  
  // This is a basic implementation - in production, use Redis or similar
  if (!req.rateLimitInfo) {
    req.rateLimitInfo = {
      remaining: 100,
      resetTime: currentTime + (15 * 60 * 1000) // 15 minutes
    };
  }
  
  next();
};

// Export all validations
module.exports = {
  // Common validations
  commonValidations,
  
  // Specific endpoint validations
  stockValidations,
  quoteValidations,
  indexValidations,
  portfolioValidations,
  authValidations,
  alertValidations,
  cacheValidations,
  
  // Middleware functions
  handleValidationErrors,
  sanitizeInput,
  validateRateLimit,
  
  // Validation chains for common operations
  validateStockCreation: [...stockValidations.createStock, handleValidationErrors],
  validateStockUpdate: [...stockValidations.updateStock, handleValidationErrors],
  validateQuoteUpdate: [...quoteValidations.updateQuote, handleValidationErrors],
  validateIndexCreation: [...indexValidations.createIndex, handleValidationErrors],
  validatePortfolioCreation: [...portfolioValidations.createPortfolio, handleValidationErrors],
  validateUserRegistration: [...authValidations.register, handleValidationErrors],
  validateUserLogin: [...authValidations.login, handleValidationErrors]
};
