const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/mailgun-01-login-page.png', fullPage: true });
    console.log('Login page screenshot saved');

    console.log('Step 2: Filling login form...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/mailgun-02-login-filled.png', fullPage: true });
    
    console.log('Step 3: Submitting login...');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/mailgun-03-dashboard.png', fullPage: true });
    console.log('Dashboard screenshot saved');

    console.log('Step 4: Navigating to Mailgun settings page...');
    console.log('Target URL: /dashboard/settings/integrations/mailgun');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/mailgun-04-mailgun-page.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    const currentUrl = page.url();
    const has404 = pageText.toLowerCase().includes('404') || pageText.toLowerCase().includes('not found');
    const hasMailgun = pageText.toLowerCase().includes('mailgun');
    
    console.log('');
    console.log('=== VERIFICATION RESULTS ===');
    console.log('Current URL:', currentUrl);
    console.log('Has 404 error:', has404 ? 'YES - BUG NOT FIXED' : 'NO');
    console.log('Has Mailgun text:', hasMailgun ? 'YES' : 'NO');
    
    if (has404) {
      console.log('');
      console.log('FINAL RESULT: FAILED - 404 ERROR STILL PRESENT');
      console.log('BUG-MAILGUN-404 status: OPEN');
    } else if (hasMailgun) {
      console.log('');
      console.log('FINAL RESULT: SUCCESS - PAGE LOADS CORRECTLY');
      console.log('BUG-MAILGUN-404 status: RESOLVED');
    } else {
      console.log('');
      console.log('FINAL RESULT: UNCLEAR - Page loads but no Mailgun content');
      console.log('BUG-MAILGUN-404 status: NEEDS INVESTIGATION');
    }
    
    await page.screenshot({ path: 'screenshots/mailgun-05-final-verification.png', fullPage: true });
    console.log('');
    console.log('All screenshots saved to screenshots/ directory');

  } catch (error) {
    console.error('');
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/mailgun-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
