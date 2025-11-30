const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    console.log('[BROWSER ' + msg.type().toUpperCase() + '] ' + msg.text());
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR] ' + error.message);
    consoleLogs.push({
      type: 'pageerror',
      text: error.message,
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('\n=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/v3-import-test-00-login.png', fullPage: true });

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Success: Login successful');

    console.log('\n=== STEP 2: NAVIGATE TO CONTACTS ===');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v3-import-test-01-contacts.png', fullPage: true });
    console.log('Success: On contacts page');

    console.log('\n=== STEP 3: OPEN IMPORT MODAL ===');
    const importButton = await page.locator('button:has-text("Import")').first();
    await importButton.waitFor({ state: 'visible', timeout: 5000 });
    await importButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v3-import-test-02-modal.png', fullPage: true });
    console.log('Success: Import modal opened');

    console.log('\n=== STEP 4: UPLOAD CSV FILE ===');
    const csvPath = 'C:/Users/jwood/Downloads/usethisforuploadtest.csv';
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.screenshot({ path: 'screenshots/v3-import-test-03-file-selected.png', fullPage: true });
    console.log('Success: CSV file selected');

    console.log('\n=== STEP 5: WAIT FOR FILE PROCESSING (up to 90 seconds) ===');
    await page.waitForSelector('text=Map Your Columns', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v3-import-test-04-step2.png', fullPage: true });
    console.log('Success: File processing complete, on mapping step');

    console.log('\n=== STEP 6: CAPTURE CONSOLE LOGS BEFORE AUTO-MAP ===');
    console.log('Console logs before auto-map: ' + consoleLogs.length);
    const logsBeforeAutoMap = consoleLogs.length;

    console.log('\n=== STEP 7: TAKE SCREENSHOT BEFORE AUTO-MAP ===');
    await page.screenshot({ path: 'screenshots/v3-import-test-05-before-automap.png', fullPage: true });

    const autoMapButton = await page.locator('button:has-text("Auto-Map")').first();
    const isVisible = await autoMapButton.isVisible();
    console.log('Auto-Map button visible: ' + isVisible);

    console.log('\n=== STEP 8: CLICK AUTO-MAP COLUMNS ===');
    await autoMapButton.click();
    console.log('Success: Clicked Auto-Map Columns button');

    await page.waitForTimeout(2000);

    console.log('\n=== STEP 9: CAPTURE CONSOLE LOGS AFTER AUTO-MAP ===');
    const logsAfterAutoMap = consoleLogs.length;
    console.log('New console logs: ' + (logsAfterAutoMap - logsBeforeAutoMap));

    const autoMapLogs = consoleLogs.filter(log => 
      log.text.includes('[AUTO-MAP]') || 
      log.text.includes('Auto-Map') ||
      log.text.includes('autoMap') ||
      log.text.includes('availableFields') ||
      log.text.includes('mapping')
    );

    console.log('\n=== AUTO-MAP RELATED CONSOLE LOGS ===');
    autoMapLogs.forEach(log => {
      console.log('[' + log.type + '] ' + log.text);
    });

    console.log('\n=== ALL CONSOLE LOGS AFTER AUTO-MAP CLICK ===');
    consoleLogs.slice(logsBeforeAutoMap).forEach(log => {
      console.log('[' + log.type + '] ' + log.text);
    });

    await page.screenshot({ path: 'screenshots/v3-import-test-06-after-automap.png', fullPage: true });

    console.log('\n=== STEP 10: CHECK DROPDOWN MAPPINGS ===');
    const selects = await page.locator('select').all();
    console.log('Found ' + selects.length + ' dropdown selects');

    for (let i = 0; i < selects.length; i++) {
      const value = await selects[i].evaluate(el => el.value);
      const options = await selects[i].evaluate(el => 
        Array.from(el.options).map(opt => opt.text)
      );
      console.log('Dropdown ' + i + ': value="' + value + '", options count=' + options.length);
      if (options.length <= 10) {
        console.log('  Options: ' + options.join(', '));
      }
    }

    await page.screenshot({ path: 'screenshots/v3-import-test-07-mappings.png', fullPage: true });

    console.log('\n=== STEP 11: CHECK NEXT BUTTON STATUS ===');
    const nextButtons = await page.locator('button:has-text("Next")').all();
    console.log('Found ' + nextButtons.length + ' Next button(s)');
    
    for (let i = 0; i < nextButtons.length; i++) {
      const isDisabled = await nextButtons[i].isDisabled();
      const isVisible = await nextButtons[i].isVisible();
      console.log('Next button ' + i + ': disabled=' + isDisabled + ', visible=' + isVisible);
    }

    await page.screenshot({ path: 'screenshots/v3-import-test-08-next-button.png', fullPage: true });

    console.log('\n=== FINAL REPORT ===');
    console.log('Total console logs captured: ' + consoleLogs.length);
    console.log('Auto-map related logs: ' + autoMapLogs.length);
    
    const fs = require('fs');
    fs.writeFileSync(
      'screenshots/v3-import-console-logs.json',
      JSON.stringify(consoleLogs, null, 2)
    );
    console.log('Success: Full console logs saved to screenshots/v3-import-console-logs.json');

    const hasAutoMapLogs = autoMapLogs.length > 0;
    const hasDropdownChanges = selects.length > 0;
    
    console.log('\n=== TEST RESULT ===');
    if (hasAutoMapLogs) {
      console.log('PASS: Auto-map function was called (console logs detected)');
    } else {
      console.log('FAIL: Auto-map function may NOT have been called (no console logs)');
    }

    if (hasDropdownChanges) {
      console.log('PASS: Dropdowns are present on the page');
    } else {
      console.log('FAIL: No dropdowns found on the page');
    }

    console.log('\nPlease review screenshots and console logs for full details.');

  } catch (error) {
    console.error('\nERROR TEST FAILED: ' + error.message);
    await page.screenshot({ path: 'screenshots/v3-import-test-ERROR.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
