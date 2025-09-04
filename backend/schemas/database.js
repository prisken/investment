// Database schemas for the Investment App
// This file defines the structure of our data models
// In production, these would be implemented with a real database (PostgreSQL, MongoDB, etc.)

// User Schema
const userSchema = {
  id: 'string', // Unique user ID
  email: 'string', // User email (unique)
  name: 'string', // User's full name
  password: 'string', // Hashed password
  createdAt: 'date', // Account creation date
  lastLogin: 'date', // Last login timestamp
  preferences: {
    notifications: 'boolean', // Push notification preferences
    darkMode: 'boolean', // UI theme preference
    autoRefresh: 'boolean', // Auto-refresh market data
    dataSync: 'boolean' // Cross-device data sync
  },
  subscription: {
    plan: 'string', // Free, Premium, Pro
    startDate: 'date',
    endDate: 'date',
    features: ['string'] // Array of enabled features
  }
};

// Stock Quote Schema
const stockQuoteSchema = {
  symbol: 'string', // Stock symbol (e.g., AAPL, 0700)
  name: 'string', // Company name
  price: 'number', // Current stock price
  change: 'number', // Price change from previous close
  changePercent: 'number', // Percentage change
  volume: 'number', // Trading volume
  marketCap: 'number', // Market capitalization
  pe: 'number', // Price-to-earnings ratio
  dividend: 'number', // Dividend yield
  dayHigh: 'number', // Day's highest price
  dayLow: 'number', // Day's lowest price
  open: 'number', // Opening price
  previousClose: 'number', // Previous closing price
  market: 'string', // Market (US or HK)
  lastUpdated: 'date', // Last update timestamp
  exchange: 'string', // Exchange name
  sector: 'string', // Company sector
  industry: 'string' // Company industry
};

// Market Index Schema
const marketIndexSchema = {
  symbol: 'string', // Index symbol (e.g., ^GSPC, ^HSI)
  name: 'string', // Index name
  price: 'number', // Current index value
  change: 'number', // Change from previous close
  changePercent: 'number', // Percentage change
  market: 'string', // Market (US or HK)
  lastUpdated: 'date', // Last update timestamp
  components: ['string'], // Array of component stock symbols
  description: 'string' // Index description
};

// Portfolio Schema
const portfolioSchema = {
  id: 'string', // Unique portfolio ID
  userId: 'string', // Reference to user
  name: 'string', // Portfolio name
  description: 'string', // Portfolio description
  totalValue: 'number', // Total portfolio value
  totalChange: 'number', // Total change in value
  totalChangePercent: 'number', // Percentage change
  createdAt: 'date', // Portfolio creation date
  lastUpdated: 'date', // Last update timestamp
  isActive: 'boolean', // Whether portfolio is active
  riskLevel: 'string', // Conservative, Moderate, Aggressive
  targetAllocation: {
    stocks: 'number', // Target percentage in stocks
    bonds: 'number', // Target percentage in bonds
    cash: 'number', // Target percentage in cash
    international: 'number' // Target percentage in international
  }
};

// Portfolio Holding Schema
const portfolioHoldingSchema = {
  id: 'string', // Unique holding ID
  portfolioId: 'string', // Reference to portfolio
  symbol: 'string', // Stock symbol
  name: 'string', // Company name
  shares: 'number', // Number of shares owned
  avgPrice: 'number', // Average purchase price
  currentPrice: 'number', // Current market price
  currentValue: 'number', // Current market value
  change: 'number', // Change in value
  changePercent: 'number', // Percentage change
  market: 'string', // Market (US or HK)
  sector: 'string', // Company sector
  purchaseDate: 'date', // First purchase date
  lastUpdated: 'date' // Last update timestamp
};

// Transaction Schema
const transactionSchema = {
  id: 'string', // Unique transaction ID
  portfolioId: 'string', // Reference to portfolio
  type: 'string', // buy, sell, dividend, split
  symbol: 'string', // Stock symbol
  shares: 'number', // Number of shares
  price: 'number', // Transaction price
  total: 'number', // Total transaction value
  market: 'string', // Market (US or HK)
  timestamp: 'date', // Transaction timestamp
  fees: 'number', // Transaction fees
  notes: 'string' // Additional notes
};

// Market Data Cache Schema
const marketDataCacheSchema = {
  symbol: 'string', // Stock or index symbol
  data: 'object', // Cached market data
  market: 'string', // Market (US or HK)
  type: 'string', // stock, index
  lastUpdated: 'date', // Last update timestamp
  expiresAt: 'date' // Cache expiration time
};

// News Article Schema
const newsArticleSchema = {
  id: 'string', // Unique article ID
  title: 'string', // Article title
  summary: 'string', // Article summary
  content: 'string', // Article content
  source: 'string', // News source
  url: 'string', // Article URL
  publishedAt: 'date', // Publication date
  relatedSymbols: ['string'], // Related stock symbols
  sentiment: 'string', // positive, negative, neutral
  category: 'string', // Market news, company news, etc.
  lastUpdated: 'date' // Last update timestamp
};

// Alert Schema
const alertSchema = {
  id: 'string', // Unique alert ID
  userId: 'string', // Reference to user
  type: 'string', // price, news, portfolio
  symbol: 'string', // Stock symbol (if applicable)
  condition: 'string', // Alert condition
  threshold: 'number', // Alert threshold
  isActive: 'boolean', // Whether alert is active
  createdAt: 'date', // Alert creation date
  lastTriggered: 'date', // Last time alert was triggered
  frequency: 'string' // once, daily, weekly
};

// Investment Recommendation Schema
const investmentRecommendationSchema = {
  id: 'string', // Unique recommendation ID
  userId: 'string', // Reference to user
  type: 'string', // buy, sell, hold
  symbol: 'string', // Stock symbol
  reason: 'string', // Reason for recommendation
  confidence: 'number', // Confidence level (0-100)
  targetPrice: 'number', // Target price
  timeHorizon: 'string', // short-term, medium-term, long-term
  riskLevel: 'string', // low, medium, high
  createdAt: 'date', // Recommendation creation date
  expiresAt: 'date', // Recommendation expiration date
  isFollowed: 'boolean' // Whether user followed recommendation
};

// Export all schemas
module.exports = {
  userSchema,
  stockQuoteSchema,
  marketIndexSchema,
  portfolioSchema,
  portfolioHoldingSchema,
  transactionSchema,
  marketDataCacheSchema,
  newsArticleSchema,
  alertSchema,
  investmentRecommendationSchema
};

// Database connection configuration (for future use)
const databaseConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'investment_app_dev',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    dialect: 'postgres',
    logging: true,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    ssl: true
  }
};

module.exports.databaseConfig = databaseConfig;
