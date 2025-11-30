const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing duplicate resolution...');

  try {
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("Import Contacts")').first().click();
    await page.waitForTimeout(2000);

    await page.locator('input[type="file"]').setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    await page.waitForTimeout(2000);

    await page.waitForSelector('text=/Step 2.*Map Your Columns/i', { timeout: 90000 });
    await page.waitForTimeout(2000);

    await page.locator('button:has-text("Auto-Map Columns")').first().click();
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(2000);

    await page.waitForSelector('text=/Validating your import/i', { state: 'hidden', timeout: 90000 });
    await page.waitForTimeout(2000);

    console.log('Taking full page screenshot...');
    await page.screenshot({ path: 'screenshots/duplicates-full.png', fullPage: true });

    console.log('Getting all button texts...');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      if (text && text.trim()) {
        console.log();
      }
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
