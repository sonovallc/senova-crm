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

    console.log('Navigate to Autoresponders Create...');
    await page.goto('http://localhost:3004/email/autoresponders/create');
    await page.waitForTimeout(3000);

    console.log('Taking screenshot...');
    await page.screenshot({ path: path.join(screenshotDir, 'bug7-explore.png'), fullPage: true });

    console.log('Getting page HTML...');
    const html = await page.content();
    
    console.log('Finding input fields...');
    const inputs = await page.locator('input').allTextContents();
    console.log('Inputs:', inputs);

    console.log('Finding form structure...');
    const formHTML = await page.locator('form').innerHTML();
    console.log('Form HTML length:', formHTML.length);

    fs.writeFileSync('bug7-page-structure.html', html);
    console.log('Saved page structure to bug7-page-structure.html');

    console.log('Waiting to inspect...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await browser.close();
  }
})();
