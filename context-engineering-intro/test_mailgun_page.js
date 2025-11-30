/**
 * Test script to verify Mailgun settings page is accessible
 *
 * Usage: node test_mailgun_page.js
 *
 * This script:
 * 1. Checks if the page file exists
 * 2. Attempts to access the route
 * 3. Verifies the page loads without 404
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const PAGE_PATH = path.join(__dirname, 'frontend/src/app/(dashboard)/dashboard/settings/integrations/mailgun/page.tsx');
const TEST_URL = 'http://localhost:3004/dashboard/settings/integrations/mailgun';

console.log('=== Mailgun Settings Page Verification ===\n');

// Check 1: File exists
console.log('1. Checking if page file exists...');
if (fs.existsSync(PAGE_PATH)) {
  console.log('   ✓ File exists at:', PAGE_PATH);
  console.log('   ✓ File size:', fs.statSync(PAGE_PATH).size, 'bytes');
} else {
  console.log('   ✗ File NOT found at:', PAGE_PATH);
  process.exit(1);
}

// Check 2: Test route accessibility
console.log('\n2. Testing route accessibility...');
console.log('   URL:', TEST_URL);

http.get(TEST_URL, (res) => {
  console.log('   Status Code:', res.statusCode);

  if (res.statusCode === 200) {
    console.log('   ✓ Page loads successfully!');

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      if (body.includes('Mailgun Configuration')) {
        console.log('   ✓ Page contains expected title: "Mailgun Configuration"');
      } else {
        console.log('   ⚠ Page loaded but title not found');
      }

      console.log('\n=== TEST PASSED ===');
      console.log('The Mailgun settings page is accessible and working!');
    });
  } else if (res.statusCode === 404) {
    console.log('   ✗ Page returns 404 - Route not found');
    console.log('\n   This usually means:');
    console.log('   - Next.js dev server needs to be restarted');
    console.log('   - Next.js cache (.next folder) needs to be cleared');
    console.log('\n   Try:');
    console.log('   1. Stop the dev server');
    console.log('   2. Delete the .next folder');
    console.log('   3. Restart: npm run dev');
    process.exit(1);
  } else {
    console.log('   ⚠ Unexpected status code:', res.statusCode);
  }
}).on('error', (err) => {
  console.log('   ✗ Connection error:', err.message);
  console.log('\n   Make sure:');
  console.log('   - Frontend dev server is running on port 3004');
  console.log('   - Run: npm run dev');
  process.exit(1);
});
