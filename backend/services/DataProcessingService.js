/**
 * Data Processing Service for Investment App
 * Handles price normalization, historical aggregation, streaming, validation, and caching
 */

const { logger } = require('../utils/logger');

class DataProcessingService {
  constructor() {
    this.priceHistory = new Map(); // In-memory price history (in production, use Redis/DB)
    this.dataStreams = new Map(); // Active data streams
    this.validationRules = this.initializeValidationRules();
    this.cacheLayers = {
      price: new Map(),
      historical: new Map(),
      aggregated: new Map(),
      technical: new Map()
    };
    
    // Cache expiry times (in milliseconds)
    this.cacheExpiry = {
      price: 60000,        // 1 minute
      historical: 300000,  // 5 minutes
      aggregated: 600000,  // 10 minutes
      technical: 300000    // 5 minutes
    };
    
    // Data normalization settings
    this.normalizationSettings = {
      pricePrecision: 4,
      volumePrecision: 0,
      percentagePrecision: 2,
      currency: 'USD',
      timezone: 'UTC'
    };
  }

  /**
   * Initialize validation rules for different data types
   */
  initializeValidationRules() {
    return {
      price: {
        min: 0.01,
        max: 1000000,
        required: true
      },
      volume: {
        min: 0,
        max: 1000000000000,
        required: true
      },
      change: {
        min: -1000000,
        max: 1000000,
        required: false
      },
      changePercent: {
        min: -100,
        max: 1000,
        required: false
      },
      timestamp: {
        required: true,
        maxAge: 300000 // 5 minutes
      }
    };
  }

  /**
   * Normalize price data to consistent format
   */
  normalizePriceData(rawData) {
    try {
      const normalized = {
        symbol: rawData.symbol?.toUpperCase(),
        price: this.normalizePrice(rawData.price),
        change: this.normalizeChange(rawData.change),
        changePercent: this.normalizePercentage(rawData.changePercent),
        volume: this.normalizeVolume(rawData.volume),
        high: this.normalizePrice(rawData.high),
        low: this.normalizePrice(rawData.low),
        open: this.normalizePrice(rawData.open),
        previousClose: this.normalizePrice(rawData.previousClose),
        source: rawData.source,
        timestamp: this.normalizeTimestamp(rawData.timestamp),
        normalizedAt: new Date()
      };

      // Validate normalized data
      const validation = this.validateData(normalized);
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      return normalized;
    } catch (error) {
      logger.error('Price data normalization failed:', error.message);
      throw error;
    }
  }

  /**
   * Normalize price to specified precision
   */
  normalizePrice(price) {
    if (price === null || price === undefined) return null;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return null;
    return parseFloat(numPrice.toFixed(this.normalizationSettings.pricePrecision));
  }

  /**
   * Normalize change amount
   */
  normalizeChange(change) {
    if (change === null || change === undefined) return 0;
    const numChange = parseFloat(change);
    if (isNaN(numChange)) return 0;
    return parseFloat(numChange.toFixed(this.normalizationSettings.pricePrecision));
  }

  /**
   * Normalize percentage values
   */
  normalizePercentage(percentage) {
    if (percentage === null || percentage === undefined) return 0;
    const numPercentage = parseFloat(percentage);
    if (isNaN(numPercentage)) return 0;
    return parseFloat(numPercentage.toFixed(this.normalizationSettings.percentagePrecision));
  }

  /**
   * Normalize volume data
   */
  normalizeVolume(volume) {
    if (volume === null || volume === undefined) return 0;
    const numVolume = parseInt(volume);
    if (isNaN(numVolume)) return 0;
    return Math.max(0, numVolume);
  }

  /**
   * Normalize timestamp
   */
  normalizeTimestamp(timestamp) {
    if (!timestamp) return new Date();
    
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = new Date();
    }
    
    // Check if timestamp is too old
    const now = new Date();
    const maxAge = this.validationRules.timestamp.maxAge;
    if (now - date > maxAge) {
      logger.warn(`Timestamp too old: ${date}, using current time`);
      return now;
    }
    
