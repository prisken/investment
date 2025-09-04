const express = require('express');
const router = express.Router();

// GET /api/stocks/us/:symbol - Get US stock quote
router.get('/us/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Mock data for now - will be replaced with real API calls
    const stockQuote = {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Corporation`,
      price: Math.random() * 1000 + 50,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 10,
      volume: Math.floor(Math.random() * 1000000),
      marketCap: Math.random() * 1000000000,
      pe: Math.random() * 50 + 10,
      dividend: Math.random() * 5,
      dayHigh: Math.random() * 1000 + 100,
      dayLow: Math.random() * 500 + 50,
      open: Math.random() * 1000 + 50,
      previousClose: Math.random() * 1000 + 50,
      market: 'US',
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stockQuote,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching US stock quote for ${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock quote'
    });
  }
});

// GET /api/stocks/hk/:symbol - Get HK stock quote
router.get('/hk/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const stockQuote = {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Holdings`,
      price: Math.random() * 100 + 10,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 8,
      volume: Math.floor(Math.random() * 500000),
      marketCap: Math.random() * 500000000,
      pe: Math.random() * 30 + 8,
      dividend: Math.random() * 3,
      dayHigh: Math.random() * 100 + 20,
      dayLow: Math.random() * 50 + 10,
      open: Math.random() * 100 + 10,
      previousClose: Math.random() * 100 + 10,
      market: 'HK',
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stockQuote,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching HK stock quote for ${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock quote'
    });
  }
});

// GET /api/stocks/popular/:market - Get popular stocks for a market
router.get('/popular/:market', async (req, res) => {
  try {
    const { market } = req.params;
    
    if (market !== 'US' && market !== 'HK') {
      return res.status(400).json({
        success: false,
        error: 'Market must be either US or HK'
      });
    }

    const popularStocks = market === 'US' 
      ? ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX']
      : ['0700', '0941', '0005', '1299', '2318', '3988', '1398', '2628'];

    const stocks = popularStocks.map(symbol => ({
      symbol,
      name: `${symbol} Company`,
      price: Math.random() * (market === 'US' ? 1000 : 100) + (market === 'US' ? 50 : 10),
      change: (Math.random() - 0.5) * (market === 'US' ? 20 : 5),
      changePercent: (Math.random() - 0.5) * (market === 'US' ? 10 : 8),
      volume: Math.floor(Math.random() * (market === 'US' ? 1000000 : 500000)),
      market
    }));

    res.json({
      success: true,
      data: stocks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching popular stocks for ${req.params.market}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular stocks'
    });
  }
});

// GET /api/stocks/search/:market - Search stocks in a market
router.get('/search/:market', async (req, res) => {
  try {
    const { market } = req.params;
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    if (market !== 'US' && market !== 'HK') {
      return res.status(400).json({
        success: false,
        error: 'Market must be either US or HK'
      });
    }

    // Mock search results
    const searchResults = [
      {
        symbol: query.toUpperCase(),
        name: `${query.toUpperCase()} Corporation`,
        price: Math.random() * (market === 'US' ? 1000 : 100) + (market === 'US' ? 50 : 10),
        change: (Math.random() - 0.5) * (market === 'US' ? 20 : 5),
        changePercent: (Math.random() - 0.5) * (market === 'US' ? 10 : 8),
        volume: Math.floor(Math.random() * (market === 'US' ? 1000000 : 500000)),
        market
      }
    ];

    res.json({
      success: true,
      data: searchResults,
      query,
      market,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error searching stocks in ${req.params.market}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to search stocks'
    });
  }
});

// GET /api/stocks/info/:market/:symbol - Get company information
router.get('/info/:market/:symbol', async (req, res) => {
  try {
    const { market, symbol } = req.params;
    
    const companyInfo = {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Corporation`,
      sector: 'Technology',
      industry: 'Software',
      description: 'A leading technology company focused on innovation and growth.',
      website: 'https://example.com',
      employees: Math.floor(Math.random() * 100000) + 1000,
      founded: 1990 + Math.floor(Math.random() * 30),
      market,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: companyInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching company info for ${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company information'
    });
  }
});

module.exports = router;
