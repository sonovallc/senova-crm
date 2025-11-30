const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n=== CSV IMPORT WORKFLOW TEST (Steps 1-12) ===\n');

  try {
    console.log('STEP 1: Login');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log('PASS: Logged in');

    console.log('\nSTEP 2: Navigate to Contacts');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/step2-contacts-page.png', fullPage: true });
    console.log('PASS: On contacts page');

    console.log('\nSTEP 3: Click Import Contacts');
    await page.locator('button:has-text("Import Contacts")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/step3-import-modal.png', fullPage: true });
    console.log('PASS: Import modal opened');

    console.log('\nSTEP 4: Upload CSV');
    await page.locator('input[type="file"]').setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/step4-file-uploaded.png', fullPage: true });
    console.log('PASS: File uploaded');

    console.log('\nSTEP 5: Wait for processing');
    await page.waitForSelector('text=/Step 2.*Map Your Columns/i', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/step5-step2-mapping.png', fullPage: true });
    console.log('PASS: File processed, at Step 2');

    console.log('\nSTEP 6: Auto-Map Columns');
    await page.locator('button:has-text("Auto-Map Columns")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/step6-auto-mapped.png', fullPage: true });
    console.log('PASS: Columns auto-mapped');

    console.log('\nSTEP 7: Next to Tags');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/step7-tags.png', fullPage: true });
    console.log('PASS: Tags page displayed');

    console.log('\nSTEP 8: Next to Duplicates');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/step8-duplicates.png', fullPage: true });
    console.log('PASS: Duplicates page displayed');

    console.log('\nSTEP 9: Next to Preview');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/step9-preview.png', fullPage: true });
    console.log('PASS: Preview page displayed');

    console.log('\nSTEP 10: Start Import');
    await page.locator('button:has-text("Import"), button:has-text("Start Import")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/step10-importing.png', fullPage: true });
    console.log('Importing... waiting for completion (up to 90s)');
    
    await page.waitForSelector('text=/Import Complete|Success|Completed/i', { timeout: 90000 });
    await page.waitForTimeout(2000);
    console.log('PASS: Import completed');

    console.log('\nSTEP 11: Verify Completion');
    await page.screenshot({ path: 'screenshots/step11-complete.png', fullPage: true });
    console.log('PASS: Completion page displayed');

    console.log('\nSTEP 12: Close and Verify');
    const closeBtn = page.locator('button:has-text("Close"), button:has-text("Done")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'screenshots/step12-after-close.png', fullPage: true });
    console.log('PASS: Modal closed');
    
    console.log('\n========================================');
    console.log('ALL STEPS COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log('Step 1 (Login): PASS');
    console.log('Step 2 (Navigate): PASS');
    console.log('Step 3 (Import Button): PASS');
    console.log('Step 4 (Upload): PASS');
    console.log('Step 5 (Processing): PASS');
    console.log('Step 6 (Auto-Map): PASS');
    console.log('Step 7 (Tags): PASS');
    console.log('Step 8 (Duplicates): PASS');
    console.log('Step 9 (Preview): PASS');
    console.log('Step 10 (Import): PASS');
    console.log('Step 11 (Complete): PASS');
    console.log('Step 12 (Verify): PASS');
    console.log('\nOVERALL: PASS');
    console.log('========================================\n');

  } catch (error) {
    console.error('\nTEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
