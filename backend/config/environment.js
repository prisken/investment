// Environment configuration with defaults
module.exports = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server Configuration
  PORT: process.env.PORT || 3000,
  
  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'investment_app_dev',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  
  // Test Database Configuration
  TEST_DB_HOST: process.env.TEST_DB_HOST || 'localhost',
  TEST_DB_PORT: process.env.TEST_DB_PORT || 5432,
  TEST_DB_NAME: process.env.TEST_DB_NAME || 'investment_app_test',
  TEST_DB_USER: process.env.TEST_DB_USER || 'postgres',
  TEST_DB_PASSWORD: process.env.TEST_DB_PASSWORD || 'password',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  
  // API Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  
  // Security Configuration
  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || 12,
  
  // Market Data API Configuration
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || '',
  YAHOO_FINANCE_API_KEY: process.env.YAHOO_FINANCE_API_KEY || '',
  
  // External Services
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  
  // Feature Flags
  ENABLE_REAL_MARKET_DATA: process.env.ENABLE_REAL_MARKET_DATA === 'true' || false,
  ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true' || false,
  ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true' || false
};

