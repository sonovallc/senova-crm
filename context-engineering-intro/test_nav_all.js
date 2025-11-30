const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = path.join(__dirname, 'testing', 'email-channel-screenshots', 'feature-3-templates');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function getScreenshotFilename(step) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  return path.join(SCREENSHOT_DIR, timestamp + '-' + step + '.png');
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: getScreenshotFilename('00-login-page'), fullPage: true });
    console.log('Screenshot saved');
    
    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());
    
    // Check what inputs exist
    const inputs = await page.locator('input').count();
    console.log('Total inputs found:', inputs);
    
    for (let i = 0; i < inputs; i++) {
      const input = page.locator('input').nth(i);
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      console.log('Input ' + i + ': type=' + type + ', name=' + name + ', placeholder=' + placeholder);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
