#!/usr/bin/env node

/**
 * Environment Setup Script for Investment App
 * Creates .env file with your API keys
 */

const fs = require('fs');
const path = require('path');

// Your API keys
const API_KEYS = {
  alphaVantage: 'TFERDLXQKXXUF1XA',
  finnhub: 'd2sk469r01qiq7a4lpe0d2sk469r01qiq7a4lpeg',
  polygon: 'y7H1M0JpxwT0iriBMrhNKHg9Wul3k6hS'
};

// Environment configuration
const envContent = `# ========================================
# INVESTMENT APP ENVIRONMENT CONFIGURATION
# ========================================

# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=investment_app_dev
DB_USER=postgres
DB_PASSWORD=your_password_here

# Test Database
DB_TEST_NAME=investment_app_test
DB_TEST_USER=postgres
DB_TEST_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# ========================================
# FREE MARKET DATA APIs (0 COST)
# ========================================

# Alpha Vantage (500 requests/day, 5/minute)
ALPHA_VANTAGE_API_KEY=${API_KEYS.alphaVantage}

# Finnhub (60 requests/minute)
FINNHUB_API_KEY=${API_KEYS.finnhub}

# Polygon.io (5 requests/minute)
POLYGON_API_KEY=${API_KEYS.polygon}

# Yahoo Finance (No API key needed)
YAHOO_FINANCE_ENABLED=true
YAHOO_RATE_LIMIT=10

# ========================================
# API RATE LIMITING CONFIGURATION
# ========================================

# Rate limiting for free APIs
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window

# Alpha Vantage specific limits
ALPHA_VANTAGE_RATE_LIMIT=5   # requests per minute
ALPHA_VANTAGE_DAILY_LIMIT=500 # requests per day

# Finnhub specific limits
FINNHUB_RATE_LIMIT=60        # requests per minute

# Polygon specific limits
POLYGON_RATE_LIMIT=5         # requests per minute

# ========================================
# CACHE CONFIGURATION (IMPORTANT FOR FREE APIS)
# ========================================

# Cache duration for different data types
CACHE_STOCK_QUOTES_MS=60000      # 1 minute for real-time quotes
CACHE_MARKET_DATA_MS=300000      # 5 minutes for market data
CACHE_COMPANY_INFO_MS=86400000   # 24 hours for company info
CACHE_INDEX_DATA_MS=300000       # 5 minutes for index data

# Redis cache (optional, for production)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false

# ========================================
# LOGGING AND MONITORING
# ========================================

LOG_LEVEL=info
LOG_FILE=./logs/app.log
ENABLE_REQUEST_LOGGING=true
ENABLE_API_MONITORING=true

# ========================================
# SECURITY CONFIGURATION
# ========================================

# CORS settings
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Helmet security
HELMET_ENABLED=true
CONTENT_SECURITY_POLICY=true

# ========================================
# DEVELOPMENT TOOLS
# ========================================

# Enable detailed logging for development
DEBUG=investment-app:*
ENABLE_SWAGGER=true
ENABLE_API_DOCS=true

# Mock data fallback (when APIs fail)
ENABLE_MOCK_DATA=true
MOCK_DATA_FALLBACK=true

# ========================================
# MARKET DATA FEATURES
# ========================================

# US Market
MARKET_US_ENABLED=true
MARKET_US_PRIMARY=alpha_vantage
MARKET_US_FALLBACK=finnhub,polygon

# Hong Kong Market
MARKET_HK_ENABLED=true
MARKET_HK_PRIMARY=yahoo
MARKET_HK_FALLBACK=alpha_vantage

# Data types covered
ENABLE_REAL_TIME_QUOTES=true
ENABLE_HISTORICAL_DATA=true
ENABLE_COMPANY_PROFILES=true
ENABLE_INDEX_DATA=true
ENABLE_SECTOR_PERFORMANCE=true

# ========================================
# API PRIORITY ORDER (FALLBACK STRATEGY)
# ========================================

# Primary API (best free tier)
PRIMARY_API=alpha_vantage

# Fallback APIs in order
FALLBACK_APIS=finnhub,polygon,yahoo

# ========================================
# PERFORMANCE OPTIMIZATION
# ========================================

# Database connection pooling
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# API request timeouts
API_TIMEOUT_MS=10000
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY_MS=1000

# ========================================
# FEATURE FLAGS
# ========================================

# Enable/disable features
FEATURE_REAL_TIME_QUOTES=true
FEATURE_MARKET_ALERTS=true
FEATURE_PORTFOLIO_TRACKING=true
FEATURE_TECHNICAL_ANALYSIS=true
FEATURE_NEWS_FEED=false

# Market coverage
MARKET_US_ENABLED=true
MARKET_HK_ENABLED=true
MARKET_CRYPTO_ENABLED=false
MARKET_FOREX_ENABLED=false
`;

function setupEnvironment() {
  console.log('🔧 Setting up Investment App Environment...\n');
  
  const envPath = path.join(__dirname, '../.env');
  
  try {
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env file already exists');
      console.log('   Backing up existing file to .env.backup');
      fs.copyFileSync(envPath, envPath + '.backup');
    }
    
    // Create new .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully');
    
    // Verify the file was created
    if (fs.existsSync(envPath)) {
      const stats = fs.statSync(envPath);
      console.log(`   File size: ${stats.size} bytes`);
      console.log(`   Created: ${stats.birthtime.toLocaleString()}`);
    }
    
    console.log('\n📋 Environment Configuration:');
    console.log(`   Alpha Vantage API Key: ${API_KEYS.alphaVantage.substring(0, 8)}...`);
    console.log(`   Finnhub API Key: ${API_KEYS.finnhub.substring(0, 8)}...`);
    console.log(`   Polygon API Key: ${API_KEYS.polygon.substring(0, 8)}...`);
    
    console.log('\n🎯 What\'s Configured:');
    console.log('   ✅ Server settings (port 3000)');
    console.log('   ✅ Database configuration');
    console.log('   ✅ JWT security');
    console.log('   ✅ All 3 free market data APIs');
    console.log('   ✅ Rate limiting and caching');
    console.log('   ✅ US and HK market coverage');
    console.log('   ✅ Fallback strategies');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Edit .env file with your database password');
    console.log('2. Set up PostgreSQL database');
    console.log('3. Run: node scripts/migrate.js');
    console.log('4. Start building market data services!');
    
    console.log('\n💡 Pro Tips:');
    console.log('   • Your APIs are already tested and working');
    console.log('   • Rate limits are configured for free tiers');
    console.log('   • Caching is set up to minimize API calls');
    console.log('   • Fallback strategies ensure reliability');
    
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupEnvironment();
}

module.exports = { setupEnvironment, API_KEYS };
