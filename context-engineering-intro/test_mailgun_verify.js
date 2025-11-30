const playwright = require('playwright');

(async () => {
  console.log('=== MAILGUN FIX VERIFICATION ===\n');
  
  const browser = await playwright.chromium.launch({ 
    headless: false
  });
  
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3004');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('Logged in successfully\n');

    // Navigate to Mailgun page
    console.log('Navigating to Mailgun settings page...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for 404
    const pageText = await page.textContent('body');
    const has404 = pageText.includes('404') && pageText.includes('could not be found');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-verification.png', 
      fullPage: true 
    });
    
    console.log('\n=== TEST RESULTS ===');
    console.log('URL: http://localhost:3004/dashboard/settings/integrations/mailgun');
    console.log('404 Error Present:', has404 ? 'YES - FAIL' : 'NO - PASS');
    console.log('Screenshot: screenshots/mailgun-verification.png');
    
    if (has404) {
      console.log('\nSTATUS: FAIL - BUG-MAILGUN-404 NOT RESOLVED');
      console.log('The page still shows 404 error');
    } else {
      console.log('\nSTATUS: PASS - BUG-MAILGUN-404 RESOLVED');
      console.log('Page loads successfully without 404 error');
    }
    console.log('===================\n');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
