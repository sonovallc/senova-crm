const playwright = require('playwright');

(async () => {
  console.log('Starting Mailgun Settings Fix Verification...\n');
  
  const browser = await playwright.chromium.launch({ 
    headless: false,
    timeout: 60000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3004', { timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-01-login.png', fullPage: true });
    console.log('   Login page loaded');

    // Step 2: Login
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-02-after-login.png', fullPage: true });
    console.log('   Logged in');

    // Step 3: Navigate to Mailgun settings
    console.log('3. Navigating to Mailgun settings page...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun', { timeout: 60000 });
    await page.waitForTimeout(5000);
    
    const pageContent = await page.content();
    const is404 = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Page not found');
    
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-03-mailgun-page.png', fullPage: true });
    
    console.log('\n========================================');
    console.log('RESULTS:');
    console.log('========================================');
    
    if (is404) {
      console.log('STATUS: FAIL - 404 Error still present');
    } else {
      console.log('STATUS: PASS - No 404 error detected');
    }
    
    console.log('Screenshots saved in screenshots/ folder');
    console.log('========================================\n');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-ERROR.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('Test complete. Browser closed.');
  }
})();
