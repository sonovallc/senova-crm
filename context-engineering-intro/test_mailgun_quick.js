const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const screenshotDir = path.join(__dirname, '..', 'screenshots', 'mailgun-settings-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '01-login.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('Login successful');
    
    console.log('\nNavigating to Mailgun Settings...');
    const response = await page.goto('http://localhost:3004/dashboard/settings/email');
    const status = response.status();
    console.log('HTTP Status:', status);
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '02-mailgun-page.png'), fullPage: true });
    
    if (status === 404) {
      console.log('\nCRITICAL BUG: Page returns 404');
    } else {
      console.log('\nSUCCESS: Page loaded with status', status);
    }
    
    const heading = await page.locator('h1, h2, h3').filter({ hasText: /Mailgun/i }).count();
    console.log('Mailgun heading found:', heading > 0);
    
    const inputs = await page.locator('input').count();
    console.log('Input fields found:', inputs);
    
    const buttons = await page.locator('button').count();
    console.log('Buttons found:', buttons);
    
  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
