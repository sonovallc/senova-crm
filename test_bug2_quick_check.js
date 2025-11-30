const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/inbox-structure.png', fullPage: true });
    
    const html = await page.content();
    console.log('Page HTML (first 2000 chars):');
    console.log(html.substring(0, 2000));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
