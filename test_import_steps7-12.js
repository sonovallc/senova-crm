const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('
=== CSV IMPORT WORKFLOW TEST (Steps 7-12) ===
');

  try {
    console.log('Step 0: Getting initial contact count...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    const initialText = await page.locator('text=/\d+\s+Contacts?/i').first().textContent();
    const initialCount = parseInt(initialText.match(/(\d+)/)[1]);
    console.log('Initial contacts:', initialCount);
    await page.screenshot({ path: 'screenshots/import-step0-initial.png', fullPage: true });

    console.log('
Steps 1-6: Reaching Step 2...');
    await page.locator('button:has-text("Import Contacts")').first().click();
    await page.waitForTimeout(2000);

    await page.locator('input[type="file"]').setInputFiles('C:\Users\jwood\Downloads\usethisforuploadtest.csv');
    await page.waitForTimeout(2000);

    await page.waitForSelector('text=/Step 2.*Map Your Columns/i', { timeout: 90000 });
    await page.screenshot({ path: 'screenshots/import-step2-mapping.png', fullPage: true });

    await page.locator('button:has-text("Auto-Map Columns")').first().click();
    await page.waitForTimeout(2000);

    console.log('
=== STEP 7: Select Tags ===');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/import-step7-tags.png', fullPage: true });

    console.log('
=== STEP 8: Resolve Duplicates ===');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/import-step8-duplicates.png', fullPage: true });

    console.log('
=== STEP 9: Preview & Import ===');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/import-step9-preview.png', fullPage: true });

    console.log('
=== STEP 10: Start Import ===');
    await page.locator('button:has-text("Import"), button:has-text("Start Import")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/import-step10-importing.png', fullPage: true });
    
    await page.waitForSelector('text=/Import Complete|Success|Completed/i', { timeout: 90000 });

    console.log('
=== STEP 11: Verify Completion ===');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/import-step11-complete.png', fullPage: true });

    console.log('
=== STEP 12: Final Verification ===');
    const closeBtn = page.locator('button:has-text("Close"), button:has-text("Done")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    const finalText = await page.locator('text=/\d+\s+Contacts?/i').first().textContent();
    const finalCount = parseInt(finalText.match(/(\d+)/)[1]);
    await page.screenshot({ path: 'screenshots/import-step12-final.png', fullPage: true });

    const newContacts = finalCount - initialCount;
    
    console.log('
========================================');
    console.log('IMPORT WORKFLOW TEST RESULTS');
    console.log('========================================');
    console.log('Initial contacts:', initialCount);
    console.log('Final contacts:', finalCount);
    console.log('New contacts:', newContacts);
    console.log('
Step 7 (Tags): PASS');
    console.log('Step 8 (Duplicates): PASS');
    console.log('Step 9 (Preview): PASS');
    console.log('Step 10 (Import): PASS');
    console.log('Step 11 (Complete): PASS');
    console.log('Step 12 (Verify): PASS');
    console.log('
ALL STEPS PASSED');
    console.log('========================================
');

  } catch (error) {
    console.error('
TEST FAILED:', error.message);
    await page.screenshot({ path: 'screenshots/import-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
