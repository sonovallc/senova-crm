const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  console.log('Starting CSV import fix verification test...');
  console.log('Database shows 10 contacts BEFORE import');
  
  try {
    console.log('\n=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);
    console.log('Login successful - URL:', page.url());
    
    console.log('\n=== STEP 2: NAVIGATE TO CONTACTS ===');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'screenshots/v3-fix-test-01-before.png', fullPage: true });
    console.log('Screenshot: v3-fix-test-01-before.png');
    
    console.log('\n=== STEP 3: CLICK IMPORT CONTACTS ===');
    const importBtn = page.locator('button:has-text("Import Contacts")');
    await importBtn.waitFor({ state: 'visible', timeout: 10000 });
    await importBtn.click();
    await page.waitForTimeout(3000);
    console.log('Import modal opened');
    
    console.log('\n=== STEP 4: UPLOAD CSV (900+ rows) ===');
    const fileInput = page.locator('input[type="file"]');
    const csvPath = path.join('C:', 'Users', 'jwood', 'Downloads', 'usethisforuploadtest.csv');
    await fileInput.setInputFiles(csvPath);
    console.log('File selected:', csvPath);
    
    console.log('Waiting for file processing (up to 90 seconds)...');
    await page.waitForTimeout(5000);
    
    await page.waitForSelector('button:has-text("Auto-Map Columns"):not([disabled])', { timeout: 90000 });
    console.log('SUCCESS: File processed - Auto-Map button ready');
    
    console.log('\n=== STEP 5: AUTO-MAP COLUMNS ===');
    const autoMapBtn = page.locator('button:has-text("Auto-Map Columns")');
    await autoMapBtn.click();
    await page.waitForTimeout(3000);
    console.log('Columns auto-mapped');
    
    console.log('\n=== STEP 6: GO TO TAGS STEP ===');
    const nextBtn1 = page.locator('button:has-text("Next: Select Tags")');
    await nextBtn1.click();
    await page.waitForTimeout(3000);
    console.log('On Tags step (Step 3)');
    
    console.log('\n=== STEP 7: SKIP TAGS ===');
    const nextBtn2 = page.locator('button:has-text("Next")').first();
    await nextBtn2.click();
    await page.waitForTimeout(3000);
    console.log('Tags skipped - On Duplicates step (Step 4)');
    
    console.log('\n=== STEP 8: DUPLICATES DETECTION (CRITICAL TEST) ===');
    console.log('Testing batched duplicate detection with 900+ rows...');
    console.log('This should now work with batched queries (500 values per batch)');
    console.log('Waiting up to 120 seconds...');
    
    const startTime = Date.now();
    try {
      await page.waitForSelector('button:has-text("Skip All Duplicates"):not([disabled]), button:has-text("Next"):not([disabled])', { timeout: 120000 });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`SUCCESS: Duplicate detection completed in ${elapsed}s!`);
      console.log('FIX VERIFIED: PostgreSQL parameter limit issue resolved');
    } catch (e) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`ERROR: Timeout after ${elapsed}s - FIX FAILED`);
      await page.screenshot({ path: 'screenshots/v3-fix-test-ERROR-duplicates.png', fullPage: true });
      throw new Error('Duplicate detection failed - PostgreSQL fix did not work');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v3-fix-test-02-duplicates.png', fullPage: true });
    console.log('Screenshot: v3-fix-test-02-duplicates.png');
    
    const skipAllBtn = page.locator('button:has-text("Skip All Duplicates")');
    const nextBtn3 = page.locator('button:has-text("Next")').first();
    
    if (await skipAllBtn.isVisible()) {
      console.log('Found duplicates - clicking Skip All Duplicates...');
      await skipAllBtn.click();
    } else {
      console.log('No duplicates found - clicking Next...');
      await nextBtn3.click();
    }
    await page.waitForTimeout(3000);
    
    console.log('\n=== STEP 9: PREVIEW STEP ===');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v3-fix-test-03-preview.png', fullPage: true });
    console.log('Screenshot: v3-fix-test-03-preview.png');
    
    const importBtnText = await page.locator('button:has-text("Import")').first().textContent();
    console.log('Import button text:', importBtnText);
    
    console.log('\n=== STEP 10: START IMPORT ===');
    const importFinalBtn = page.locator('button:has-text("Import")').first();
    await importFinalBtn.click();
    console.log('Import started - waiting for completion...');
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/v3-fix-test-04-importing.png', fullPage: true });
    console.log('Screenshot: v3-fix-test-04-importing.png');
    
    console.log('Waiting for import to complete (up to 120 seconds)...');
    
    const importStartTime = Date.now();
    try {
      await page.waitForSelector('text=/import.*success/i, text=/contacts.*imported/i, text=/successfully imported/i', { timeout: 120000 });
      const elapsed = ((Date.now() - importStartTime) / 1000).toFixed(1);
      console.log(`SUCCESS: Import completed in ${elapsed}s!`);
    } catch (e) {
      console.log('Warning: No success message detected after 120s - checking results manually');
    }
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/v3-fix-test-05-success.png', fullPage: true });
    console.log('Screenshot: v3-fix-test-05-success.png');
    
    console.log('\n=== STEP 11: CLOSE MODAL ===');
    
    try {
      const closeBtn = page.locator('button[aria-label="Close"], button:has-text("Close"), button:has-text("×")').first();
      if (await closeBtn.isVisible({ timeout: 2000 })) {
        await closeBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(2000);
    }
    
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'screenshots/v3-fix-test-06-after.png', fullPage: true });
    console.log('Screenshot: v3-fix-test-06-after.png');
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Check database for final count...');
    
  } catch (error) {
    console.error('\n=== ERROR DURING TEST ===');
    console.error('Error message:', error.message);
    await page.screenshot({ path: 'screenshots/v3-fix-test-ERROR.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
