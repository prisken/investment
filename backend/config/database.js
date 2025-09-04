// Database configuration with fallback for development
let Pool;
try {
  Pool = require('pg').Pool;
} catch (error) {
  console.warn('PostgreSQL not available, using mock database');
  Pool = null;
}

const { logger } = require('../utils/logger');

// Database configuration
const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'investment_app_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    ssl: false
  },
  test: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 5432,
    database: process.env.TEST_DB_NAME || 'investment_app_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'password',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: false
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false
    }
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Create connection pool
let pool;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    if (!Pool) {
      console.log('⚠️  Using mock database (PostgreSQL not available)');
      return { mock: true };
    }

    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    logger.info('Database connected successfully', {
      host: config.host,
      database: config.database,
      environment: env
    });
    
    client.release();
    
    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
    
    return pool;
  } catch (error) {
    logger.error('Failed to connect to database', {
      error: error.message,
      config: { ...config, password: '[HIDDEN]' }
    });
    
    // For development, continue without database
    if (env === 'development') {
      console.log('⚠️  Database connection failed, continuing with mock data');
      return { mock: true };
    }
    
    throw error;
  }
};

// Get database connection
const getConnection = () => {
  if (!pool && !Pool) {
    throw new Error('Database not available. PostgreSQL module not found.');
  }
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

// Execute a query
const query = async (text, params) => {
  if (!pool) {
    // Return mock data for development
    return { rows: [], rowCount: 0 };
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query execution failed', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  }
};

// Execute a transaction
const transaction = async (callback) => {
  if (!pool) {
    // Mock transaction for development
    return await callback({ query: () => ({ rows: [], rowCount: 0 }) });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Close database connection
const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};

// Health check
const healthCheck = async () => {
  try {
    if (!pool) {
      return {
        status: 'mock',
        timestamp: new Date().toISOString(),
        environment: env,
        message: 'Using mock database'
      };
    }

    const result = await query('SELECT NOW()');
    return {
      status: 'healthy',
      timestamp: result.rows[0]?.now || new Date().toISOString(),
      environment: env
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: env
    };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connections...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connections...');
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  initializeDatabase,
  getConnection,
  query,
  transaction,
  closeDatabase,
  healthCheck,
  config
};
