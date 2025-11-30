const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1500 });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));

  try {
    console.log('[1] Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Done\n');

    console.log('[2] Go to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/work-inbox.png', fullPage: true });
    console.log('Done - Screenshot: work-inbox.png\n');

    console.log('[3] Click on first thread (Dolores Fay)...');
    await page.click('text=Dolores Fay');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/work-thread.png', fullPage: true });
    console.log('Done - Screenshot: work-thread.png\n');

    console.log('[4] *** CLICK ARCHIVE BUTTON ***');
    await page.click('button:has-text("Archive")');
    console.log('Archive clicked!');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/work-after-archive.png', fullPage: true });
    console.log('Done - Screenshot: work-after-archive.png\n');

    console.log('[5] Check Archived tab...');
    await page.click('button:has-text("Archived")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/work-archived-tab.png', fullPage: true });
    console.log('Done - Screenshot: work-archived-tab.png\n');

    console.log('========================================');
    console.log('FINAL REPORT');
    console.log('========================================');
    console.log('Console Errors:', errors.length);
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(e => console.log('  -', e));
    } else {
      console.log('NO ERRORS!');
    }
    console.log('\nFix Successful:', errors.length === 0 ? 'YES' : 'NO');
    console.log('Ready for Complete Feature Test:', errors.length === 0 ? 'YES' : 'NO');
    console.log('========================================');

  } catch (e) {
    console.error('\nERROR:', e.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/work-error.png', fullPage: true });
    console.log('\nFix Successful: NO');
  } finally {
    await browser.close();
  }
})();
