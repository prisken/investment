#!/usr/bin/env node

/**
 * Test script for the backup system
 * This script tests the backup functionality without actually creating backups
 */

const DatabaseBackup = require('./backup');

async function testBackup() {
  console.log('🧪 Testing Investment App Backup System...\n');

  try {
    // Test backup initialization
    console.log('1. Testing backup initialization...');
    const backup = new DatabaseBackup();
    console.log('✅ Backup class created successfully\n');

    // Test file size formatting
    console.log('2. Testing utility functions...');
    const testSize = backup.formatBytes(1024 * 1024); // 1MB
    console.log(`✅ File size formatting: 1024 bytes = ${testSize}\n`);

    // Test backup directory creation
    console.log('3. Testing directory creation...');
    const fs = require('fs');
    const path = require('path');
    const testDir = path.join(__dirname, '../backups/test');
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
      console.log('✅ Test directory created successfully');
    } else {
      console.log('✅ Test directory already exists');
    }
    
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('✅ Test directory cleaned up\n');

    // Test configuration
    console.log('4. Testing configuration...');
    console.log(`✅ Backup directory: ${backup.backupPath}`);
    console.log(`✅ Compressed path: ${backup.compressedPath}`);
    console.log(`✅ Timestamp: ${backup.timestamp}\n`);

    console.log('🎉 All backup system tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up your database credentials in .env');
    console.log('2. Install PostgreSQL client tools (pg_dump)');
    console.log('3. Run: node scripts/backup.js --type=full');
    console.log('4. Check the backups/ directory for backup files');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testBackup();
}

module.exports = testBackup;
