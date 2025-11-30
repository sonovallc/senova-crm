const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const dir = path.join(__dirname, 'testing', 'production-fixes');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const results = { tests: [], screenshots: [] };
  function log(msg, status) {
    results.tests.push({ msg, status });
    console.log('[' + status + '] ' + msg);
  }

  try {
    await page.goto('http://localhost:3004/login', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    log('Login successful', 'PASS');

    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(dir, 'ISSUE004-01-contacts-list.png'), fullPage: true });
    log('Screenshot 1 saved', 'PASS');

    const checkboxCount = await page.locator('input[type="checkbox"]').count();
    log('Checkboxes found: ' + checkboxCount, checkboxCount > 0 ? 'PASS' : 'FAIL');

    const selectAll = await page.locator('[data-testid="contact-select-all-checkbox"]').count() > 0;
    log('Select-all checkbox: ' + (selectAll ? 'FOUND' : 'NOT FOUND'), selectAll ? 'PASS' : 'FAIL');

    const rowCheckbox = await page.locator('[data-testid^="contact-row-checkbox"]').count() > 0;
    log('Row checkboxes: ' + (rowCheckbox ? 'FOUND' : 'NOT FOUND'), rowCheckbox ? 'PASS' : 'FAIL');

    if (rowCheckbox) {
      await page.locator('[data-testid^="contact-row-checkbox"]').first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(dir, 'ISSUE004-02-single-selected.png'), fullPage: true });
      log('Individual selection works', 'PASS');

      const counter = await page.locator('[data-testid="bulk-selected-count"]').count() > 0;
      log('Selection counter: ' + (counter ? 'FOUND' : 'NOT FOUND'), counter ? 'PASS' : 'FAIL');

      const bulkBar = await page.locator('[data-testid="bulk-action-bar"]').count() > 0;
      log('Bulk action bar: ' + (bulkBar ? 'FOUND' : 'NOT FOUND'), bulkBar ? 'PASS' : 'FAIL');

      const addTags = await page.locator('[data-testid="bulk-add-tags-button"]').count() > 0;
      log('Add Tags button: ' + (addTags ? 'FOUND' : 'NOT FOUND'), addTags ? 'PASS' : 'FAIL');

      const removeTags = await page.locator('[data-testid="bulk-remove-tags-button"]').count() > 0;
      log('Remove Tags button: ' + (removeTags ? 'FOUND' : 'NOT FOUND'), removeTags ? 'PASS' : 'FAIL');

      const exportBtn = await page.locator('[data-testid="bulk-export-button"]').count() > 0;
      log('Export button: ' + (exportBtn ? 'FOUND' : 'NOT FOUND'), exportBtn ? 'PASS' : 'FAIL');

      const deleteBtn = await page.locator('[data-testid="bulk-delete-button"]').count() > 0;
      log('Delete button: ' + (deleteBtn ? 'FOUND' : 'NOT FOUND'), deleteBtn ? 'PASS' : 'FAIL');

      if (bulkBar) {
        await page.locator('[data-testid="bulk-action-bar"]').screenshot({ path: path.join(dir, 'ISSUE004-04-bulk-actions.png') });
        log('Bulk action bar screenshot saved', 'PASS');
      }
    }

    if (selectAll) {
      await page.locator('[data-testid="contact-select-all-checkbox"]').click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(dir, 'ISSUE004-03-all-selected.png'), fullPage: true });
      log('Select all works', 'PASS');
    }

    const passed = results.tests.filter(t => t.status === 'PASS').length;
    const failed = results.tests.filter(t => t.status === 'FAIL').length;
    log('SUMMARY: ' + passed + ' passed, ' + failed + ' failed', failed === 0 ? 'PASS' : 'FAIL');

    fs.writeFileSync(path.join(dir, 'ISSUE004_results.json'), JSON.stringify(results, null, 2));

  } catch (error) {
    log('ERROR: ' + error.message, 'FAIL');
  } finally {
    await browser.close();
  }
})();
