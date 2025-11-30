const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log('✓ Login successful');

    console.log('
=== STEP 2: NAVIGATE TO CONTACTS & COUNT BEFORE ===');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    const contactsBeforeElements = await page.$;
    const contactsBeforeCount = contactsBeforeElements.length;
    console.log();
    
    await page.screenshot({ path: 'screenshots/v3-import-full-01-before.png', fullPage: true });
    console.log('✓ Screenshot: v3-import-full-01-before.png');

    console.log('
=== STEP 3: CLICK IMPORT CONTACTS BUTTON ===');
    await page.click('button:has-text("Import Contacts"), button:has-text("Import")');
    await page.waitForTimeout(2000);
    console.log('✓ Import Contacts button clicked');

    console.log('
=== STEP 4: UPLOAD CSV FILE ===');
    const fileInput = await page.;
    if (!fileInput) {
      throw new Error('File input not found!');
    }
    await fileInput.setInputFiles('C:\Users\jwood\Downloads\usethisforuploadtest.csv');
    console.log('✓ CSV file uploaded');

    console.log('
=== STEP 5: WAIT FOR FILE PROCESSING (90 seconds) ===');
    await page.waitForTimeout(90000);
    console.log('✓ File processing wait complete');

    console.log('
=== STEP 6: CLICK AUTO-MAP COLUMNS ===');
    await page.click('button:has-text("Auto-Map"), button:has-text("Auto-Map Columns")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/v3-import-full-02-mapped.png', fullPage: true });
    console.log('✓ Auto-Map clicked, screenshot: v3-import-full-02-mapped.png');

    console.log('
=== STEP 7: CLICK NEXT TO GO TO STEP 3 (TAGS) ===');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v3-import-full-03-tags.png', fullPage: true });
    console.log('✓ Step 3 (Tags) reached, screenshot: v3-import-full-03-tags.png');

    console.log('
=== STEP 8: CLICK NEXT TO GO TO STEP 4 (DUPLICATES) ===');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v3-import-full-04-duplicates.png', fullPage: true });
    console.log('✓ Step 4 (Duplicates) reached, screenshot: v3-import-full-04-duplicates.png');

    console.log('
=== STEP 9: SELECT DUPLICATE HANDLING & GO TO STEP 5 (PREVIEW) ===');
    const skipOption = await page.;
    if (skipOption) {
      await skipOption.click();
      console.log('✓ Duplicate handling option selected');
    }
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/v3-import-full-05-preview.png', fullPage: true });
    console.log('✓ Step 5 (Preview) reached, screenshot: v3-import-full-05-preview.png');

    console.log('
=== STEP 10: CLICK IMPORT BUTTON ===');
    await page.click('button:has-text("Import"), button:has-text("Start Import")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v3-import-full-06-importing.png', fullPage: true });
    console.log('✓ Import button clicked, screenshot: v3-import-full-06-importing.png');

    console.log('
=== STEP 11: WAIT FOR IMPORT TO COMPLETE (90 seconds) ===');
    await page.waitForTimeout(90000);
    await page.screenshot({ path: 'screenshots/v3-import-full-07-complete.png', fullPage: true });
    console.log('✓ Import complete, screenshot: v3-import-full-07-complete.png');

    console.log('
=== STEP 12: CLOSE MODAL & VERIFY CONTACTS ===');
    const closeButton = await page.;
    if (closeButton) {
      await closeButton.click();
      await page.waitForTimeout(3000);
    }
    
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    const contactsAfterElements = await page.$;
    const contactsAfterCount = contactsAfterElements.length;
    console.log();
    console.log();
    
    await page.screenshot({ path: 'screenshots/v3-import-full-08-after.png', fullPage: true });
    console.log('✓ Screenshot: v3-import-full-08-after.png');

    console.log('
=== TEST SUMMARY ===');
    console.log();
    console.log();
    console.log();

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/v3-import-full-ERROR.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();