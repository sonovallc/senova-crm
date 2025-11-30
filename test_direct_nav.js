const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const screenshotDir = path.join(__dirname, 'testing', 'production-readiness');

  try {
    await page.goto('http://localhost:3004/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    console.log('Testing direct navigation to Activity Log...');
    await page.goto('http://localhost:3004/dashboard/activity-log', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('Activity Log URL:', page.url());
    await page.screenshot({ path: path.join(screenshotDir, '02-nav-activity-direct.png'), fullPage: true });

    console.log('\nTesting direct navigation to Payments...');
    await page.goto('http://localhost:3004/dashboard/payments', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('Payments URL:', page.url());
    await page.screenshot({ path: path.join(screenshotDir, '02-nav-payments-direct.png'), fullPage: true });

    console.log('\nTesting direct navigation to AI Tools...');
    await page.goto('http://localhost:3004/dashboard/ai', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('AI Tools URL:', page.url());
    await page.screenshot({ path: path.join(screenshotDir, '02-nav-ai-tools-direct.png'), fullPage: true });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
