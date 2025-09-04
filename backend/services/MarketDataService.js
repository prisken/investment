/**
 * Market Data Service for Investment App
 * Integrates Alpha Vantage, Finnhub, and Polygon.io with smart fallback
 */

const https = require('https');
const { logger } = require('../utils/logger');

class MarketDataService {
  constructor() {
    this.apiKeys = {
      alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
      finnhub: process.env.FINNHUB_API_KEY,
      polygon: process.env.POLYGON_API_KEY
    };
    
    this.rateLimits = {
      alphaVantage: { requests: 0, lastReset: Date.now(), limit: 5, window: 60000 },
      finnhub: { requests: 0, lastReset: Date.now(), limit: 60, window: 60000 },
      polygon: { requests: 0, lastReset: Date.now(), limit: 5, window: 60000 }
    };
    
    this.cache = new Map();
    this.cacheExpiry = {
      stockQuotes: 60000,      // 1 minute
      marketData: 300000,      // 5 minutes
      companyInfo: 86400000,   // 24 hours
      indexData: 300000        // 5 minutes
    };
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      https.get(url, (res) => {
        clearTimeout(timer);
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }).on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Check if API is within rate limits
   */
  checkRateLimit(apiName) {
    const limit = this.rateLimits[apiName];
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - limit.lastReset > limit.window) {
      limit.requests = 0;
      limit.lastReset = now;
    }
    
    if (limit.requests >= limit.limit) {
      return false;
    }
    
    limit.requests++;
    return true;
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set data in cache with expiry
   */
  setCachedData(key, data, expiryMs) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + expiryMs
    });
  }

  /**
   * Get real-time stock quote with smart API selection
   */
  async getStockQuote(symbol) {
    const cacheKey = `quote_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      logger.info(`Cache hit for ${symbol} quote`);
      return cached;
    }

    // Try Alpha Vantage first (best free tier)
    if (this.checkRateLimit('alphaVantage')) {
      try {
        const quote = await this.getAlphaVantageQuote(symbol);
        if (quote) {
          this.setCachedData(cacheKey, quote, this.cacheExpiry.stockQuotes);
          return quote;
        }
      } catch (error) {
        logger.warn(`Alpha Vantage failed for ${symbol}:`, error.message);
      }
    }

    // Try Finnhub as backup (higher rate limit)
    if (this.checkRateLimit('finnhub')) {
      try {
        const quote = await this.getFinnhubQuote(symbol);
        if (quote) {
          this.setCachedData(cacheKey, quote, this.cacheExpiry.stockQuotes);
          return quote;
        }
      } catch (error) {
        logger.warn(`Finnhub failed for ${symbol}:`, error.message);
      }
    }

    // Try Polygon as last resort
    if (this.checkRateLimit('polygon')) {
      try {
        const quote = await this.getPolygonQuote(symbol);
        if (quote) {
          this.setCachedData(cacheKey, quote, this.cacheExpiry.stockQuotes);
          return quote;
        }
      } catch (error) {
        logger.warn(`Polygon failed for ${symbol}:`, error.message);
      }
    }

    throw new Error(`All APIs failed for symbol: ${symbol}`);
  }

  /**
   * Get quote from Alpha Vantage
   */
  async getAlphaVantageQuote(symbol) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKeys.alphaVantage}`;
    const response = await this.makeRequest(url);
    
    if (response.status === 200 && response.data['Global Quote']) {
      const quote = response.data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close']),
        source: 'Alpha Vantage',
        timestamp: new Date()
      };
    }
    
    if (response.data.Note) {
      throw new Error(`Alpha Vantage rate limit: ${response.data.Note}`);
    }
    
    return null;
  }

  /**
   * Get quote from Finnhub
   */
  async getFinnhubQuote(symbol) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKeys.finnhub}`;
    const response = await this.makeRequest(url);
    
    if (response.status === 200 && response.data.c) {
      return {
        symbol: symbol,
        price: response.data.c,
        change: response.data.d,
        changePercent: response.data.dp,
        volume: response.data.v,
        high: response.data.h,
        low: response.data.l,
        open: response.data.o,
        previousClose: response.data.pc,
        source: 'Finnhub',
        timestamp: new Date()
      };
    }
    
    return null;
  }

  /**
   * Get quote from Polygon.io
   */
  async getPolygonQuote(symbol) {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apikey=${this.apiKeys.polygon}`;
    const response = await this.makeRequest(url);
    
    if (response.status === 200 && response.data.results && response.data.results[0]) {
      const result = response.data.results[0];
      return {
        symbol: symbol,
        price: result.c,
        change: result.c - result.o,
        changePercent: ((result.c - result.o) / result.o) * 100,
        volume: result.v,
        high: result.h,
        low: result.l,
        open: result.o,
        previousClose: result.o,
        source: 'Polygon.io',
        timestamp: new Date(result.t)
      };
    }
    
    return null;
  }

  /**
   * Get batch quotes for multiple symbols
   */
  async getBatchQuotes(symbols) {
    const results = {};
    const promises = symbols.map(async (symbol) => {
      try {
        const quote = await this.getStockQuote(symbol);
        results[symbol] = quote;
      } catch (error) {
        results[symbol] = { error: error.message };
      }
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Get market indices data
   */
  async getMarketIndices() {
    const cacheKey = 'market_indices';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const indices = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, NASDAQ
    const results = {};

    for (const index of indices) {
      try {
        const quote = await this.getStockQuote(index);
        if (quote) {
          results[index] = quote;
        }
      } catch (error) {
        logger.warn(`Failed to get index ${index}:`, error.message);
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.setCachedData(cacheKey, results, this.cacheExpiry.indexData);
    return results;
  }

  /**
   * Get company information
   */
  async getCompanyInfo(symbol) {
    const cacheKey = `company_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    // Try Alpha Vantage for company overview
    if (this.checkRateLimit('alphaVantage')) {
      try {
        const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKeys.alphaVantage}`;
        const response = await this.makeRequest(url);
        
        if (response.status === 200 && response.data.Symbol) {
          const companyInfo = {
            symbol: response.data.Symbol,
            name: response.data.Name,
            description: response.data.Description,
            sector: response.data.Sector,
            industry: response.data.Industry,
            marketCap: response.data.MarketCapitalization,
            peRatio: response.data.PERatio,
            dividendYield: response.data.DividendYield,
            eps: response.data.EPS,
            beta: response.data.Beta,
            source: 'Alpha Vantage',
            timestamp: new Date()
          };
          
          this.setCachedData(cacheKey, companyInfo, this.cacheExpiry.companyInfo);
          return companyInfo;
        }
      } catch (error) {
        logger.warn(`Failed to get company info from Alpha Vantage:`, error.message);
      }
    }

    return null;
  }

  /**
   * Get sector performance
   */
  async getSectorPerformance() {
    const cacheKey = 'sector_performance';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    // Use Alpha Vantage for sector performance
    if (this.checkRateLimit('alphaVantage')) {
      try {
        const url = `https://www.alphavantage.co/query?function=SECTOR&apikey=${this.apiKeys.alphaVantage}`;
        const response = await this.makeRequest(url);
        
        if (response.status === 200 && response.data['Rank A: Real-Time Performance']) {
          const sectors = response.data['Rank A: Real-Time Performance'];
          const performance = Object.entries(sectors).map(([sector, performance]) => ({
            sector,
            performance: parseFloat(performance.replace('%', ''))
          }));
          
          this.setCachedData(cacheKey, performance, this.cacheExpiry.marketData);
          return performance;
        }
      } catch (error) {
        logger.warn(`Failed to get sector performance:`, error.message);
      }
    }

    return null;
  }

  /**
   * Get market overview summary
   */
  async getMarketOverview() {
    try {
      const [indices, sectors] = await Promise.all([
        this.getMarketIndices(),
        this.getSectorPerformance()
      ]);

      return {
        indices,
        sectors,
        timestamp: new Date(),
        summary: {
          totalIndices: Object.keys(indices).length,
          totalSectors: sectors ? sectors.length : 0,
          marketStatus: this.getMarketStatus(indices)
        }
      };
    } catch (error) {
      logger.error('Failed to get market overview:', error.message);
      throw error;
    }
  }

  /**
   * Determine market status based on indices
   */
  getMarketStatus(indices) {
    const changes = Object.values(indices).map(quote => quote.changePercent);
    const positiveChanges = changes.filter(change => change > 0).length;
    const negativeChanges = changes.filter(change => change < 0).length;
    
    if (positiveChanges > negativeChanges) return 'bullish';
    if (negativeChanges > positiveChanges) return 'bearish';
    return 'mixed';
  }

  /**
   * Get service health and rate limit status
   */
  getServiceStatus() {
    return {
      apis: {
        alphaVantage: {
          available: this.checkRateLimit('alphaVantage'),
          requests: this.rateLimits.alphaVantage.requests,
          limit: this.rateLimits.alphaVantage.limit,
          resetIn: Math.max(0, this.rateLimits.alphaVantage.window - (Date.now() - this.rateLimits.alphaVantage.lastReset))
        },
        finnhub: {
          available: this.checkRateLimit('finnhub'),
          requests: this.rateLimits.finnhub.requests,
          limit: this.rateLimits.finnhub.limit,
          resetIn: Math.max(0, this.rateLimits.finnhub.window - (Date.now() - this.rateLimits.finnhub.lastReset))
        },
        polygon: {
          available: this.checkRateLimit('polygon'),
          requests: this.rateLimits.polygon.requests,
          limit: this.rateLimits.polygon.limit,
          resetIn: Math.max(0, this.rateLimits.polygon.window - (Date.now() - this.rateLimits.polygon.lastReset))
        }
      },
      cache: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      },
      timestamp: new Date()
    };
  }
}

module.exports = MarketDataService;
