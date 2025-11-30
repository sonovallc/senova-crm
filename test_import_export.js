const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testImportExport() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  
  console.log('=== CSV IMPORT AND EXPORT TEST ===\n');

  try {
    console.log('LOGIN');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('OK: Logged in\n');
    
    console.log('NAVIGATE TO IMPORT');
    await page.goto('http://localhost:3004/dashboard/contacts/import');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'import-01.png'), fullPage: true });
    console.log('OK: Import page loaded\n');
    
    console.log('UPLOAD CSV');
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    console.log('OK: File selected, waiting for processing...');
    await page.waitForTimeout(10000);
    
    let bodyText = await page.textContent('body');
    if (!bodyText.includes('Map')) {
      console.log('Waiting for Next button...');
      await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 60000 });
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: path.join(screenshotDir, 'import-02-mapping.png'), fullPage: true });
    console.log('OK: On mapping page\n');
    
    console.log('AUTO-MAP COLUMNS');
    const autoMap = page.locator('button:has-text("Auto-Map")').first();
    const hasAutoMap = await autoMap.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasAutoMap) {
      await autoMap.click();
      await page.waitForTimeout(3000);
      console.log('OK: Auto-mapped');
    }
    
    await page.click('button:has-text("Next"):not([disabled])');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'import-03-tags.png'), fullPage: true });
    console.log('OK: On tags page\n');
    
    console.log('SKIP TAGS');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'import-04-review.png'), fullPage: true });
    console.log('OK: On review page\n');
    
    bodyText = await page.textContent('body');
    const newMatch = bodyText.match(/(\d+)\s+new/i);
    const dupMatch = bodyText.match(/(\d+)\s+duplicate/i);
    if (newMatch) console.log('New contacts:', newMatch[1]);
    if (dupMatch) console.log('Duplicates:', dupMatch[1]);
    
    console.log('\nEXECUTE IMPORT');
    await page.click('button:has-text("Import")');
    console.log('OK: Import started, waiting...\n');
    
    await page.waitForURL('**/dashboard/contacts**', { timeout: 300000 });
    console.log('OK: Import completed\n');
    
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotDir, 'import-05-complete.png'), fullPage: true });
    
    bodyText = await page.textContent('body');
    const totalMatch = bodyText.match(/Total:\s*(\d+)/i) || bodyText.match(/(\d+)\s+contacts/i);
    const totalContacts = totalMatch ? totalMatch[1] : 'unknown';
    console.log('Total contacts:', totalContacts, '\n');
    
    console.log('=== EXPORT TEST ===\n');
    
    const downloadPromise = page.waitForEvent('download', { timeout: 180000 });
    await page.click('button:has-text("Export All")');
    console.log('OK: Export clicked, waiting...\n');
    
    const download = await downloadPromise;
    const exportPath = path.join(screenshotDir, 'exported-all.csv');
    await download.saveAs(exportPath);
    console.log('OK: Export downloaded\n');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'import-06-exported.png'), fullPage: true });
    
    const csvContent = fs.readFileSync(exportPath, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
    const exportedRows = lines.length - 1;
    
    console.log('=== RESULTS ===\n');
    console.log('Imported:', totalContacts, 'contacts');
    console.log('Exported:', exportedRows, 'rows');
    
    const bugFixed = exportedRows > 100;
    if (bugFixed) {
      console.log('\n✅ BUG-002: PASS');
      console.log('Export NOT limited to 20 rows!\n');
    } else {
      console.log('\n❌ BUG-002: FAIL');
      console.log('Export still limited!\n');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testImportExport();
