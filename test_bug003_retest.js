const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    buttonNavigates: false,
    errorFound: null,
    formFieldsVisible: false,
    consoleErrors: []
  };

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
  });

  try {
    console.log('🔄 Step 1: Navigate to login page...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('🔄 Step 2: Login with test credentials...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔄 Step 3: Navigate to autoresponders page...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl1 = page.url();
    console.log('✓ Current URL:', currentUrl1);

    console.log('📸 Step 4: Take screenshot of autoresponders list...');
    await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-01-list.png'), fullPage: true });
    console.log('✓ Screenshot saved: BUG003-retest-01-list.png');

    console.log('🔍 Step 5: Find Create Autoresponder button...');
    const createButton = await page.locator('[data-testid="autoresponder-create-button"]');
    const buttonExists = await createButton.count() > 0;
    
    if (!buttonExists) {
      console.log('⚠️ Button with data-testid not found, searching for alternative...');
      const altButton = await page.locator('button:has-text("Create Autoresponder")');
      const altExists = await altButton.count() > 0;
      
      if (!altExists) {
        results.errorFound = 'Create Autoresponder button not found on page';
        console.log('❌ Create Autoresponder button NOT FOUND');
      } else {
        console.log('✓ Found button via text content');
        console.log('🖱️ Step 6: Click the Create button...');
        await altButton.click();
        console.log('✓ Button clicked');
      }
    } else {
      console.log('✓ Found button via data-testid');
      console.log('🖱️ Step 6: Click the Create button...');
      await createButton.click();
      console.log('✓ Button clicked');
    }

    if (!results.errorFound) {
      console.log('⏳ Step 7: Wait 3 seconds for navigation...');
      await page.waitForTimeout(3000);

      const currentUrl2 = page.url();
      console.log('✓ Current URL after click:', currentUrl2);

      if (currentUrl2.includes('/dashboard/email/autoresponders/create')) {
        results.buttonNavigates = true;
        console.log('✅ NAVIGATION SUCCESSFUL!');

        console.log('📸 Step 8: Take screenshot after navigation...');
        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-02-after-click.png'), fullPage: true });
        console.log('✓ Screenshot saved: BUG003-retest-02-after-click.png');

        console.log('🔍 Step 9: Check for form fields...');
        const formFields = await page.locator('input, textarea, select').count();
        console.log(`✓ Found ${formFields} form fields`);
        
        if (formFields > 0) {
          results.formFieldsVisible = true;
          console.log('✅ Form fields are visible!');
        }

        console.log('📸 Step 10: Take screenshot of form fields...');
        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-03-form-fields.png'), fullPage: true });
        console.log('✓ Screenshot saved: BUG003-retest-03-form-fields.png');

      } else {
        results.buttonNavigates = false;
        results.errorFound = `Button click did not navigate. Current URL: ${currentUrl2}`;
        console.log('❌ NAVIGATION FAILED - URL did not change');
        
        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-02-after-click.png'), fullPage: true });
      }
    }

    // Try direct navigation as fallback test
    console.log('🔄 Step 11: Test direct navigation to create page...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const directUrl = page.url();
    console.log('✓ Direct navigation URL:', directUrl);
    
    if (directUrl.includes('/dashboard/email/autoresponders/create')) {
      console.log('✅ Direct navigation works!');
      results.directNavigationWorks = true;
    } else {
      console.log('❌ Direct navigation failed');
      results.directNavigationWorks = false;
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    results.errorFound = error.message;
    await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-error.png'), fullPage: true });
  }

  console.log('\n📊 FINAL RESULTS:');
  console.log('==================');
  console.log('Button Navigates:', results.buttonNavigates ? 'YES ✅' : 'NO ❌');
  console.log('Form Fields Visible:', results.formFieldsVisible ? 'YES ✅' : 'NO ❌');
  console.log('Error Found:', results.errorFound || 'None');
  console.log('Console Errors:', results.consoleErrors.length > 0 ? results.consoleErrors.join('\n') : 'None');
  console.log('==================');

  // Save results to JSON
  fs.writeFileSync(
    path.join(screenshotDir, 'BUG003-retest-results.json'),
    JSON.stringify(results, null, 2)
  );

  await browser.close();
})();
