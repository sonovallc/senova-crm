const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('
=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Success: Login successful');

    console.log('
=== STEP 2: NAVIGATE TO CONTACTS & COUNT BEFORE ===');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const before = (await page.25992('tbody tr')).length;
    console.log('Contacts BEFORE import: ' + before);
    await page.screenshot({ path: 'screenshots/v3-full-01-before.png', fullPage: true });

    console.log('
=== STEP 3: OPEN IMPORT MODAL ===');
    await page.click('button:has-text("Import")');
    await page.waitForTimeout(2000);
    console.log('Success: Import modal opened');

    console.log('
=== STEP 4: UPLOAD CSV FILE ===');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    console.log('Success: CSV uploaded');

    console.log('
=== STEP 5: WAIT FOR FILE PROCESSING (90 seconds) ===');
    await page.waitForSelector('text=Map Your Columns', { timeout: 90000 });
    await page.waitForTimeout(3000);
    console.log('Success: File processed');

    console.log('
=== STEP 6: CLICK AUTO-MAP COLUMNS ===');
    await page.click('button:has-text("Auto-Map")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/v3-full-02-mapped.png', fullPage: true });
    console.log('Success: Auto-mapped');

    console.log('
=== STEP 7: CLICK NEXT TO GO TO STEP 3 (TAGS) ===');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v3-full-03-tags.png', fullPage: true });
    console.log('Success: On Tags step');

    console.log('
=== STEP 8: CLICK NEXT TO GO TO STEP 4 (DUPLICATES) ===');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v3-full-04-duplicates.png', fullPage: true });
    console.log('Success: On Duplicates step');

    console.log('
=== STEP 9: SELECT DUPLICATE HANDLING & GO TO STEP 5 (PREVIEW) ===');
    const radios = await page.25992('input[type="radio"]');
    if (radios.length > 0) await radios[0].click();
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/v3-full-05-preview.png', fullPage: true });
    console.log('Success: On Preview step');

    console.log('
=== STEP 10: CLICK IMPORT BUTTON ===');
    await page.click('button:has-text("Import")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v3-full-06-importing.png', fullPage: true });
    console.log('Success: Import started');

    console.log('
=== STEP 11: WAIT FOR IMPORT TO COMPLETE (90 seconds) ===');
    await page.waitForTimeout(90000);
    await page.screenshot({ path: 'screenshots/v3-full-07-complete.png', fullPage: true });
    console.log('Success: Import complete');

    console.log('
=== STEP 12: CLOSE MODAL & VERIFY CONTACTS ===');
    const closeBtn = await page.;
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const after = (await page.25992('tbody tr')).length;
    console.log('Contacts AFTER import: ' + after);
    console.log('Contacts ADDED: ' + (after - before));
    await page.screenshot({ path: 'screenshots/v3-full-08-after.png', fullPage: true });

    console.log('
=== TEST RESULTS ===');
    console.log('BEFORE: ' + before);
    console.log('AFTER: ' + after);
    console.log('ADDED: ' + (after - before));
    console.log('STATUS: ' + ((after > before) ? 'PASS' : 'FAIL'));

  } catch (error) {
    console.error('
ERROR: ' + error.message);
    await page.screenshot({ path: 'screenshots/v3-full-ERROR.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
