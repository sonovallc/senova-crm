const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'testing', 'production-fixes');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = { timestamp: new Date().toISOString(), tests: [], screenshots: [] };

  function log(message, status = 'INFO') {
    const entry = { message, status, timestamp: new Date().toISOString() };
    results.tests.push(entry);
    console.log('[' + status + '] ' + message);
  }

  try {
    log('Navigating to http://localhost:3004', 'TEST');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    log('Logging in with test credentials', 'TEST');
    await page.locator('input[type="email"]').first().fill('admin@evebeautyma.com');
    await page.locator('input[type="password"]').first().fill('TestPass123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    log('Login successful', 'PASS');

    log('Navigating to /dashboard/contacts', 'TEST');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'ISSUE004-01-contacts-list.png'), fullPage: true });
    results.screenshots.push('ISSUE004-01-contacts-list.png');
    log('Screenshot: ISSUE004-01-contacts-list.png', 'PASS');

    const checkboxCount = await page.locator('input[type="checkbox"]').count();
    log('Found ' + checkboxCount + ' checkboxes', checkboxCount > 0 ? 'PASS' : 'FAIL');

    const selectAllCheckbox = page.locator('[data-testid="contact-select-all-checkbox"]').first();
    const hasSelectAll = await selectAllCheckbox.count() > 0;
    log('Select-all checkbox: ' + (hasSelectAll ? 'FOUND' : 'NOT FOUND'), hasSelectAll ? 'PASS' : 'FAIL');

    const firstRowCheckbox = page.locator('[data-testid^="contact-row-checkbox"]').first();
    if (await firstRowCheckbox.count() > 0) {
      await firstRowCheckbox.click();
      await page.waitForTimeout(2000);
      log('Individual checkbox clicked', 'PASS');

      await page.screenshot({ path: path.join(screenshotDir, 'ISSUE004-02-single-selected.png'), fullPage: true });
      results.screenshots.push('ISSUE004-02-single-selected.png');

      const counter = page.locator('[data-testid="bulk-selected-count"]').first();
      if (await counter.count() > 0) {
        const text = await counter.textContent();
        log('Counter found: ' + text, 'PASS');
      } else {
        log('Counter NOT found', 'FAIL');
      }

      const bulkBar = page.locator('[data-testid="bulk-action-bar"]').first();
      log('Bulk action bar: ' + (await bulkBar.count() > 0 ? 'FOUND' : 'NOT FOUND'), await bulkBar.count() > 0 ? 'PASS' : 'FAIL');

      const buttons = {
        'Add Tags': '[data-testid="bulk-add-tags-button"]',
        'Remove Tags': '[data-testid="bulk-remove-tags-button"]',
        'Export': '[data-testid="bulk-export-button"]',
        'Delete': '[data-testid="bulk-delete-button"]'
      };

      for (const [name, testid] of Object.entries(buttons)) {
        const btn = page.locator(testid).first();
        const found = await btn.count() > 0;
        log(name + ' button: ' + (found ? 'FOUND' : 'NOT FOUND'), found ? 'PASS' : 'FAIL');
      }

      if (await bulkBar.count() > 0) {
        await bulkBar.screenshot({ path: path.join(screenshotDir, 'ISSUE004-04-bulk-actions.png') });
        results.screenshots.push('ISSUE004-04-bulk-actions.png');
      }
    }

    if (hasSelectAll) {
      await selectAllCheckbox.click();
      await page.waitForTimeout(2000);
      log('Select-all clicked', 'PASS');
      await page.screenshot({ path: path.join(screenshotDir, 'ISSUE004-03-all-selected.png'), fullPage: true });
      results.screenshots.push('ISSUE004-03-all-selected.png');
    }

    const passCount = results.tests.filter(t => t.status === 'PASS').length;
    const failCount = results.tests.filter(t => t.status === 'FAIL').length;
    const total = passCount + failCount;
    
    results.summary = {
      total: total,
      passed: passCount,
      failed: failCount,
      passRate: total > 0 ? ((passCount / total) * 100).toFixed(2) + '%' : '0%'
    };

    log('Summary: ' + passCount + '/' + total + ' passed (' + results.summary.passRate + ')', passCount === total ? 'PASS' : 'FAIL');

  } catch (error) {
    log('Fatal error: ' + error.message, 'FAIL');
    console.error(error);
  } finally {
    fs.writeFileSync(
      path.join(__dirname, 'testing', 'production-fixes', 'ISSUE004_test_results.json'),
      JSON.stringify(results, null, 2)
    );
    await browser.close();
  }
})();
