const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Step 1: Navigating to frontend...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: 'screenshots/mailgun-01-homepage.png', fullPage: true });
    console.log('Screenshot saved: homepage');

    console.log('Step 2: Logging in...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/mailgun-02-login-filled.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/mailgun-03-dashboard.png', fullPage: true });
    console.log('Screenshot saved: dashboard');

    console.log('Step 3: Navigating to Mailgun settings...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const has404 = await page.locator('text=/404|not found/i').count() > 0;
    
    if (has404) {
      console.log('RESULT: 404 ERROR DETECTED - BUG NOT FIXED');
      await page.screenshot({ path: 'screenshots/mailgun-04-404-error.png', fullPage: true });
    } else {
      console.log('RESULT: PAGE LOADED SUCCESSFULLY - BUG FIXED');
      await page.screenshot({ path: 'screenshots/mailgun-04-settings-page.png', fullPage: true });
      
      const pageContent = await page.content();
      const hasMailgun = pageContent.toLowerCase().includes('mailgun');
      const hasInputs = await page.locator('input').count();
      
      console.log('Page contains Mailgun text:', hasMailgun);
      console.log('Number of input fields:', hasInputs);
      console.log('Current URL:', page.url());
      
      await page.screenshot({ path: 'screenshots/mailgun-05-final.png', fullPage: true });
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/mailgun-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
