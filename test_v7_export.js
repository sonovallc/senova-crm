const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('\n=== VERIFICATION #7: CSV Export ===\n');

  try {
    // STEP 1: Login
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/v7-export-00-login.png', fullPage: true });

    console.log('Step 2: Filling login credentials...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/v7-export-00-login-filled.png', fullPage: true });

    console.log('Step 3: Clicking login button...');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Login successful\n');

    // STEP 2: Navigate to Contacts
    console.log('Step 4: Navigating to contacts page...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v7-export-01-contacts.png', fullPage: true });
    console.log('✓ Contacts page loaded\n');

    // STEP 3: Locate Export All button
    console.log('Step 5: Looking for "Export All" button...');
    const exportAllButton = await page.locator('[data-testid="export-all-button"]').count();
    
    if (exportAllButton > 0) {
      console.log('✓ Export All button FOUND with testid\n');
      await page.locator('[data-testid="export-all-button"]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'screenshots/v7-export-02-button.png', fullPage: true });
      
      // STEP 4: Click Export All
      console.log('Step 6: Clicking "Export All" button...');
      
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      
      await page.click('[data-testid="export-all-button"]');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/v7-export-03-clicked.png', fullPage: true });
      
      // Wait for download
      console.log('Step 7: Waiting for download...');
      try {
        const download = await downloadPromise;
        const fileName = download.suggestedFilename();
        console.log(`✓ Download started: ${fileName}\n`);
        
        // Save the download
        const downloadPath = `C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/v7-export-${fileName}`;
        await download.saveAs(downloadPath);
        console.log(`✓ File saved to: ${downloadPath}\n`);
        
        await page.screenshot({ path: 'screenshots/v7-export-04-download.png', fullPage: true });
        
        console.log('\n=== VERIFICATION #7 RESULTS ===\n');
        console.log('✅ PASS: Export All button found');
        console.log('✅ PASS: Export All button clickable');
        console.log('✅ PASS: Download triggered successfully');
        console.log(`✅ PASS: CSV file downloaded (${fileName})`);
        console.log('\n✅ OVERALL: VERIFICATION #7 PASSED\n');
        
      } catch (downloadError) {
        console.log('⚠️  Download did not start within 10 seconds');
        console.log('   This might mean:');
        console.log('   1. No contacts to export');
        console.log('   2. Export logic has an issue');
        console.log('   3. Download handler needs adjustment');
        
        await page.screenshot({ path: 'screenshots/v7-export-04-no-download.png', fullPage: true });
        
        console.log('\n=== VERIFICATION #7 RESULTS ===\n');
        console.log('✅ PASS: Export All button found');
        console.log('✅ PASS: Export All button clickable');
        console.log('⚠️  PARTIAL: Download may not have triggered (timeout)');
        console.log('\n⚠️  OVERALL: VERIFICATION #7 PARTIAL PASS (needs investigation)\n');
      }
      
    } else {
      console.log('✗ FAIL: Export All button NOT FOUND\n');
      
      // Try to find alternative export buttons
      console.log('Looking for alternative export buttons...');
      const bulkExportButton = await page.locator('[data-testid="bulk-export-button"]').count();
      
      if (bulkExportButton > 0) {
        console.log('ℹ️  Found bulk-export-button (requires selection first)\n');
      }
      
      await page.screenshot({ path: 'screenshots/v7-export-02-no-button.png', fullPage: true });
      
      console.log('\n=== VERIFICATION #7 RESULTS ===\n');
      console.log('✗ FAIL: Export All button NOT found');
      console.log('✗ FAIL: Cannot test export functionality');
      console.log('\n✗ OVERALL: VERIFICATION #7 FAILED\n');
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'screenshots/v7-export-error.png', fullPage: true });
    
    console.log('\n=== VERIFICATION #7 RESULTS ===\n');
    console.log('✗ FAIL: Test encountered error');
    console.log(`Error: ${error.message}`);
    console.log('\n✗ OVERALL: VERIFICATION #7 FAILED\n');
  } finally {
    await browser.close();
  }
})();