    return date;
  }

  /**
   * Validate data against rules
   */
  validateData(data) {
    const errors = [];
    
    // Price validation
    if (this.validationRules.price.required && data.price === null) {
      errors.push('Price is required');
    } else if (data.price !== null) {
      if (data.price < this.validationRules.price.min || data.price > this.validationRules.price.max) {
        errors.push(`Price must be between ${this.validationRules.price.min} and ${this.validationRules.price.max}`);
      }
    }
    
    // Volume validation
    if (this.validationRules.volume.required && data.volume === null) {
      errors.push('Volume is required');
    } else if (data.volume !== null) {
      if (data.volume < this.validationRules.volume.min || data.volume > this.validationRules.volume.max) {
        errors.push(`Volume must be between ${this.validationRules.volume.min} and ${this.validationRules.volume.max}`);
      }
    }
    
    // Change validation
    if (data.change !== null && data.change !== 0) {
      if (data.change < this.validationRules.change.min || data.change > this.validationRules.change.max) {
        errors.push(`Change must be between ${this.validationRules.change.min} and ${this.validationRules.change.max}`);
      }
    }
    
    // Change percentage validation
    if (data.changePercent !== null && data.changePercent !== 0) {
      if (data.changePercent < this.validationRules.changePercent.min || data.changePercent > this.validationRules.changePercent.max) {
        errors.push(`Change percentage must be between ${this.validationRules.changePercent.min}% and ${this.validationRules.changePercent.max}%`);
      }
    }
    
    // Timestamp validation
    if (this.validationRules.timestamp.required && !data.timestamp) {
      errors.push('Timestamp is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data
    };
  }

  /**
   * Store price data in history
   */
  storePriceData(symbol, normalizedData) {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol);
    history.push(normalizedData);
    
    // Keep only last 1000 data points per symbol
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    // Update cache
    this.updateCache('price', symbol, normalizedData);
    
    // Emit to data streams
    this.emitToStreams(symbol, normalizedData);
    
    logger.debug(`Stored price data for ${symbol}: ${normalizedData.price}`);
  }

  /**
   * Get historical price data
   */
  getHistoricalData(symbol, period = '1d', limit = 100) {
    const cacheKey = `historical_${symbol}_${period}_${limit}`;
    const cached = this.getCachedData('historical', cacheKey);
    if (cached) return cached;
    
    if (!this.priceHistory.has(symbol)) {
      return [];
    }
    
    const history = this.priceHistory.get(symbol);
    const now = new Date();
    
    let filteredHistory;
    switch (period) {
      case '1h':
        const oneHourAgo = new Date(now - 60 * 60 * 1000);
        filteredHistory = history.filter(h => h.timestamp >= oneHourAgo);
        break;
      case '1d':
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        filteredHistory = history.filter(h => h.timestamp >= oneDayAgo);
        break;
      case '1w':
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        filteredHistory = history.filter(h => h.timestamp >= oneWeekAgo);
        break;
      case '1m':
        const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        filteredHistory = history.filter(h => h.timestamp >= oneMonthAgo);
        break;
      default:
        filteredHistory = history;
    }
    
    const result = filteredHistory.slice(-limit);
    this.setCachedData('historical', cacheKey, result, this.cacheExpiry.historical);
    
    return result;
  }

  /**
   * Aggregate historical data
   */
  aggregateHistoricalData(symbol, period = '1d', aggregation = '1h') {
    const cacheKey = `aggregated_${symbol}_${period}_${aggregation}`;
    const cached = this.getCachedData('aggregated', cacheKey);
    if (cached) return cached;
    
    const historicalData = this.getHistoricalData(symbol, period, 1000);
    if (historicalData.length === 0) return [];
    
    const aggregated = [];
    const grouped = this.groupDataByTime(historicalData, aggregation);
    
    for (const [timeKey, dataPoints] of grouped) {
      const aggregatedPoint = {
        timestamp: new Date(timeKey),
        open: dataPoints[0].price,
        high: Math.max(...dataPoints.map(d => d.high || d.price)),
        low: Math.min(...dataPoints.map(d => d.low || d.price)),
        close: dataPoints[dataPoints.length - 1].price,
        volume: dataPoints.reduce((sum, d) => sum + (d.volume || 0), 0),
        change: dataPoints[dataPoints.length - 1].price - dataPoints[0].price,
        changePercent: ((dataPoints[dataPoints.length - 1].price - dataPoints[0].price) / dataPoints[0].price) * 100,
        dataPoints: dataPoints.length
      };
      
      aggregated.push(aggregatedPoint);
    }
    
    this.setCachedData('aggregated', cacheKey, aggregated, this.cacheExpiry.aggregated);
    return aggregated;
  }

  /**
   * Group data by time intervals
   */
  groupDataByTime(data, interval) {
    const grouped = new Map();
    
    for (const point of data) {
      const timeKey = this.getTimeKey(point.timestamp, interval);
      if (!grouped.has(timeKey)) {
        grouped.set(timeKey, []);
      }
      grouped.get(timeKey).push(point);
    }
    
    return grouped;
  }

  /**
   * Get time key for grouping
   */
  getTimeKey(timestamp, interval) {
    const date = new Date(timestamp);
    
    switch (interval) {
      case '1m':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()).getTime();
      case '5m':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), Math.floor(date.getMinutes() / 5) * 5).getTime();
      case '15m':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), Math.floor(date.getMinutes() / 15) * 15).getTime();
      case '1h':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
      case '1d':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      default:
        return date.getTime();
    }
  }

  /**
   * Set up real-time data streaming
   */
  setupDataStream(symbol, callback) {
    if (!this.dataStreams.has(symbol)) {
      this.dataStreams.set(symbol, new Set());
    }
    
    this.dataStreams.get(symbol).add(callback);
    logger.info(`Data stream setup for ${symbol}`);
    
    return {
      symbol,
      unsubscribe: () => this.unsubscribeFromStream(symbol, callback)
    };
  }

  /**
   * Unsubscribe from data stream
   */
  unsubscribeFromStream(symbol, callback) {
    if (this.dataStreams.has(symbol)) {
      this.dataStreams.get(symbol).delete(callback);
      if (this.dataStreams.get(symbol).size === 0) {
        this.dataStreams.delete(symbol);
      }
      logger.info(`Unsubscribed from ${symbol} data stream`);
    }
  }

  /**
   * Emit data to active streams
   */
  emitToStreams(symbol, data) {
    if (this.dataStreams.has(symbol)) {
      for (const callback of this.dataStreams.get(symbol)) {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in data stream callback for ${symbol}:`, error.message);
        }
      }
    }
  }

  /**
   * Cache management
   */
  updateCache(layer, key, data) {
    this.cacheLayers[layer].set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.cacheExpiry[layer]
    });
  }

  getCachedData(layer, key) {
    const cached = this.cacheLayers[layer].get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    // Clean up expired cache
    if (cached && Date.now() >= cached.expiry) {
      this.cacheLayers[layer].delete(key);
    }
    
    return null;
  }

  setCachedData(layer, key, data, customExpiry = null) {
    const expiry = customExpiry || this.cacheExpiry[layer];
    this.cacheLayers[layer].set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry
    });
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    
    for (const [layerName, layer] of Object.entries(this.cacheLayers)) {
      for (const [key, entry] of layer.entries()) {
        if (now >= entry.expiry) {
          layer.delete(key);
        }
      }
    }
    
    logger.debug('Cache cleanup completed');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {};
    
    for (const [layerName, layer] of Object.entries(this.cacheLayers)) {
      stats[layerName] = {
        size: layer.size,
        keys: Array.from(layer.keys())
      };
    }
    
    return stats;
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      priceHistory: {
        symbols: this.priceHistory.size,
        totalDataPoints: Array.from(this.priceHistory.values()).reduce((sum, history) => sum + history.length, 0)
      },
      dataStreams: {
        active: this.dataStreams.size,
        totalSubscribers: Array.from(this.dataStreams.values()).reduce((sum, subscribers) => sum + subscribers.size, 0)
      },
      cache: this.getCacheStats(),
      validation: {
        rules: Object.keys(this.validationRules).length,
        normalizationSettings: this.normalizationSettings
      },
      timestamp: new Date()
    };
  }
}

module.exports = DataProcessingService;
