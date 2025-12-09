#!/usr/bin/env node

/**
 * Sync shared modules to all services
 * Runs automatically after npm install
 */

const fs = require('fs');
const path = require('path');

const targets = [
  'gateways/external-api-gateway',
  'gateways/internal-api-gateway',
  'api-gateway',
  'services/user-service',
  'services/product-service',
  'services/order-service',
  'services/delivery-service',
  'services/health-service',
  'services/notification-service',
  'services/chatbot-service'
];

const SHARED_DIR = path.join(__dirname, 'shared');

console.log('🔄 Syncing shared modules to all services and gateways...\n');

// Check if shared directory exists
if (!fs.existsSync(SHARED_DIR)) {
  console.error('❌ Error: shared/ directory not found!');
  process.exit(1);
}

// Get all .ts files in shared directory
const sharedFiles = fs.readdirSync(SHARED_DIR).filter(file => file.endsWith('.ts'));

if (sharedFiles.length === 0) {
  console.warn('⚠️  Warning: No .ts files found in shared/');
  process.exit(0);
}

let successCount = 0;
let errorCount = 0;

// Copy to each target
targets.forEach(target => {
  const targetSharedDir = path.join(__dirname, target, 'shared');

  try {
    // Create shared directory if it doesn't exist
    if (!fs.existsSync(targetSharedDir)) {
      fs.mkdirSync(targetSharedDir, { recursive: true });
    }

    // Copy each shared file
    sharedFiles.forEach(file => {
      const src = path.join(SHARED_DIR, file);
      const dest = path.join(targetSharedDir, file);
      fs.copyFileSync(src, dest);
    });

    console.log(`  ✅ ${target}`);
    successCount++;
  } catch (error) {
    console.error(`  ❌ ${target}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📦 Synced ${sharedFiles.length} file(s) to ${successCount} target(s)`);

if (errorCount > 0) {
  console.error(`⚠️  ${errorCount} target(s) failed to sync`);
  process.exit(1);
}

console.log('✅ All shared modules synced successfully!\n');
