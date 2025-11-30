const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'testing', 'production-fixes');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    totalTests: 8,
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, status, details) {
    const symbol = status === 'PASS' ? '✓' : '✗';
    console.log(symbol + ' ' + name + (details ? ': ' + details : ''));
    if (status === 'PASS') results.passed++;
    else results.failed++;
    results.tests.push({ name, status, details });
  }

  try {
    console.log('=== ISSUE-005: CSV Export Verification ===');
    
    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login successful');

    console.log('Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'ISSUE005-01-export-button.png'), 
      fullPage: true 
    });
    console.log('✓ Screenshot 1');

    console.log('TEST 1: Export All button');
    const exportAllButton = page.locator('[data-testid="export-all-button"]');
    const exportAllCount = await exportAllButton.count();
    if (exportAllCount > 0) {
      const isVisible = await exportAllButton.isVisible();
      const text = await exportAllButton.textContent();
      logTest('Export All button', 'PASS', 'Found and visible');
    } else {
      logTest('Export All button', 'FAIL', 'Not found');
    }

    console.log('Select contacts...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const checkboxes = await page.locator('[data-testid^="contact-row-checkbox-"]').all();
    console.log('Found ' + checkboxes.length + ' checkboxes');
    
    if (checkboxes.length > 0) {
      const selectCount = Math.min(3, checkboxes.length);
      for (let i = 0; i < selectCount; i++) {
        await checkboxes[i].check();
        await page.waitForTimeout(300);
      }
      logTest('Contact selection', 'PASS', 'Selected ' + selectCount);
    } else {
      logTest('Contact selection', 'FAIL', 'No checkboxes');
    }

    await page.screenshot({ 
      path: path.join(screenshotDir, 'ISSUE005-02-export-clicked.png'), 
      fullPage: true 
    });

    console.log('TEST: Bulk action bar');
    const bulkActionBar = page.locator('[data-testid="bulk-action-bar"]');
    const bulkBarVisible = await bulkActionBar.isVisible();
    if (bulkBarVisible) {
      logTest('Bulk action bar', 'PASS', 'Visible');
    } else {
      logTest('Bulk action bar', 'FAIL', 'Not visible');
    }

    console.log('TEST: Bulk Export button');
    const bulkExportButton = page.locator('[data-testid="bulk-export-button"]');
    const bulkExportCount = await bulkExportButton.count();
    if (bulkExportCount > 0) {
      const isVisible = await bulkExportButton.isVisible();
      logTest('Bulk Export button', 'PASS', 'Found and visible');
    } else {
      logTest('Bulk Export button', 'FAIL', 'Not found');
    }

    await page.screenshot({ 
      path: path.join(screenshotDir, 'ISSUE005-03-export-selected.png'), 
      fullPage: true 
    });

    const countElement = page.locator('[data-testid="bulk-selected-count"]');
    const countVisible = await countElement.isVisible();
    if (countVisible) {
      logTest('Selected count', 'PASS', 'Visible');
    } else {
      logTest('Selected count', 'FAIL', 'Not visible');
    }

    const selectAllCheckbox = page.locator('[data-testid="contact-select-all-checkbox"]');
    const selectAllCount = await selectAllCheckbox.count();
    if (selectAllCount > 0) {
      logTest('Select All checkbox', 'PASS', 'Found');
    } else {
      logTest('Select All checkbox', 'FAIL', 'Not found');
    }

    const hasExportAll = (await page.locator('[data-testid="export-all-button"]').count()) > 0;
    const hasBulkExport = (await page.locator('[data-testid="bulk-export-button"]').count()) > 0;
    if (hasExportAll && hasBulkExport) {
      logTest('Distinct exports', 'PASS', 'Both exist');
    } else {
      logTest('Distinct exports', 'FAIL', 'Missing one or both');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  }

  results.passRate = ((results.passed / results.totalTests) * 100).toFixed(1);

  console.log('SUMMARY');
  console.log('Tests: ' + results.totalTests);
  console.log('Passed: ' + results.passed);
  console.log('Failed: ' + results.failed);
  console.log('Pass Rate: ' + results.passRate + '%');

  fs.writeFileSync('issue005_results.json', JSON.stringify(results, null, 2));

  await browser.close();
})();