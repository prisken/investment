/**
 * Enhanced Market Routes using MarketDataService
 * Provides real-time market data with smart API fallback
 */

const express = require('express');
const router = express.Router();
const MarketDataService = require('../services/MarketDataService');
const { logger } = require('../utils/logger');
const { validateStockSymbol } = require('../middleware/validation');

// Initialize market data service
const marketDataService = new MarketDataService();

/**
 * @route GET /api/market/enhanced/quote/:symbol
 * @desc Get real-time stock quote with smart API selection
 * @access Public
 */
router.get('/quote/:symbol', validateStockSymbol, async (req, res) => {
  try {
    const { symbol } = req.params;
    const startTime = Date.now();
    
    logger.info(`Fetching real-time quote for ${symbol}`);
    
    const quote = await marketDataService.getStockQuote(symbol.toUpperCase());
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: quote,
      meta: {
        symbol: symbol.toUpperCase(),
        source: quote.source,
        cached: false,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Quote fetched for ${symbol} in ${duration}ms from ${quote.source}`);
    
  } catch (error) {
    logger.error(`Failed to fetch quote for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch stock quote',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/market/enhanced/batch-quotes
 * @desc Get batch quotes for multiple symbols
 * @access Public
 */
router.post('/batch-quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Symbols array is required',
          details: 'Please provide an array of stock symbols'
        }
      });
    }
    
    if (symbols.length > 10) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Too many symbols',
          details: 'Maximum 10 symbols allowed per request'
        }
      });
    }
    
    const startTime = Date.now();
    logger.info(`Fetching batch quotes for ${symbols.length} symbols`);
    
    const quotes = await marketDataService.getBatchQuotes(symbols.map(s => s.toUpperCase()));
    
    const duration = Date.now() - startTime;
    const successCount = Object.values(quotes).filter(q => !q.error).length;
    
    res.json({
      success: true,
      data: quotes,
      meta: {
        requested: symbols.length,
        successful: successCount,
        failed: symbols.length - successCount,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Batch quotes completed: ${successCount}/${symbols.length} successful in ${duration}ms`);
    
  } catch (error) {
    logger.error('Failed to fetch batch quotes:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch batch quotes',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/market/enhanced/indices
 * @desc Get real-time market indices (S&P 500, Dow Jones, NASDAQ)
 * @access Public
 */
router.get('/indices', async (req, res) => {
  try {
    const startTime = Date.now();
    logger.info('Fetching market indices');
    
    const indices = await marketDataService.getMarketIndices();
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: indices,
      meta: {
        count: Object.keys(indices).length,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Market indices fetched in ${duration}ms`);
    
  } catch (error) {
    logger.error('Failed to fetch market indices:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch market indices',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/market/enhanced/overview
 * @desc Get comprehensive market overview with indices and sectors
 * @access Public
 */
router.get('/overview', async (req, res) => {
  try {
    const startTime = Date.now();
    logger.info('Fetching market overview');
    
    const overview = await marketDataService.getMarketOverview();
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: overview,
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Market overview fetched in ${duration}ms`);
    
  } catch (error) {
    logger.error('Failed to fetch market overview:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch market overview',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/market/enhanced/company/:symbol
 * @desc Get company information and fundamentals
 * @access Public
 */
router.get('/company/:symbol', validateStockSymbol, async (req, res) => {
  try {
    const { symbol } = req.params;
    const startTime = Date.now();
    
    logger.info(`Fetching company info for ${symbol}`);
    
    const companyInfo = await marketDataService.getCompanyInfo(symbol.toUpperCase());
    
    if (!companyInfo) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Company information not found',
          details: `No data available for ${symbol}`
        },
        timestamp: new Date().toISOString()
      });
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: companyInfo,
      meta: {
        symbol: symbol.toUpperCase(),
        source: companyInfo.source,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Company info fetched for ${symbol} in ${duration}ms`);
    
  } catch (error) {
    logger.error(`Failed to fetch company info for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch company information',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/market/enhanced/sectors
 * @desc Get sector performance data
 * @access Public
 */
router.get('/sectors', async (req, res) => {
  try {
    const startTime = Date.now();
    logger.info('Fetching sector performance');
    
    const sectors = await marketDataService.getSectorPerformance();
    
    if (!sectors) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Sector performance data not available',
          details: 'Data may be temporarily unavailable'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: sectors,
      meta: {
        count: sectors.length,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Sector performance fetched in ${duration}ms`);
    
  } catch (error) {
    logger.error('Failed to fetch sector performance:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch sector performance',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/market/enhanced/status
 * @desc Get service health and rate limit status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = marketDataService.getServiceStatus();
    
    res.json({
      success: true,
      data: status,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Failed to get service status:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get service status',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/market/enhanced/search
 * @desc Search for stocks by symbol or company name
 * @access Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Search query required',
          details: 'Please provide a search term (minimum 2 characters)'
        }
      });
    }
    
    const startTime = Date.now();
    logger.info(`Searching for stocks with query: ${q}`);
    
    // For now, return popular stocks that match the query
    // In production, you'd integrate with a search API
    const popularStocks = [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
      'JPM', 'JNJ', 'PG', 'UNH', 'HD', 'MA', 'V', 'PYPL'
    ];
    
    const matches = popularStocks
      .filter(symbol => symbol.toLowerCase().includes(q.toLowerCase()))
      .slice(0, parseInt(limit));
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        query: q,
        results: matches,
        total: matches.length
      },
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Search completed for "${q}" in ${duration}ms`);
    
  } catch (error) {
    logger.error('Search failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Search failed',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/market/enhanced/popular/:market
 * @desc Get popular stocks for a specific market
 * @access Public
 */
router.get('/popular/:market', async (req, res) => {
  try {
    const { market } = req.params;
    const { limit = 10 } = req.query;
    
    if (!['US', 'HK'].includes(market.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid market',
          details: 'Market must be either US or HK'
        }
      });
    }
    
    const startTime = Date.now();
    logger.info(`Fetching popular ${market} stocks`);
    
    // Popular US stocks
    const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'JNJ'];
    
    // Popular HK stocks
    const hkStocks = ['0700', '0941', '1299', '2318', '3988', '1398', '2628', '0939', '3988', '1398'];
    
    const symbols = market.toUpperCase() === 'US' ? usStocks : hkStocks;
    const selectedSymbols = symbols.slice(0, parseInt(limit));
    
    // Get quotes for selected symbols
    const quotes = await marketDataService.getBatchQuotes(selectedSymbols);
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        market: market.toUpperCase(),
        stocks: quotes,
        total: selectedSymbols.length
      },
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Popular ${market} stocks fetched in ${duration}ms`);
    
  } catch (error) {
    logger.error(`Failed to fetch popular ${req.params.market} stocks:`, error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch popular stocks',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
