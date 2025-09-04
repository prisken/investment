const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes
// In production, this would be replaced with a database
let portfolios = {
  'demo-user': {
    id: 'demo-user',
    name: 'Demo Portfolio',
    totalValue: 25000,
    totalChange: 3200,
    totalChangePercent: 14.68,
    holdings: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        shares: 10,
        avgPrice: 175.00,
        currentPrice: 175.00,
        currentValue: 1750.00,
        change: 25.00,
        changePercent: 1.45,
        market: 'US'
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        shares: 5,
        avgPrice: 1250.00,
        currentPrice: 1250.00,
        currentValue: 6250.00,
        change: 125.00,
        changePercent: 2.04,
        market: 'US'
      },
      {
        symbol: '0700',
        name: 'Tencent Holdings',
        shares: 100,
        avgPrice: 32.00,
        currentPrice: 32.00,
        currentValue: 3200.00,
        change: -80.00,
        changePercent: -2.44,
        market: 'HK'
      }
    ],
    transactions: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
};

// GET /api/portfolio/summary - Get portfolio summary
router.get('/summary', async (req, res) => {
  try {
    // For demo, return the demo portfolio
    const portfolio = portfolios['demo-user'];
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: portfolio.id,
        name: portfolio.name,
        totalValue: portfolio.totalValue,
        totalChange: portfolio.totalChange,
        totalChangePercent: portfolio.totalChangePercent,
        holdingsCount: portfolio.holdings.length,
        lastUpdated: portfolio.lastUpdated
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio summary'
    });
  }
});

// GET /api/portfolio/holdings - Get portfolio holdings
router.get('/holdings', async (req, res) => {
  try {
    const portfolio = portfolios['demo-user'];
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    res.json({
      success: true,
      data: portfolio.holdings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching portfolio holdings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio holdings'
    });
  }
});

// GET /api/portfolio/transactions - Get portfolio transactions
router.get('/transactions', async (req, res) => {
  try {
    const portfolio = portfolios['demo-user'];
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    res.json({
      success: true,
      data: portfolio.transactions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching portfolio transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio transactions'
    });
  }
});

// POST /api/portfolio/add-stock - Add stock to portfolio
router.post('/add-stock', async (req, res) => {
  try {
    const { symbol, shares, price, market } = req.body;
    
    if (!symbol || !shares || !price || !market) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, shares, price, market'
      });
    }

    const portfolio = portfolios['demo-user'];
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    // Check if stock already exists
    const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);
    
    if (existingHolding) {
      // Update existing holding
      const totalShares = existingHolding.shares + shares;
      const totalCost = (existingHolding.avgPrice * existingHolding.shares) + (price * shares);
      existingHolding.avgPrice = totalCost / totalShares;
      existingHolding.shares = totalShares;
      existingHolding.currentValue = existingHolding.shares * existingHolding.currentPrice;
    } else {
      // Add new holding
      portfolio.holdings.push({
        symbol,
        name: `${symbol} Corporation`,
        shares,
        avgPrice: price,
        currentPrice: price,
        currentValue: shares * price,
        change: 0,
        changePercent: 0,
        market
      });
    }

    // Add transaction
    portfolio.transactions.push({
      id: Date.now().toString(),
      type: 'buy',
      symbol,
      shares,
      price,
      market,
      timestamp: new Date().toISOString()
    });

    // Update portfolio totals
    portfolio.totalValue = portfolio.holdings.reduce((sum, h) => sum + h.currentValue, 0);
    portfolio.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: `Added ${shares} shares of ${symbol} to portfolio`,
      data: {
        symbol,
        shares,
        price,
        market
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding stock to portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add stock to portfolio'
    });
  }
});

// POST /api/portfolio/remove-stock - Remove stock from portfolio
router.post('/remove-stock', async (req, res) => {
  try {
    const { symbol, shares } = req.body;
    
    if (!symbol || !shares) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, shares'
      });
    }

    const portfolio = portfolios['demo-user'];
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    
    if (!holding) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found in portfolio'
      });
    }

    if (holding.shares < shares) {
      return res.status(400).json({
        success: false,
        error: 'Not enough shares to remove'
      });
    }

    // Update holding
    holding.shares -= shares;
    holding.currentValue = holding.shares * holding.currentPrice;

    // Remove holding if no shares left
    if (holding.shares === 0) {
      portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
    }

    // Add transaction
    portfolio.transactions.push({
      id: Date.now().toString(),
      type: 'sell',
      symbol,
      shares,
      price: holding.currentPrice,
      market: holding.market,
      timestamp: new Date().toISOString()
    });

    // Update portfolio totals
    portfolio.totalValue = portfolio.holdings.reduce((sum, h) => sum + h.currentValue, 0);
    portfolio.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: `Removed ${shares} shares of ${symbol} from portfolio`,
      data: {
        symbol,
        shares,
        price: holding.currentPrice
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error removing stock from portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove stock from portfolio'
    });
  }
});

// GET /api/portfolio/performance - Get portfolio performance
router.get('/performance', async (req, res) => {
  try {
    const portfolio = portfolios['demo-user'];
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    const performance = {
      totalValue: portfolio.totalValue,
      totalChange: portfolio.totalChange,
      totalChangePercent: portfolio.totalChangePercent,
      topPerformers: portfolio.holdings
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 3),
      worstPerformers: portfolio.holdings
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 3),
      marketAllocation: {
        US: portfolio.holdings.filter(h => h.market === 'US').length,
        HK: portfolio.holdings.filter(h => h.market === 'HK').length
      }
    };

    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching portfolio performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio performance'
    });
  }
});

module.exports = router;
