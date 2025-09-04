const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import custom middleware and utilities
const { errorHandler, notFound } = require('../middleware/errorHandler');
const { requestLogger } = require('../utils/logger');
const database = require('../config/database');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

// Enhanced rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 API requests per windowMs
  message: 'API rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Custom middleware
app.use(requestLogger); // Request logging
app.use(morgan('combined')); // HTTP request logging

// Apply rate limiting
app.use('/api/auth', authLimiter); // Stricter limits for auth endpoints
app.use('/api', apiLimiter); // Standard limits for API endpoints
app.use('/', generalLimiter); // General limits for all other endpoints

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    
    res.status(200).json({
      status: 'OK',
      message: 'Investment App Backend is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    res.status(200).json(dbHealth);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// WebSocket connection handling
const connectedClients = new Set();
const subscribedStocks = new Set();
const subscribedMarketIndices = new Set();

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  connectedClients.add(socket.id);

  // Handle stock subscriptions
  socket.on('subscribe-stocks', (symbols) => {
    console.log(`📡 Client ${socket.id} subscribed to stocks:`, symbols);
    symbols.forEach(symbol => subscribedStocks.add(symbol));
    socket.join('stocks');
  });

  socket.on('unsubscribe-stocks', (symbols) => {
    console.log(`📡 Client ${socket.id} unsubscribed from stocks:`, symbols);
    symbols.forEach(symbol => subscribedStocks.delete(symbol));
    socket.leave('stocks');
  });

  // Handle market indices subscriptions
  socket.on('subscribe-market-indices', () => {
    console.log(`📡 Client ${socket.id} subscribed to market indices`);
    subscribedMarketIndices.add(socket.id);
    socket.join('market-indices');
  });

  socket.on('unsubscribe-market-indices', () => {
    console.log(`📡 Client ${socket.id} unsubscribed from market indices`);
    subscribedMarketIndices.delete(socket.id);
    socket.leave('market-indices');
  });

  // Handle data refresh requests
  socket.on('request-refresh', async (type) => {
    console.log(`🔄 Client ${socket.id} requested refresh for:`, type);
    try {
      if (type === 'stocks' || type === 'all') {
        await broadcastStockUpdates();
      }
      if (type === 'market' || type === 'all') {
        await broadcastMarketUpdates();
      }
    } catch (error) {
      console.error('Error handling refresh request:', error);
      socket.emit('error', 'Failed to refresh data');
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
    subscribedMarketIndices.delete(socket.id);
  });
});

// Real-time data broadcasting functions
async function broadcastStockUpdates() {
  if (subscribedStocks.size === 0) return;

  try {
    const symbols = Array.from(subscribedStocks);
    const marketEnhanced = require('../routes/market-enhanced');
    
    // Get batch quotes for all subscribed stocks
    const batchQuotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const response = await fetch(`http://localhost:${PORT}/api/market/enhanced/quote/${symbol}`);
          const data = await response.json();
          return data.success ? data.data : null;
        } catch (error) {
          console.error(`Error fetching quote for ${symbol}:`, error);
          return null;
        }
      })
    );

    const validQuotes = batchQuotes.filter(quote => quote !== null);
    
    if (validQuotes.length > 0) {
      io.to('stocks').emit('batch-stock-update', validQuotes);
      console.log(`📊 Broadcasted ${validQuotes.length} stock updates`);
    }
  } catch (error) {
    console.error('Error broadcasting stock updates:', error);
  }
}

async function broadcastMarketUpdates() {
  if (subscribedMarketIndices.size === 0) return;

  try {
    const response = await fetch(`http://localhost:${PORT}/api/market/enhanced/overview`);
    const data = await response.json();
    
    if (data.success) {
      io.to('market-indices').emit('market-update', data.data);
      console.log('📊 Broadcasted market indices update');
    }
  } catch (error) {
    console.error('Error broadcasting market updates:', error);
  }
}

// Set up periodic data broadcasting
setInterval(broadcastStockUpdates, 30000); // Every 30 seconds
setInterval(broadcastMarketUpdates, 60000); // Every 60 seconds

// Routes
app.use('/api/market', require('../routes/market'));
app.use('/api/market/enhanced', require('../routes/market-enhanced'));
app.use('/api/data-processing', require('../routes/data-processing'));
app.use('/api/stocks', require('../routes/stocks'));
app.use('/api/portfolio', require('../routes/portfolio'));
app.use('/api/auth', require('../routes/auth'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Investment App Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      database: '/health/db',
      market: '/api/market',
      'market-enhanced': '/api/market/enhanced',
      stocks: '/api/stocks',
      portfolio: '/api/portfolio',
      auth: '/api/auth'
    },
    enhanced_features: {
      'real-time-quotes': '/api/market/enhanced/quote/:symbol',
      'batch-quotes': '/api/market/enhanced/batch-quotes',
      'market-indices': '/api/market/enhanced/indices',
      'market-overview': '/api/market/enhanced/overview',
      'company-info': '/api/market/enhanced/company/:symbol',
      'sector-performance': '/api/market/enhanced/sectors',
      'service-status': '/api/market/enhanced/status',
      'stock-search': '/api/market/enhanced/search?q=:query',
      'popular-stocks': '/api/market/enhanced/popular/:market'
    },
    data_processing: {
      'normalize': '/api/data-processing/normalize',
      'historical': '/api/data-processing/historical/:symbol',
      'aggregated': '/api/data-processing/aggregated/:symbol',
      'stream': '/api/data-processing/stream/:symbol',
      'validate': '/api/data-processing/validate',
      'cache-stats': '/api/data-processing/cache/stats',
      'cache-cleanup': '/api/data-processing/cache/cleanup',
      'status': '/api/data-processing/status'
    },
    documentation: '/api/docs'
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await database.initializeDatabase();
    console.log('✅ Database connected successfully');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Investment App Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Database health: http://localhost:${PORT}/health/db`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 Logs: Check ./logs/ directory for detailed logs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
