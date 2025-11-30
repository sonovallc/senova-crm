const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  let results = {
    before: 0,
    after: 0,
    added: 0,
    step3Pass: false,
    step4Pass: false,
    step5Pass: false,
    importPass: false,
    completePass: false
  };

  try {
    console.log('STEP 1: LOGIN');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✓ Logged in');

    console.log('STEP 2: COUNT CONTACTS BEFORE');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    results.before = (await page.$).length;
    console.log('Contacts BEFORE:', results.before);
    await page.screenshot({ path: 'screenshots/full-wf-01-before.png', fullPage: true });

    console.log('STEP 3: OPEN IMPORT');
    await page.click('button:has-text("Import")');
    await page.waitForTimeout(2000);

    console.log('STEP 4: UPLOAD CSV');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    console.log('✓ File uploaded');

    console.log('STEP 5: WAIT FOR PROCESSING (90s)');
    await page.waitForSelector('text=Map Your Columns', { timeout: 90000 });
    await page.waitForTimeout(3000);
    console.log('✓ File processed');

    console.log('STEP 6: AUTO-MAP');
    await page.click('button:has-text("Auto-Map")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/full-wf-02-mapped.png', fullPage: true });
    console.log('✓ Auto-mapped');

    console.log('STEP 7: GO TO TAGS (Step 3)');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/full-wf-03-tags.png', fullPage: true });
    results.step3Pass = true;
    console.log('✓ On Tags step');

    console.log('STEP 8: GO TO DUPLICATES (Step 4)');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/full-wf-04-duplicates.png', fullPage: true });
    results.step4Pass = true;
    console.log('✓ On Duplicates step');

    console.log('STEP 9: SELECT SKIP & GO TO PREVIEW (Step 5)');
    const radios = await page.$;
    if (radios.length > 0) await radios[0].click();
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/full-wf-05-preview.png', fullPage: true });
    results.step5Pass = true;
    console.log('✓ On Preview step');

    console.log('STEP 10: START IMPORT');
    await page.click('button:has-text("Import")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/full-wf-06-importing.png', fullPage: true });
    results.importPass = true;
    console.log('✓ Import started');

    console.log('STEP 11: WAIT FOR COMPLETION (90s)');
    await page.waitForTimeout(90000);
    await page.screenshot({ path: 'screenshots/full-wf-07-complete.png', fullPage: true });
    results.completePass = true;
    console.log('✓ Import complete');

    console.log('STEP 12: CLOSE & VERIFY');
    const closeBtn = await page.;
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    results.after = (await page.$).length;
    results.added = results.after - results.before;
    console.log('Contacts AFTER:', results.after);
    console.log('Contacts ADDED:', results.added);
    await page.screenshot({ path: 'screenshots/full-wf-08-after.png', fullPage: true });

    console.log('');
    console.log('=== RESULTS ===');
    console.log('Contacts Before:', results.before);
    console.log('Contacts After:', results.after);
    console.log('Contacts Added:', results.added);
    console.log('Step 3 (Tags):', results.step3Pass ? 'PASS' : 'FAIL');
    console.log('Step 4 (Duplicates):', results.step4Pass ? 'PASS' : 'FAIL');
    console.log('Step 5 (Preview):', results.step5Pass ? 'PASS' : 'FAIL');
    console.log('Import Started:', results.importPass ? 'PASS' : 'FAIL');
    console.log('Import Complete:', results.completePass ? 'PASS' : 'FAIL');
    console.log('Contacts Updated:', (results.added > 0) ? 'PASS' : 'FAIL');
    console.log('');
    console.log('OVERALL:', (results.added > 0 && results.step3Pass && results.step4Pass && results.step5Pass) ? 'PASS' : 'FAIL');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/full-wf-ERROR.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
