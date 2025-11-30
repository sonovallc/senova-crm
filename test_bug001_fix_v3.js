const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n=== BUG-001: CSV Import 0 New Contacts Fix Verification ===\n');

  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('Login successful\n');

    console.log('Step 2: Navigate to Import page...');
    await page.goto('http://localhost:3004/dashboard/contacts/import', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001-step0-import-page.png', fullPage: true });
    console.log('On import page\n');

    console.log('Step 3: Upload CSV file...');
    await page.locator('input[type="file"]').setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    await page.waitForTimeout(3000);
    console.log('Waiting for file processing to complete...');
    
    // Wait for "Processing file..." text to disappear (max 90 seconds)
    await page.waitForSelector('text="Processing file..."', { state: 'hidden', timeout: 90000 });
    console.log('File processing complete\n');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001-step1-upload-complete.png', fullPage: true });

    console.log('Step 4: Click Next to go to mapping...');
    const nextButton1 = page.locator('button:has-text("Next")').first();
    await nextButton1.waitFor({ state: 'visible', timeout: 10000 });
    await nextButton1.click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug001-step2-before-map.png', fullPage: true });
    console.log('On mapping page\n');

    console.log('Step 5: Auto-map columns...');
    await page.locator('button:has-text("Auto-Map")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001-step2-mapping.png', fullPage: true });
    console.log('Columns mapped\n');

    console.log('Step 6: Click Next to go to Tags...');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug001-step3-tags.png', fullPage: true });
    console.log('On tags page\n');

    console.log('Step 7: Click Next/Skip to go to Review Duplicates...');
    await page.locator('button:has-text("Next"), button:has-text("Skip")').first().click();
    await page.waitForTimeout(3000);
    console.log('Navigated to Review Duplicates - waiting for API call...\n');
    
    console.log('=== CRITICAL TEST: Review Duplicates (Step 4) ===');
    console.log('Waiting 10 seconds for /validate-duplicates API call...');
    await page.waitForTimeout(10000);
    
    await page.screenshot({ path: 'screenshots/bug001-step4-review.png', fullPage: true });

    const pageText = await page.textContent('body');
    console.log('\n=== PAGE CONTENT ANALYSIS ===');
    
    const newMatch = pageText.match(/(\d+)\s*new/i);
    const duplicatesMatch = pageText.match(/(\d+)\s*duplicate/i);
    const conflictsMatch = pageText.match(/(\d+)\s*conflict/i);
    const invalidMatch = pageText.match(/(\d+)\s*invalid/i);

    console.log('\nCounts Found on Page:');
    console.log('- New contacts:', newMatch ? newMatch[1] : 'NOT FOUND');
    console.log('- Duplicates:', duplicatesMatch ? duplicatesMatch[1] : 'NOT FOUND');
    console.log('- Conflicts:', conflictsMatch ? conflictsMatch[1] : 'NOT FOUND');
    console.log('- Invalid:', invalidMatch ? invalidMatch[1] : 'NOT FOUND');

    console.log('\n=== VERIFICATION RESULTS ===');
    
    const newCount = newMatch ? parseInt(newMatch[1]) : 0;
    
    if (newCount > 0) {
      console.log('\nPASS: Fix worked! New contacts count is ' + newCount);
      console.log('The /validate-duplicates endpoint is returning proper ValidationSummary');
      console.log('BUG-001 is RESOLVED');
    } else {
      console.log('\nFAIL: Bug still present! New contacts count is 0');
      console.log('The fix did NOT work - API may not be returning correct structure');
      console.log('BUG-001 is still ACTIVE');
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log('Test completed successfully');
    console.log('Screenshots saved to screenshots/ directory');
    console.log('Final Result:', newCount > 0 ? 'PASS' : 'FAIL');

  } catch (error) {
    console.error('\nERROR during test:', error.message);
    await page.screenshot({ path: 'screenshots/bug001-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
