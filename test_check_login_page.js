const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots', 'debug-login');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Going to http://localhost:3004/home...');
  await page.goto('http://localhost:3004/home');
  await page.waitForTimeout(2000);

  console.log('Taking screenshot...');
  await page.screenshot({ path: path.join(screenshotDir, 'home-page.png'), fullPage: true });

  console.log('Checking URL:', page.url());
  console.log('Page title:', await page.title());

  // Get all input fields
  const inputs = await page.$$('input');
  console.log(`Found ${inputs.length} input fields`);

  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type');
    const name = await inputs[i].getAttribute('name');
    const placeholder = await inputs[i].getAttribute('placeholder');
    console.log(`Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}`);
  }

  // Check for buttons
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons`);

  await page.waitForTimeout(3000);
  await browser.close();
})();
