/**
 * Data Processing Routes for Investment App
 * Provides endpoints for price normalization, historical aggregation, streaming, validation, and caching
 */

const express = require('express');
const router = express.Router();
const DataProcessingService = require('../services/DataProcessingService');
const MarketDataService = require('../services/MarketDataService');
const { logger } = require('../utils/logger');
const { validateStockSymbol } = require('../middleware/validation');

// Initialize services
const dataProcessingService = new DataProcessingService();
const marketDataService = new MarketDataService();

/**
 * @route POST /api/data-processing/normalize
 * @desc Normalize and validate raw market data
 * @access Public
 */
router.post('/normalize', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Data array is required',
          details: 'Please provide an array of market data objects'
        }
      });
    }
    
    if (data.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Too many data points',
          details: 'Maximum 100 data points allowed per request'
        }
      });
    }
    
    const startTime = Date.now();
    logger.info(`Normalizing ${data.length} data points`);
    
    const results = [];
    const errors = [];
    
    for (const item of data) {
      try {
        const normalized = dataProcessingService.normalizePriceData(item);
        results.push(normalized);
        
        // Store in history for future use
        dataProcessingService.storePriceData(normalized.symbol, normalized);
        
      } catch (error) {
        errors.push({
          original: item,
          error: error.message
        });
        logger.warn(`Failed to normalize data for ${item.symbol}:`, error.message);
      }
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        normalized: results,
        errors,
        summary: {
          total: data.length,
          successful: results.length,
          failed: errors.length,
          successRate: ((results.length / data.length) * 100).toFixed(2) + '%'
        }
      },
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Data normalization completed: ${results.length}/${data.length} successful in ${duration}ms`);
    
  } catch (error) {
    logger.error('Data normalization failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Data normalization failed',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/data-processing/historical/:symbol
 * @desc Get historical price data for a symbol
 * @access Public
 */
router.get('/historical/:symbol', validateStockSymbol, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1d', limit = 100 } = req.query;
    
    // Validate period parameter
    const validPeriods = ['1h', '1d', '1w', '1m', 'all'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid period',
          details: `Period must be one of: ${validPeriods.join(', ')}`
        }
      });
    }
    
    // Validate limit parameter
    const numLimit = parseInt(limit);
    if (isNaN(numLimit) || numLimit < 1 || numLimit > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid limit',
          details: 'Limit must be between 1 and 1000'
        }
      });
    }
    
    const startTime = Date.now();
    logger.info(`Fetching historical data for ${symbol} (${period}, limit: ${numLimit})`);
    
    const historicalData = dataProcessingService.getHistoricalData(symbol, period, numLimit);
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        period,
        limit: numLimit,
        dataPoints: historicalData.length,
        data: historicalData
      },
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Historical data fetched for ${symbol}: ${historicalData.length} points in ${duration}ms`);
    
  } catch (error) {
    logger.error(`Failed to fetch historical data for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch historical data',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/data-processing/aggregated/:symbol
 * @desc Get aggregated historical data for a symbol
 * @access Public
 */
router.get('/aggregated/:symbol', validateStockSymbol, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1d', aggregation = '1h' } = req.query;
    
    // Validate period parameter
    const validPeriods = ['1h', '1d', '1w', '1m'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid period',
          details: `Period must be one of: ${validPeriods.join(', ')}`
        }
      });
    }
    
    // Validate aggregation parameter
    const validAggregations = ['1m', '5m', '15m', '1h', '1d'];
    if (!validAggregations.includes(aggregation)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid aggregation',
          details: `Aggregation must be one of: ${validAggregations.join(', ')}`
        }
      });
    }
    
    const startTime = Date.now();
    logger.info(`Fetching aggregated data for ${symbol} (${period}, ${aggregation})`);
    
    const aggregatedData = dataProcessingService.aggregateHistoricalData(symbol, period, aggregation);
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        period,
        aggregation,
        dataPoints: aggregatedData.length,
        data: aggregatedData
      },
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Aggregated data fetched for ${symbol}: ${aggregatedData.length} points in ${duration}ms`);
    
  } catch (error) {
    logger.error(`Failed to fetch aggregated data for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch aggregated data',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/data-processing/stream/:symbol
 * @desc Set up real-time data streaming for a symbol
 * @access Public
 */
router.post('/stream/:symbol', validateStockSymbol, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { callbackUrl, interval = 5000 } = req.body;
    
    if (!callbackUrl) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Callback URL required',
          details: 'Please provide a callback URL for data streaming'
        }
      });
    }
    
    // Validate interval (minimum 1 second)
    const numInterval = parseInt(interval);
    if (isNaN(numInterval) || numInterval < 1000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid interval',
          details: 'Interval must be at least 1000ms (1 second)'
        }
      });
    }
    
    logger.info(`Setting up data stream for ${symbol} with ${numInterval}ms interval`);
    
    // Set up the data stream
    const stream = dataProcessingService.setupDataStream(symbol, (data) => {
      // In a real implementation, you'd send this to the callback URL
      logger.debug(`Streaming data for ${symbol}: ${data.price}`);
    });
    
    // Start periodic data fetching
    const fetchInterval = setInterval(async () => {
      try {
        const quote = await marketDataService.getStockQuote(symbol);
        if (quote) {
          const normalized = dataProcessingService.normalizePriceData(quote);
          dataProcessingService.storePriceData(symbol, normalized);
        }
      } catch (error) {
        logger.warn(`Failed to fetch stream data for ${symbol}:`, error.message);
      }
    }, numInterval);
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        streamId: stream.symbol,
        interval: numInterval,
        callbackUrl,
        status: 'active'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Data stream setup completed for ${symbol}`);
    
  } catch (error) {
    logger.error(`Failed to setup data stream for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to setup data stream',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route DELETE /api/data-processing/stream/:symbol
 * @desc Stop real-time data streaming for a symbol
 * @access Public
 */
router.delete('/stream/:symbol', validateStockSymbol, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    logger.info(`Stopping data stream for ${symbol}`);
    
    // In a real implementation, you'd stop the specific stream
    // For now, we'll just acknowledge the request
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        status: 'stopped'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Data stream stopped for ${symbol}`);
    
  } catch (error) {
    logger.error(`Failed to stop data stream for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to stop data stream',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/data-processing/validate
 * @desc Validate market data against rules
 * @access Public
 */
router.post('/validate', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Data is required',
          details: 'Please provide data to validate'
        }
      });
    }
    
    const startTime = Date.now();
    logger.info('Validating market data');
    
    let validationResult;
    if (Array.isArray(data)) {
      // Validate array of data points
      const results = data.map(item => {
        try {
          return dataProcessingService.validateData(item);
        } catch (error) {
          return {
            isValid: false,
            errors: [error.message],
            data: item
          };
        }
      });
      
      validationResult = {
        type: 'array',
        total: data.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length,
        results
      };
    } else {
      // Validate single data point
      validationResult = dataProcessingService.validateData(data);
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: validationResult,
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Data validation completed in ${duration}ms`);
    
  } catch (error) {
    logger.error('Data validation failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Data validation failed',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/data-processing/cache/stats
 * @desc Get cache statistics and performance metrics
 * @access Public
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const startTime = Date.now();
    logger.info('Fetching cache statistics');
    
    const cacheStats = dataProcessingService.getCacheStats();
    const serviceStats = dataProcessingService.getServiceStats();
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        cache: cacheStats,
        service: serviceStats
      },
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Cache statistics fetched in ${duration}ms`);
    
  } catch (error) {
    logger.error('Failed to fetch cache statistics:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch cache statistics',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/data-processing/cache/cleanup
 * @desc Clean up expired cache entries
 * @access Public
 */
router.post('/cache/cleanup', async (req, res) => {
  try {
    const startTime = Date.now();
    logger.info('Starting cache cleanup');
    
    dataProcessingService.cleanupCache();
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        message: 'Cache cleanup completed',
        duration: `${duration}ms`
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    
    logger.info(`Cache cleanup completed in ${duration}ms`);
    
  } catch (error) {
    logger.error('Cache cleanup failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Cache cleanup failed',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/data-processing/status
 * @desc Get data processing service status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const serviceStats = dataProcessingService.getServiceStats();
    
    res.json({
      success: true,
      data: {
        status: 'operational',
        uptime: process.uptime(),
        stats: serviceStats
      },
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

module.exports = router;
