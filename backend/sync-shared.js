#!/usr/bin/env node

/**
 * Sync shared modules to all services
 * Runs automatically after npm install
 */

const fs = require('fs');
const path = require('path');

const SERVICES = [
  'order-service',
  'user-service',
  'product-service',
  'health-service',
  'delivery-service',
  'notification-service',
  'chatbot-service'
];

const SHARED_DIR = path.join(__dirname, 'shared');
const SERVICES_DIR = path.join(__dirname, 'services');

console.log('🔄 Syncing shared modules to all services...\n');

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

// Copy to each service
SERVICES.forEach(service => {
  const serviceSharedDir = path.join(SERVICES_DIR, service, 'shared');

  try {
    // Create shared directory if it doesn't exist
    if (!fs.existsSync(serviceSharedDir)) {
      fs.mkdirSync(serviceSharedDir, { recursive: true });
    }

    // Copy each shared file
    sharedFiles.forEach(file => {
      const src = path.join(SHARED_DIR, file);
      const dest = path.join(serviceSharedDir, file);
      fs.copyFileSync(src, dest);
    });

    console.log(`  ✅ ${service}`);
    successCount++;
  } catch (error) {
    console.error(`  ❌ ${service}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📦 Synced ${sharedFiles.length} file(s) to ${successCount} service(s)`);

if (errorCount > 0) {
  console.error(`⚠️  ${errorCount} service(s) failed to sync`);
  process.exit(1);
}

console.log('✅ All shared modules synced successfully!\n');
