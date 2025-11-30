const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n=== DEBUG CSV IMPORT ===\n');

  try {
    console.log('1. Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log('Logged in');

    console.log('2. Going to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/import-debug-contacts-page.png', fullPage: true });
    
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page text sample:', pageText.substring(0, 500));
    
    console.log('\n3. Looking for contact count...');
    const countElements = await page.locator('text=/\d+/).all();
    console.log('Found', countElements.length, 'elements with numbers');
    
    for (let i = 0; i < Math.min(5, countElements.length); i++) {
      const text = await countElements[i].textContent();
      console.log(`Element ${i}:`, text);
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: 'screenshots/import-debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
