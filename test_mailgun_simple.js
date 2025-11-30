const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to frontend...');
    await page.goto('http://localhost:3004', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/mailgun-01-homepage.png', fullPage: true });
    console.log('Homepage screenshot saved');

    console.log('Looking for login form...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/mailgun-02-login-filled.png', fullPage: true });
    
    console.log('Submitting login...');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/mailgun-03-dashboard.png', fullPage: true });
    console.log('Dashboard screenshot saved');

    console.log('Navigating to Mailgun settings...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/mailgun-04-mailgun-page.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    const has404 = pageText.toLowerCase().includes('404') || pageText.toLowerCase().includes('not found');
    const hasMailgun = pageText.toLowerCase().includes('mailgun');
    
    console.log('=== VERIFICATION RESULTS ===');
    console.log('Has 404 error:', has404);
    console.log('Has Mailgun text:', hasMailgun);
    console.log('Current URL:', page.url());
    
    if (has404) {
      console.log('STATUS: BUG NOT FIXED - 404 ERROR STILL PRESENT');
    } else {
      console.log('STATUS: BUG FIXED - PAGE LOADS SUCCESSFULLY');
    }
    
    await page.screenshot({ path: 'screenshots/mailgun-05-final.png', fullPage: true });
    console.log('Final screenshot saved');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/mailgun-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
