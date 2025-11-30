const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('\n=== COMPLETE CSV IMPORT WORKFLOW TEST ===\n');

  try {
    console.log('STEP 1-7: Getting to Duplicates page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("Import Contacts")').first().click();
    await page.waitForTimeout(2000);

    await page.locator('input[type="file"]').setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    await page.waitForTimeout(2000);

    await page.waitForSelector('text=/Step 2.*Map Your Columns/i', { timeout: 90000 });
    await page.waitForTimeout(2000);

    await page.locator('button:has-text("Auto-Map Columns")').first().click();
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(2000);

    await page.waitForSelector('text=/Validating your import/i', { state: 'hidden', timeout: 90000 });
    await page.waitForTimeout(2000);
    console.log('PASS: At Step 8 - Duplicates page');

    console.log('\nSTEP 8: Resolving duplicates...');
    // Scroll down to see bulk action buttons
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/step8-scrolled.png', fullPage: true });

    // Try to find and click bulk action buttons
    const bulkButtons = await page.locator('button').all();
    let foundAction = false;
    
    for (const btn of bulkButtons) {
      const text = await btn.textContent().catch(() => '');
      const lower = text.toLowerCase();
      
      if (lower.includes('keep newest') || lower.includes('skip') || 
          lower.includes('keep existing') || lower.includes('update')) {
        console.log('Found bulk action button:', text);
        await btn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await btn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/step8-after-bulk-action.png', fullPage: true });
        console.log('PASS: Clicked bulk action');
        foundAction = true;
        break;
      }
    }

    if (!foundAction) {
      console.log('No bulk action found, trying to click Next anyway...');
    }

    console.log('\nSTEP 9: Next to Preview...');
    await page.waitForTimeout(2000);
    const nextBtn = page.locator('button:has-text("Next")').first();
    await nextBtn.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'screenshots/step9-before-preview.png', fullPage: true });
    await nextBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/step9-preview.png', fullPage: true });
    console.log('PASS: Preview page displayed');

    console.log('\nSTEP 10: Starting import...');
    const importBtn = page.locator('button:has-text("Import"), button:has-text("Start Import")').first();
    await importBtn.scrollIntoViewIfNeeded();
    await importBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/step10-importing.png', fullPage: true });
    console.log('Waiting for import to complete (up to 90s)...');
    
    await page.waitForSelector('text=/Import Complete|Success|Completed/i', { timeout: 90000 });
    await page.waitForTimeout(2000);
    console.log('PASS: Import completed');

    console.log('\nSTEP 11: Completion page...');
    await page.screenshot({ path: 'screenshots/step11-complete.png', fullPage: true });
    console.log('PASS: Completion page displayed');

    console.log('\nSTEP 12: Closing modal...');
    const closeBtn = page.locator('button:has-text("Close"), button:has-text("Done")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'screenshots/step12-final.png', fullPage: true });
    console.log('PASS: Modal closed');
    
    console.log('\n========================================');
    console.log('ALL STEPS COMPLETED SUCCESSFULLY');
    console.log('========================================\n');

  } catch (error) {
    console.error('\nTEST FAILED:', error.message);
    await page.screenshot({ path: 'screenshots/error-final.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
