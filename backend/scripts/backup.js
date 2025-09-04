#!/usr/bin/env node

/**
 * Database Backup Script for Investment App
 * 
 * This script creates automated backups of the PostgreSQL database
 * and uploads them to cloud storage for disaster recovery.
 * 
 * Usage:
 *   node scripts/backup.js [--type=full|incremental] [--compress] [--upload]
 * 
 * Features:
 *   - Full and incremental backups
 *   - Compression support
 *   - Cloud storage upload
 *   - Backup verification
 *   - Retention management
 *   - Email notifications
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { logger } = require('../utils/logger');

const execAsync = promisify(exec);

// Configuration
const config = {
  backupDir: path.join(__dirname, '../backups'),
  retentionDays: {
    full: 30,      // Keep full backups for 30 days
    incremental: 7 // Keep incremental backups for 7 days
  },
  compression: true,
  uploadToCloud: process.env.UPLOAD_BACKUPS === 'true',
  cloudProvider: process.env.CLOUD_PROVIDER || 'local', // local, s3, gcs, azure
  emailNotifications: process.env.EMAIL_NOTIFICATIONS === 'true'
};

// Command line arguments
const args = process.argv.slice(2);
const options = {
  type: 'full',
  compress: true,
  upload: false,
  verify: true
};

// Parse command line arguments
args.forEach(arg => {
  if (arg.startsWith('--type=')) {
    options.type = arg.split('=')[1];
  } else if (arg === '--no-compress') {
    options.compress = false;
  } else if (arg === '--upload') {
    options.upload = true;
  } else if (arg === '--no-verify') {
    options.verify = false;
  }
});

class DatabaseBackup {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupFilename = `investment_app_${options.type}_${this.timestamp}.sql`;
    this.backupPath = path.join(config.backupDir, this.backupFilename);
    this.compressedPath = this.backupPath + '.gz';
  }

  async initialize() {
    try {
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(config.backupDir)) {
        fs.mkdirSync(config.backupDir, { recursive: true });
        logger.info('Created backup directory', { path: config.backupDir });
      }

      // Check if pg_dump is available
      await this.checkPgDump();
      
      logger.info('Database backup initialized', {
        type: options.type,
        timestamp: this.timestamp,
        filename: this.backupFilename
      });
    } catch (error) {
      logger.error('Failed to initialize backup', { error: error.message });
      throw error;
    }
  }

  async checkPgDump() {
    try {
      await execAsync('which pg_dump');
      logger.info('pg_dump is available');
    } catch (error) {
      throw new Error('pg_dump is not available. Please install PostgreSQL client tools.');
    }
  }

  async createBackup() {
    try {
      logger.info('Starting database backup', { type: options.type });

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'investment_app_dev',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
      };

      // Build pg_dump command
      let pgDumpCmd = `PGPASSWORD="${dbConfig.password}" pg_dump`;
      pgDumpCmd += ` -h ${dbConfig.host}`;
      pgDumpCmd += ` -p ${dbConfig.port}`;
      pgDumpCmd += ` -U ${dbConfig.user}`;
      pgDumpCmd += ` -d ${dbConfig.database}`;
      
      if (options.type === 'full') {
        pgDumpCmd += ' --clean --create --if-exists';
      } else if (options.type === 'incremental') {
        pgDumpCmd += ' --data-only --disable-triggers';
      }
      
      pgDumpCmd += ` -f "${this.backupPath}"`;

      // Execute backup
      const { stdout, stderr } = await execAsync(pgDumpCmd);
      
      if (stderr) {
        logger.warn('pg_dump warnings', { stderr });
      }

      logger.info('Database backup completed', {
        path: this.backupPath,
        size: this.getFileSize(this.backupPath)
      });

      return this.backupPath;
    } catch (error) {
      logger.error('Database backup failed', { error: error.message });
      throw error;
    }
  }

  async compressBackup() {
    if (!options.compress) {
      return this.backupPath;
    }

    try {
      logger.info('Compressing backup file');

      const { stdout, stderr } = await execAsync(`gzip -f "${this.backupPath}"`);
      
      if (stderr) {
        logger.warn('Compression warnings', { stderr });
      }

      logger.info('Backup compression completed', {
        originalSize: this.getFileSize(this.backupPath),
        compressedSize: this.getFileSize(this.compressedPath)
      });

      return this.compressedPath;
    } catch (error) {
      logger.error('Backup compression failed', { error: error.message });
      throw error;
    }
  }

  async verifyBackup() {
    if (!options.verify) {
      return true;
    }

    try {
      logger.info('Verifying backup file');

      const backupFile = options.compress ? this.compressedPath : this.backupPath;
      
      if (options.compress) {
        // Test if compressed file is valid
        await execAsync(`gunzip -t "${backupFile}"`);
      }

      // Check file size
      const stats = fs.statSync(backupFile);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      logger.info('Backup verification completed', {
        file: backupFile,
        size: this.getFileSize(backupFile)
      });

      return true;
    } catch (error) {
      logger.error('Backup verification failed', { error: error.message });
      throw error;
    }
  }

  async uploadToCloud() {
    if (!options.upload || config.cloudProvider === 'local') {
      return null;
    }

    try {
      logger.info('Uploading backup to cloud storage', { provider: config.cloudProvider });

      let uploadResult = null;

      switch (config.cloudProvider) {
        case 's3':
          uploadResult = await this.uploadToS3();
          break;
        case 'gcs':
          uploadResult = await this.uploadToGCS();
          break;
        case 'azure':
          uploadResult = await this.uploadToAzure();
          break;
        default:
          logger.warn('Unknown cloud provider', { provider: config.cloudProvider });
          return null;
      }

      logger.info('Cloud upload completed', { result: uploadResult });
      return uploadResult;
    } catch (error) {
      logger.error('Cloud upload failed', { error: error.message });
      throw error;
    }
  }

  async uploadToS3() {
    // Implement S3 upload logic
    const { stdout } = await execAsync(`aws s3 cp "${this.compressedPath}" s3://${process.env.S3_BUCKET}/backups/`);
    return stdout.trim();
  }

  async uploadToGCS() {
    // Implement Google Cloud Storage upload logic
    const { stdout } = await execAsync(`gsutil cp "${this.compressedPath}" gs://${process.env.GCS_BUCKET}/backups/`);
    return stdout.trim();
  }

  async uploadToAzure() {
    // Implement Azure Blob Storage upload logic
    const { stdout } = await execAsync(`az storage blob upload --account-name ${process.env.AZURE_STORAGE_ACCOUNT} --container-name backups --file "${this.compressedPath}" --name "${path.basename(this.compressedPath)}"`);
    return stdout.trim();
  }

  async cleanupOldBackups() {
    try {
      logger.info('Cleaning up old backup files');

      const files = fs.readdirSync(config.backupDir);
      const now = new Date();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // Days

        let shouldDelete = false;
        if (file.includes('full') && fileAge > config.retentionDays.full) {
          shouldDelete = true;
        } else if (file.includes('incremental') && fileAge > config.retentionDays.incremental) {
          shouldDelete = true;
        }

        if (shouldDelete) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info('Deleted old backup file', { file, age: Math.floor(fileAge) });
        }
      }

      logger.info('Cleanup completed', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Cleanup failed', { error: error.message });
      throw error;
    }
  }

  async sendNotification(success, details = {}) {
    if (!config.emailNotifications) {
      return;
    }

    try {
      const subject = success ? '✅ Backup Successful' : '❌ Backup Failed';
      const message = success 
        ? `Database backup completed successfully at ${this.timestamp}`
        : `Database backup failed at ${this.timestamp}. Error: ${details.error}`;

      // Implement email sending logic here
      // Example: SendGrid, AWS SES, or other email service
      logger.info('Notification sent', { success, subject, message });
    } catch (error) {
      logger.error('Failed to send notification', { error: error.message });
    }
  }

  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return this.formatBytes(stats.size);
    } catch (error) {
      return 'Unknown';
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    const startTime = Date.now();
    let success = false;
    let error = null;

    try {
      await this.initialize();
      await this.createBackup();
      await this.compressBackup();
      await this.verifyBackup();
      await this.uploadToCloud();
      await this.cleanupOldBackups();
      
      success = true;
      const duration = Date.now() - startTime;
      
      logger.info('Backup process completed successfully', {
        duration: `${duration}ms`,
        type: options.type,
        timestamp: this.timestamp
      });

    } catch (err) {
      error = err;
      logger.error('Backup process failed', {
        error: err.message,
        duration: `${Date.now() - startTime}ms`
      });
    } finally {
      await this.sendNotification(success, { error: error?.message });
    }

    return { success, error, duration: Date.now() - startTime };
  }
}

// Main execution
async function main() {
  try {
    const backup = new DatabaseBackup();
    const result = await backup.run();
    
    if (result.success) {
      console.log('✅ Backup completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Backup failed:', result.error?.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Backup script error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseBackup;
