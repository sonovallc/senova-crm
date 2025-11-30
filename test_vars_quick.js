const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Logged in\n');
    
    console.log('TEST 1: Composer');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);
    const btn1 = await page.locator('button:has-text("Variables")').first().isVisible();
    console.log('  Variables button: ' + (btn1 ? 'FOUND' : 'NOT FOUND'));
    await page.screenshot({ path: 'screenshots/vars-composer.png', fullPage: true });
    
    console.log('\nTEST 2: Campaign');
    await page.goto('http://localhost:3004/dashboard/email/campaigns/create');
    await page.waitForTimeout(2000);
    const btn2 = await page.locator('button:has-text("Variables")').first().isVisible();
    console.log('  Variables button: ' + (btn2 ? 'FOUND' : 'NOT FOUND'));
    await page.screenshot({ path: 'screenshots/vars-campaign.png', fullPage: true });
    
    console.log('\nTEST 3: Autoresponder');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(2000);
    await page.click('input[id="mode-custom"]');
    await page.waitForTimeout(1000);
    const btn3 = await page.locator('button:has-text("Variables")').first().isVisible();
    console.log('  Variables button: ' + (btn3 ? 'FOUND' : 'NOT FOUND'));
    await page.screenshot({ path: 'screenshots/vars-autoresponder.png', fullPage: true });
    
    console.log('\nTEST 4: Templates');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Create Template")');
    await page.waitForTimeout(2000);
    const btn4 = await page.locator('button:has-text("Variables")').first().isVisible();
    console.log('  Variables button: ' + (btn4 ? 'FOUND' : 'NOT FOUND'));
    await page.screenshot({ path: 'screenshots/vars-templates.png', fullPage: true });
    
    const allFound = btn1 && btn2 && btn3 && btn4;
    console.log('\nRESULT: ' + (allFound ? 'ALL 4 LOCATIONS HAVE VARIABLES BUTTON' : 'SOME MISSING'));
    
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
