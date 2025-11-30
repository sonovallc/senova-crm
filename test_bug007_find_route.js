const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('Navigate to Email section...');
    await page.goto('http://localhost:3004/email');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug7-email-page.png'), fullPage: true });
    console.log('Screenshot: bug7-email-page.png');

    console.log('\nTrying /email/autoresponders...');
    await page.goto('http://localhost:3004/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug7-autoresponders-list.png'), fullPage: true });
    console.log('Screenshot: bug7-autoresponders-list.png');

    console.log('\nLooking for Create button...');
    const createButton = await page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")').first();
    if (await createButton.isVisible()) {
      console.log('Found Create button, clicking...');
      await createButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug7-after-create-click.png'), fullPage: true });
      console.log('Screenshot: bug7-after-create-click.png');
      console.log('Current URL:', page.url());
    } else {
      console.log('No Create button found');
    }

    console.log('\nWaiting for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await browser.close();
  }
})();
