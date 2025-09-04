const express = require('express');
const router = express.Router();

// GET /api/market/indices/us - Get US market indices
router.get('/indices/us', async (req, res) => {
  try {
    // Mock data for now - will be replaced with real API calls
    const usIndices = [
      {
        symbol: '^GSPC',
        name: 'S&P 500',
        price: 4500 + Math.random() * 100,
        change: (Math.random() - 0.5) * 50,
        changePercent: (Math.random() - 0.5) * 2,
        market: 'US',
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: '^DJI',
        name: 'Dow Jones Industrial Average',
        price: 35000 + Math.random() * 500,
        change: (Math.random() - 0.5) * 200,
        changePercent: (Math.random() - 0.5) * 1.5,
        market: 'US',
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: '^IXIC',
        name: 'NASDAQ Composite',
        price: 14000 + Math.random() * 300,
        change: (Math.random() - 0.5) * 150,
        changePercent: (Math.random() - 0.5) * 2.5,
        market: 'US',
        lastUpdated: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: usIndices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching US market indices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch US market indices'
    });
  }
});

// GET /api/market/indices/hk - Get HK market indices
router.get('/indices/hk', async (req, res) => {
  try {
    const hkIndices = [
      {
        symbol: '^HSI',
        name: 'Hang Seng Index',
        price: 18000 + Math.random() * 1000,
        change: (Math.random() - 0.5) * 300,
        changePercent: (Math.random() - 0.5) * 2,
        market: 'HK',
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: '^HSTECH',
        name: 'Hang Seng Tech Index',
        price: 4000 + Math.random() * 200,
        change: (Math.random() - 0.5) * 100,
        changePercent: (Math.random() - 0.5) * 3,
        market: 'HK',
        lastUpdated: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: hkIndices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching HK market indices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HK market indices'
    });
  }
});

// GET /api/market/overview - Get market overview
router.get('/overview', async (req, res) => {
  try {
    const overview = {
      usMarket: {
        status: 'open',
        lastUpdated: new Date().toISOString(),
        indices: ['S&P 500', 'Dow Jones', 'NASDAQ']
      },
      hkMarket: {
        status: 'closed',
        lastUpdated: new Date().toISOString(),
        indices: ['Hang Seng', 'Hang Seng Tech']
      },
      globalStatus: 'mixed'
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market overview'
    });
  }
});

// GET /api/market/status - Get market open/closed status
router.get('/status', async (req, res) => {
  try {
    const now = new Date();
    const usTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hkTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
    
    const usMarketOpen = usTime.getHours() >= 9 && usTime.getHours() < 16;
    const hkMarketOpen = hkTime.getHours() >= 9 && hkTime.getHours() < 16;

    const status = {
      us: {
        open: usMarketOpen,
        time: usTime.toLocaleTimeString(),
        timezone: 'America/New_York'
      },
      hk: {
        open: hkMarketOpen,
        time: hkTime.toLocaleTimeString(),
        timezone: 'Asia/Hong_Kong'
      },
      timestamp: now.toISOString()
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching market status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market status'
    });
  }
});

module.exports = router;
