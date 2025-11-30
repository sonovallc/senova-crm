const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const dir = path.join(__dirname, 'testing', 'production-fixes');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const results = { passed: 0, failed: 0, tests: [] };

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3004');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Filling login form...');
    const emailInput = page.locator('input[type=email], input[name=email], input[placeholder*=email i]').first();
    await emailInput.fill('admin@evebeautyma.com');
    await page.waitForTimeout(500);
    
    const passwordInput = page.locator('input[type=password], input[name=password]').first();
    await passwordInput.fill('TestPass123!');
    await page.waitForTimeout(500);
    
    console.log('Submitting login...');
    await page.click('button[type=submit]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('Login successful!');
    
    console.log('Navigating to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Taking Screenshot 1...');
    await page.screenshot({ path: path.join(dir, 'ISSUE005-01-export-button.png'), fullPage: true });
    
    console.log('
TEST 1: Export All Button Exists');
    const exportAll = page.locator('[data-testid=export-all-button]');
    const exportAllCount = await exportAll.count();
    console.log('  Count:', exportAllCount);
    if (exportAllCount > 0) {
      const isVisible = await exportAll.isVisible();
      console.log('  Visible:', isVisible);
      const text = await exportAll.textContent();
      console.log('  Text:', text.trim());
      results.passed++;
      results.tests.push({ name: 'Export All Button', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Export All Button', status: 'FAIL', error: 'Not found' });
    }
    
    console.log('
TEST 2: Selecting Contacts');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    const checkboxes = await page.locator('[data-testid^=contact-row-checkbox]').all();
    console.log('  Checkboxes found:', checkboxes.length);
    
    if (checkboxes.length > 0) {
      await checkboxes[0].check();
      await page.waitForTimeout(1000);
      results.passed++;
      results.tests.push({ name: 'Select Contact', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Select Contact', status: 'FAIL', error: 'No checkboxes' });
    }
    
    console.log('
Taking Screenshot 2...');
    await page.screenshot({ path: path.join(dir, 'ISSUE005-02-selected.png'), fullPage: true });
    
    console.log('
TEST 3: Bulk Action Bar');
    const bulkBar = page.locator('[data-testid=bulk-action-bar]');
    const bulkBarVisible = await bulkBar.isVisible().catch(() => false);
    console.log('  Bulk bar visible:', bulkBarVisible);
    if (bulkBarVisible) {
      results.passed++;
      results.tests.push({ name: 'Bulk Action Bar', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Bulk Action Bar', status: 'FAIL', error: 'Not visible' });
    }
    
    console.log('
TEST 4: Bulk Export Button');
    const bulkExport = page.locator('[data-testid=bulk-export-button]');
    const bulkExportCount = await bulkExport.count();
    console.log('  Count:', bulkExportCount);
    if (bulkExportCount > 0) {
      const isVisible = await bulkExport.isVisible();
      console.log('  Visible:', isVisible);
      const text = await bulkExport.textContent();
      console.log('  Text:', text.trim());
      results.passed++;
      results.tests.push({ name: 'Bulk Export Button', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Bulk Export Button', status: 'FAIL', error: 'Not found' });
    }
    
    console.log('
Taking Screenshot 3...');
    await page.screenshot({ path: path.join(dir, 'ISSUE005-03-export-selected.png'), fullPage: true });
    
  } catch (e) {
    console.error('FATAL ERROR:', e.message);
    results.tests.push({ name: 'Test Execution', status: 'FAIL', error: e.message });
  }
  
  console.log('
' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log('Passed:', results.passed);
  console.log('Failed:', results.failed);
  console.log('Tests:', JSON.stringify(results.tests, null, 2));
  
  fs.writeFileSync('issue005_results.json', JSON.stringify(results, null, 2));
  
  await browser.close();
})();
