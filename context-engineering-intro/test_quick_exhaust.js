const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting exhaustive email composer test...');
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  
  const dir = path.join(__dirname, 'screenshots', 'exhaust-composer');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const ss = (name) => page.screenshot({ path: path.join(dir, name + '.png'), fullPage: true });
  
  try {
    // Login
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Go to composer
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('At composer page - starting tests...');
    await ss('00-initial');
    
    console.log('TEST COMPLETE - Check screenshots folder');
  } catch (e) {
    console.error('Error:', e.message);
    await ss('error');
  } finally {
    await browser.close();
  }
})();