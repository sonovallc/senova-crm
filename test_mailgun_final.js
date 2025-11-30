const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/mailgun-final-01-login.png', fullPage: true });

    console.log('Step 2: Logging in...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/mailgun-final-02-dashboard.png', fullPage: true });

    console.log('Step 3: Navigating to Mailgun settings...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    // Check for actual 404 page elements
    const has404Heading = await page.locator('h1:has-text("404"), h2:has-text("404")').count() > 0;
    const hasPageNotFound = await page.locator('text=/page not found/i').count() > 0;
    const hasErrorMessage = await page.locator('text=/error|something went wrong/i').count() > 0;
    
    // Check for expected Mailgun content
    const hasMailgunHeading = await page.locator('h1:has-text("Mailgun"), h2:has-text("Mailgun")').count() > 0;
    const hasApiKeyField = await page.locator('input[placeholder*="API"], label:has-text("API Key")').count() > 0;
    const hasDomainField = await page.locator('input[placeholder*="example.com"], label:has-text("Domain")').count() > 0;
    const hasSaveButton = await page.locator('button:has-text("Save")').count() > 0;
    
    await page.screenshot({ path: 'screenshots/mailgun-final-03-verification.png', fullPage: true });
    
    console.log('\n=== DETAILED VERIFICATION RESULTS ===');
    console.log('Current URL:', page.url());
    console.log('\n404 Error Indicators:');
    console.log('  - Has "404" heading:', has404Heading);
    console.log('  - Has "Page Not Found" text:', hasPageNotFound);
    console.log('  - Has error message:', hasErrorMessage);
    console.log('\nExpected Mailgun Content:');
    console.log('  - Has Mailgun heading:', hasMailgunHeading);
    console.log('  - Has API Key field:', hasApiKeyField);
    console.log('  - Has Domain field:', hasDomainField);
    console.log('  - Has Save button:', hasSaveButton);
    
    const is404 = has404Heading || hasPageNotFound;
    const hasValidContent = hasMailgunHeading && hasApiKeyField && hasDomainField && hasSaveButton;
    
    console.log('\n=== FINAL VERDICT ===');
    if (is404) {
      console.log('STATUS: FAILED - Actual 404 page detected');
      console.log('BUG-MAILGUN-404: OPEN');
    } else if (hasValidContent) {
      console.log('STATUS: SUCCESS - Mailgun settings page loads correctly');
      console.log('BUG-MAILGUN-404: RESOLVED');
      console.log('\nPage contains:');
      console.log('  - Mailgun Configuration heading');
      console.log('  - API Key input field');
      console.log('  - Domain input field');
      console.log('  - Save Settings button');
    } else {
      console.log('STATUS: PARTIAL - Page loads but missing expected content');
      console.log('BUG-MAILGUN-404: NEEDS INVESTIGATION');
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: 'screenshots/mailgun-final-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
