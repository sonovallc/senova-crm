const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const screenshotDir = 'screenshots';
  
  try {
    console.log('PART 1: CSV IMPORT');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('Logged in');
    
    await page.goto('http://localhost:3004/dashboard/contacts/import', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'import-page.png'), fullPage: true });
    
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    await page.waitForTimeout(5000);
    
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    
    const autoMap = page.locator('button:has-text("Auto-Map")').first();
    if (await autoMap.isVisible()) await autoMap.click();
    await page.waitForTimeout(2000);
    
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(2000);
    
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'review.png'), fullPage: true });
    
    await page.locator('button:has-text("Import")').first().click();
    console.log('Import started...');
    
    await page.waitForURL('**/dashboard/contacts**', { timeout: 300000 });
    console.log('Import complete');
    
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);
    
    const text = await page.textContent('body');
    const match = text.match(/Total[:\s]+(\d+)/i) || text.match(/(\d+)\s+contacts/i);
    const imported = match ? match[1] : 'unknown';
    console.log('Imported contacts:', imported);
    
    await page.screenshot({ path: path.join(screenshotDir, 'after-import.png'), fullPage: true });
    
    console.log('PART 2: EXPORT TEST');
    const dl = page.waitForEvent('download', { timeout: 180000 });
    await page.locator('button:has-text("Export All")').first().click();
    const download = await dl;
    const csvPath = path.join(screenshotDir, 'export.csv');
    await download.saveAs(csvPath);
    console.log('Export downloaded');
    
    const csv = fs.readFileSync(csvPath, 'utf-8');
    const rows = csv.split('\n').filter(l => l.trim()).length - 1;
    
    console.log('RESULTS:');
    console.log('Imported:', imported);
    console.log('Exported rows:', rows);
    console.log(rows > 100 ? 'PASS' : 'FAIL');
    
  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
