const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const ss = 'screenshots';
  try {
    console.log('LOGIN');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('Logged in');
    await page.goto('http://localhost:3004/dashboard/contacts/import', { timeout: 90000 });
    await page.waitForTimeout(3000);
    console.log('On import page');
    const inp = await page.locator('input[type="file"]').first();
    await inp.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    console.log('File uploaded, waiting...');
    await page.waitForTimeout(10000);
    let txt = await page.textContent('body');
    if (!txt.includes('Map')) {
      await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 60000 });
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(3000);
    }
    console.log('On mapping');
    const am = page.locator('button:has-text("Auto-Map")').first();
    if (await am.isVisible({ timeout: 5000 }).catch(() => false)) {
      await am.click();
      await page.waitForTimeout(3000);
    }
    await page.click('button:has-text("Next"):not([disabled])');
    await page.waitForTimeout(3000);
    console.log('On tags');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    console.log('On review');
    await page.click('button:has-text("Import")');
    console.log('Importing...');
    await page.waitForURL('**/dashboard/contacts**', { timeout: 300000 });
    console.log('Import done');
    await page.waitForTimeout(4000);
    txt = await page.textContent('body');
    const m = txt.match(/Total[:s]+(d+)/i) || txt.match(/(d+)s+contacts/i);
    const total = m ? m[1] : 'unknown';
    console.log('Total contacts:', total);
    const dl = page.waitForEvent('download', { timeout: 180000 });
    await page.click('button:has-text("Export All")');
    console.log('Exporting...');
    const d = await dl;
    await d.saveAs(path.join(ss, 'export.csv'));
    const csv = fs.readFileSync(path.join(ss, 'export.csv'), 'utf-8');
    const rows = csv.split('
').filter(l => l.trim()).length - 1;
    console.log('Exported rows:', rows);
    console.log(rows > 100 ? 'PASS' : 'FAIL');
  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
})();