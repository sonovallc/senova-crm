const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error));

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug006_login.png', fullPage: true });
    
    console.log('Filling credentials...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/bug006_filled.png', fullPage: true });
    
    console.log('Clicking submit...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/bug006_after_submit.png', fullPage: true });
    
    console.log('Current URL:', page.url());
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'screenshots/bug006_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
