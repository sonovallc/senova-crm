const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== BUG-001: CSV Import 0 New Contacts Fix Verification ===
');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('✓ Login successful
');

    // Step 2: Navigate to Import
    console.log('Step 2: Navigating to CSV Import...');
    await page.goto('http://localhost:3004/dashboard/contacts/import', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001-step0-import-page.png', fullPage: true });
    console.log('✓ On import page
');

    // Step 3: Upload CSV file
    console.log('Step 3: Uploading CSV file...');
    const csvPath = 'C:\Users\jwood\Downloads\usethisforuploadtest.csv';
    
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);
    
    console.log('✓ File selected, waiting for processing...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/bug001-step1-upload.png', fullPage: true });
    
    const nextButton = await page.locator('button:has-text("Next")').first();
    await nextButton.click();
    console.log('✓ Clicked Next from Step 1
');

    // Step 4: Map Columns
    console.log('Step 4: Mapping columns...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug001-step2-before-automap.png', fullPage: true });
    
    const autoMapButton = await page.locator('button:has-text("Auto-Map")').first();
    if (await autoMapButton.isVisible()) {
      console.log('Clicking Auto-Map Columns...');
      await autoMapButton.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'screenshots/bug001-step2-mapping.png', fullPage: true });
    
    const nextButton2 = await page.locator('button:has-text("Next")').first();
    await nextButton2.click();
    console.log('✓ Clicked Next from Step 2
');

    // Step 5: Tags - Skip
    console.log('Step 5: Tags step...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug001-step3-tags.png', fullPage: true });
    
    const nextButton3 = await page.locator('button:has-text("Next"), button:has-text("Skip")').first();
    await nextButton3.click();
    console.log('✓ Skipped tags step
');

    // Step 6: Review Duplicates - CRITICAL TEST
    console.log('Step 6: Review Duplicates - THE CRITICAL TEST');
    console.log('Waiting for validation to complete...');
    await page.waitForTimeout(10000);
    
    await page.screenshot({ path: 'screenshots/bug001-step4-review.png', fullPage: true });

    const pageText = await page.textContent('body');
    console.log('
=== PAGE CONTENT ANALYSIS ===');
    
    const newMatch = pageText.match(/(d+)s*new/i);
    const duplicatesMatch = pageText.match(/(d+)s*duplicate/i);
    const conflictsMatch = pageText.match(/(d+)s*conflict/i);
    const invalidMatch = pageText.match(/(d+)s*invalid/i);

    console.log('
Counts Found on Page:');
    console.log('- New contacts:', newMatch ? newMatch[1] : 'NOT FOUND');
    console.log('- Duplicates:', duplicatesMatch ? duplicatesMatch[1] : 'NOT FOUND');
    console.log('- Conflicts:', conflictsMatch ? conflictsMatch[1] : 'NOT FOUND');
    console.log('- Invalid:', invalidMatch ? invalidMatch[1] : 'NOT FOUND');

    await page.waitForTimeout(3000);

    console.log('
=== VERIFICATION RESULTS ===');
    
    const newCount = newMatch ? parseInt(newMatch[1]) : 0;
    
    if (newCount > 0) {
      console.log('✓ PASS: Fix worked! New contacts count is', newCount);
      console.log('✓ The /validate-duplicates endpoint is returning proper ValidationSummary');
    } else {
      console.log('✗ FAIL: Bug still present! New contacts count is 0');
      console.log('✗ The fix did NOT work');
    }

    console.log('
=== TEST SUMMARY ===');
    console.log('Test completed');
    console.log('Screenshots saved to screenshots/ directory');
    console.log('
Result:', newCount > 0 ? 'PASS ✓' : 'FAIL ✗');

  } catch (error) {
    console.error('
✗ ERROR during test:', error.message);
    await page.screenshot({ path: 'screenshots/bug001-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();