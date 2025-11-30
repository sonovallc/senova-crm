const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Starting Mailgun Settings Fix Verification...\n');

    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-01-login-page.png', fullPage: true });
    console.log('   Screenshot saved: mailgun-fix-01-login-page.png');

    // Step 2: Login
    console.log('2. Logging in with admin credentials...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-02-login-filled.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-03-dashboard.png', fullPage: true });
    console.log('   Successfully logged in');

    // Step 3: Navigate to Mailgun settings page
    console.log('3. Navigating to Mailgun settings page...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Check if we got a 404 error
    const pageContent = await page.content();
    const is404 = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Page not found');
    
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-04-mailgun-page.png', fullPage: true });
    
    if (is404) {
      console.log('   ERROR: 404 Error still present');
    } else {
      console.log('   Mailgun settings page loaded successfully');
    }

    // Step 4: Verify page title
    console.log('4. Verifying page title...');
    const titleElement = await page.locator('h1, h2').filter({ hasText: /Mailgun/i }).first();
    const titleExists = await titleElement.count() > 0;
    
    if (titleExists) {
      const titleText = await titleElement.textContent();
      console.log('   Page title found: ' + titleText);
    } else {
      console.log('   Page title NOT found');
    }

    // Step 5: Verify form fields
    console.log('5. Verifying form fields...');
    const apiKeyField = await page.locator('input[name="apiKey"], input[placeholder*="API"], label:has-text("API Key") ~ input').first().count();
    const domainField = await page.locator('input[name="domain"], input[placeholder*="domain"], label:has-text("Domain") ~ input').first().count();
    const senderNameField = await page.locator('input[name="senderName"], input[placeholder*="sender"], label:has-text("Sender Name") ~ input').first().count();
    const senderEmailField = await page.locator('input[name="senderEmail"], input[type="email"], label:has-text("Sender Email") ~ input').first().count();

    console.log('   API Key field: ' + (apiKeyField > 0 ? 'FOUND' : 'NOT FOUND'));
    console.log('   Domain field: ' + (domainField > 0 ? 'FOUND' : 'NOT FOUND'));
    console.log('   Sender Name field: ' + (senderNameField > 0 ? 'FOUND' : 'NOT FOUND'));
    console.log('   Sender Email field: ' + (senderEmailField > 0 ? 'FOUND' : 'NOT FOUND'));
    
    const fieldsFound = apiKeyField + domainField + senderNameField + senderEmailField;

    // Step 6: Verify buttons
    console.log('6. Verifying buttons...');
    const testButton = await page.locator('button:has-text("Test Connection"), button:has-text("Test")').first().count();
    const saveButton = await page.locator('button:has-text("Save Settings"), button:has-text("Save"), button[type="submit"]').first().count();

    console.log('   Test Connection button: ' + (testButton > 0 ? 'FOUND' : 'NOT FOUND'));
    console.log('   Save Settings button: ' + (saveButton > 0 ? 'FOUND' : 'NOT FOUND'));
    
    const buttonsFound = testButton + saveButton;

    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-05-page-elements.png', fullPage: true });

    // Step 7: Check console errors
    console.log('7. Checking for console errors...');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('   Found console errors: ' + logs.length);
      logs.forEach(log => console.log('      - ' + log));
    } else {
      console.log('   No console errors detected');
    }

    // Final Results
    console.log('\n========================================');
    console.log('VERIFICATION RESULTS:');
    console.log('========================================');
    console.log('404 Error Resolved: ' + (is404 ? 'FAIL' : 'PASS'));
    console.log('Page Title Present: ' + (titleExists ? 'PASS' : 'FAIL'));
    console.log('Form Fields Found: ' + fieldsFound + '/4 ' + (fieldsFound >= 3 ? 'PASS' : 'FAIL'));
    console.log('Buttons Found: ' + buttonsFound + '/2 ' + (buttonsFound >= 2 ? 'PASS' : 'FAIL'));
    console.log('Console Errors: ' + (logs.length === 0 ? 'PASS' : 'FAIL'));
    console.log('========================================');
    
    const overallPass = !is404 && titleExists && fieldsFound >= 3 && buttonsFound >= 2 && logs.length === 0;
    console.log('\nOVERALL: ' + (overallPass ? 'PASS - BUG-MAILGUN-404 RESOLVED' : 'FAIL - Issues remain') + '\n');

  } catch (error) {
    console.error('ERROR during verification:', error.message);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\mailgun-fix-ERROR.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
