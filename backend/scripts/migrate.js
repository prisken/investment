#!/usr/bin/env node

/**
 * Database Migration Script for Investment App
 * 
 * This script initializes the database schema and creates all required tables.
 * 
 * Usage:
 *   node scripts/migrate.js [--force] [--seed]
 * 
 * Options:
 *   --force: Drop existing tables and recreate them
 *   --seed: Insert sample data after migration
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { logger } = require('../utils/logger');

const execAsync = promisify(exec);

// Configuration
const config = {
  schemaFile: path.join(__dirname, '../schemas/init.sql'),
  force: process.argv.includes('--force'),
  seed: process.argv.includes('--seed')
};

class DatabaseMigration {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'investment_app_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    };
  }

  async checkDatabaseConnection() {
    try {
      logger.info('Checking database connection...');
      
      const { stdout, stderr } = await execAsync(
        `PGPASSWORD="${this.dbConfig.password}" psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.user} -d ${this.dbConfig.database} -c "SELECT 1"`
      );
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`Database connection failed: ${stderr}`);
      }
      
      logger.info('Database connection successful');
      return true;
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      return false;
    }
  }

  async createDatabase() {
    try {
      logger.info('Creating database if it does not exist...');
      
      const { stdout, stderr } = await execAsync(
        `PGPASSWORD="${this.dbConfig.password}" psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.user} -d postgres -c "CREATE DATABASE ${this.dbConfig.database}"`
      );
      
      logger.info('Database created successfully');
      return true;
    } catch (error) {
      if (error.message.includes('already exists')) {
        logger.info('Database already exists');
        return true;
      }
      logger.error('Failed to create database', { error: error.message });
      return false;
    }
  }

  async dropTables() {
    if (!config.force) {
      logger.info('Skipping table drop (use --force to drop existing tables)');
      return true;
    }

    try {
      logger.info('Dropping existing tables...');
      
      const dropSQL = `
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `;
      
      const { stdout, stderr } = await execAsync(
        `PGPASSWORD="${this.dbConfig.password}" psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.user} -d ${this.dbConfig.database} -c "${dropSQL}"`
      );
      
      logger.info('Tables dropped successfully');
      return true;
    } catch (error) {
      logger.error('Failed to drop tables', { error: error.message });
      return false;
    }
  }

  async runMigration() {
    try {
      logger.info('Running database migration...');
      
      if (!fs.existsSync(config.schemaFile)) {
        throw new Error(`Schema file not found: ${config.schemaFile}`);
      }
      
      const schemaSQL = fs.readFileSync(config.schemaFile, 'utf8');
      
      const { stdout, stderr } = await execAsync(
        `PGPASSWORD="${this.dbConfig.password}" psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.user} -d ${this.dbConfig.database} -f "${config.schemaFile}"`
      );
      
      if (stderr && !stderr.includes('WARNING')) {
        logger.warn('Migration warnings', { stderr });
      }
      
      logger.info('Database migration completed successfully');
      return true;
    } catch (error) {
      logger.error('Database migration failed', { error: error.message });
      return false;
    }
  }

  async verifyMigration() {
    try {
      logger.info('Verifying migration...');
      
      const tables = [
        'stocks',
        'stock_prices',
        'stock_quotes',
        'companies',
        'financial_statements',
        'market_indices',
        'index_components',
        'index_prices',
        'portfolios',
        'portfolio_positions',
        'portfolio_transactions',
        'user_alerts',
        'alert_history',
        'api_cache'
      ];
      
      for (const table of tables) {
        const { stdout, stderr } = await execAsync(
          `PGPASSWORD="${this.dbConfig.password}" psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.user} -d ${this.dbConfig.database} -c "SELECT COUNT(*) FROM ${table}"`
        );
        
        if (stderr && !stderr.includes('WARNING')) {
          logger.warn(`Table ${table} verification warning`, { stderr });
        }
        
        logger.info(`Table ${table} verified`);
      }
      
      logger.info('Migration verification completed');
      return true;
    } catch (error) {
      logger.error('Migration verification failed', { error: error.message });
      return false;
    }
  }

  async checkIndexes() {
    try {
      logger.info('Checking database indexes...');
      
      const { stdout, stderr } = await execAsync(
        `PGPASSWORD="${this.dbConfig.password}" psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.user} -d ${this.dbConfig.database} -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;"`
      );
      
      if (stderr && !stderr.includes('WARNING')) {
        logger.warn('Index check warnings', { stderr });
      }
      
      const indexCount = (stdout.match(/\n/g) || []).length - 1; // Subtract header row
      logger.info(`Found ${indexCount} database indexes`);
      
      return true;
    } catch (error) {
      logger.error('Index check failed', { error: error.message });
      return false;
    }
  }

  async runPerformanceTest() {
    try {
      logger.info('Running performance test...');
      
      const testQueries = [
        'SELECT COUNT(*) FROM stocks WHERE market = \'US\'',
        'SELECT COUNT(*) FROM stock_quotes WHERE last_updated > NOW() - INTERVAL \'1 hour\'',
        'SELECT COUNT(*) FROM market_indices WHERE is_active = true',
        'SELECT COUNT(*) FROM portfolio_positions WHERE portfolio_id IN (SELECT id FROM portfolios LIMIT 1)'
      ];
      
      for (let i = 0; i < testQueries.length; i++) {
        const startTime = Date.now();
        
        const { stdout, stderr } = await execAsync(
          `PGPASSWORD="${this.dbConfig.password}" psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.user} -d ${this.dbConfig.database} -c "${testQueries[i]}"`
        );
        
        const duration = Date.now() - startTime;
        logger.info(`Query ${i + 1} executed in ${duration}ms`);
      }
      
      logger.info('Performance test completed');
      return true;
    } catch (error) {
      logger.error('Performance test failed', { error: error.message });
      return false;
    }
  }

  async run() {
    const startTime = Date.now();
    let success = false;
    let error = null;

    try {
      logger.info('Starting database migration...', {
        force: config.force,
        seed: config.seed,
        database: this.dbConfig.database
      });

      // Step 1: Check database connection
      if (!(await this.checkDatabaseConnection())) {
        throw new Error('Database connection failed');
      }

      // Step 2: Create database if needed
      if (!(await this.createDatabase())) {
        throw new Error('Failed to create database');
      }

      // Step 3: Drop tables if forced
      if (!(await this.dropTables())) {
        throw new Error('Failed to drop tables');
      }

      // Step 4: Run migration
      if (!(await this.runMigration())) {
        throw new Error('Failed to run migration');
      }

      // Step 5: Verify migration
      if (!(await this.verifyMigration())) {
        throw new Error('Failed to verify migration');
      }

      // Step 6: Check indexes
      if (!(await this.checkIndexes())) {
        throw new Error('Failed to check indexes');
      }

      // Step 7: Run performance test
      if (!(await this.runPerformanceTest())) {
        throw new Error('Failed to run performance test');
      }

      success = true;
      const duration = Date.now() - startTime;
      
      logger.info('Database migration completed successfully', {
        duration: `${duration}ms`,
        force: config.force,
        seed: config.seed
      });

    } catch (err) {
      error = err;
      logger.error('Database migration failed', {
        error: err.message,
        duration: `${Date.now() - startTime}ms`
      });
    }

    return { success, error, duration: Date.now() - startTime };
  }
}

// Main execution
async function main() {
  try {
    const migration = new DatabaseMigration();
    const result = await migration.run();
    
    if (result.success) {
      console.log('✅ Database migration completed successfully');
      console.log(`⏱️  Duration: ${result.duration}ms`);
      console.log('\n📋 Next steps:');
      console.log('1. Start your backend server: npm run dev');
      console.log('2. Test the API endpoints');
      console.log('3. Check the database tables and indexes');
      process.exit(0);
    } else {
      console.error('❌ Database migration failed:', result.error?.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration script error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseMigration;
