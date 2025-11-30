const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Login OK, navigating to compose...');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/composer-explore.png', fullPage: true });
    console.log('Screenshot saved');
    const selects = await page.locator('select').count();
    console.log('Select elements found:', selects);
    const buttons = await page.locator('button').count();
    console.log('Buttons found:', buttons);
    const inputs = await page.locator('input').count();
    console.log('Inputs found:', inputs);
    await page.waitForTimeout(10000);
  } catch (e) { console.error(e.message); }
  finally { await browser.close(); }
})();
