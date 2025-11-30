const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function continueTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const ss = path.join(process.cwd(), 'screenshots');

  try {
    console.log('CONTINUING FROM DUPLICATES PAGE\n');
    
    await page.goto('http://localhost:3004/dashboard/contacts/import');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ss, 'dup-01.png'), fullPage: true });
    
    console.log('Clicking Skip All Duplicates...');
    const skipBtn = page.locator('button:has-text("Skip All Duplicates")').first();
    await skipBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ss, 'dup-02.png'), fullPage: true });
    
    console.log('Looking for Next button...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ss, 'dup-03.png'), fullPage: true });
    
    const nextBtn = page.locator('button:has-text("Next")').first();
    await nextBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ss, 'dup-04-preview.png'), fullPage: true });
    
    console.log('Executing import...');
    const importBtn = page.locator('button:has-text("Import"), button:has-text("Confirm")').first();
    await importBtn.click();
    console.log('Import started...\n');
    
    await page.waitForURL('**/dashboard/contacts**', { timeout: 300000 });
    console.log('Import complete!\n');
    
    await page.waitForTimeout(4000);
    const txt = await page.textContent('body');
    const m = txt.match(/Total:\s*(\d+)/i) || txt.match(/(\d+)\s+contacts/i);
    const total = m ? m[1] : 'unknown';
    console.log('Total contacts:', total, '\n');
    
    console.log('EXPORT TEST\n');
    const dl = page.waitForEvent('download', { timeout: 180000 });
    await page.click('button:has-text("Export All")');
    const d = await dl;
    await d.saveAs(path.join(ss, 'final-export.csv'));
    console.log('Exported!\n');
    
    const csv = fs.readFileSync(path.join(ss, 'final-export.csv'), 'utf-8');
    const rows = csv.split('\n').filter(l => l.trim()).length - 1;
    
    console.log('RESULTS:');
    console.log('Imported:', total);
    console.log('Exported:', rows);
    console.log(rows > 100 ? '\n✅ PASS' : '\n❌ FAIL');
    
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await browser.close();
  }
}

continueTest();
