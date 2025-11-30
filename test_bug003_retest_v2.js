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

  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(msg.text());
      console.log('Console Error:', msg.text());
    }
  });

  try {
    console.log('Step 1: Navigate to login page...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('Taking screenshot of login page...');
    await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-00-login.png'), fullPage: true });

    console.log('Looking for login form fields...');
    const emailFields = await page.locator('input[type="email"]').count();
    const passwordFields = await page.locator('input[type="password"]').count();
    console.log('Found', emailFields, 'email fields and', passwordFields, 'password fields');

    if (emailFields === 0 || passwordFields === 0) {
      console.log('Login form not found, checking if already logged in...');
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('Already logged in!');
      } else {
        results.errorFound = 'Login form not found on page';
        throw new Error('Login form not found');
      }
    } else {
      console.log('Step 2: Login with test credentials...');
      await page.locator('input[type="email"]').first().fill('admin@evebeautyma.com');
      await page.locator('input[type="password"]').first().fill('TestPass123!');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    console.log('Step 3: Navigate to autoresponders page...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl1 = page.url();
    console.log('Current URL:', currentUrl1);

    console.log('Step 4: Take screenshot of autoresponders list...');
    await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-01-list.png'), fullPage: true });
    console.log('Screenshot saved: BUG003-retest-01-list.png');

    console.log('Step 5: Find Create Autoresponder button...');
    
    let createButton = null;
    const selectors = [
      '[data-testid="autoresponder-create-button"]',
      'button:has-text("Create Autoresponder")',
      'a:has-text("Create Autoresponder")',
      'button:has-text("New Autoresponder")',
      'a:has-text("New Autoresponder")'
    ];

    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        createButton = page.locator(selector).first();
        console.log('Found button using selector:', selector);
        break;
      }
    }

    if (!createButton) {
      results.errorFound = 'Create Autoresponder button not found on page';
      console.log('Create Autoresponder button NOT FOUND');
      
      const allButtons = await page.locator('button').allTextContents();
      console.log('All buttons on page:', allButtons);
      
      const allLinks = await page.locator('a').allTextContents();
      console.log('All links on page:', allLinks);
    } else {
      console.log('Step 6: Click the Create button...');
      await createButton.click();
      console.log('Button clicked');

      console.log('Step 7: Wait 3 seconds for navigation...');
      await page.waitForTimeout(3000);

      const currentUrl2 = page.url();
      console.log('Current URL after click:', currentUrl2);

      if (currentUrl2.includes('/dashboard/email/autoresponders/create')) {
        results.buttonNavigates = true;
        console.log('NAVIGATION SUCCESSFUL!');

        console.log('Step 8: Take screenshot after navigation...');
        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-02-after-click.png'), fullPage: true });
        console.log('Screenshot saved: BUG003-retest-02-after-click.png');

        console.log('Step 9: Check for form fields...');
        const formFields = await page.locator('input, textarea, select').count();
        console.log('Found', formFields, 'form fields');
        
        if (formFields > 0) {
          results.formFieldsVisible = true;
          console.log('Form fields are visible!');
          
          const labels = await page.locator('label').allTextContents();
          console.log('Form field labels:', labels);
        }

        console.log('Step 10: Take screenshot of form fields...');
        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-03-form-fields.png'), fullPage: true });
        console.log('Screenshot saved: BUG003-retest-03-form-fields.png');

      } else {
        results.buttonNavigates = false;
        results.errorFound = 'Button click did not navigate. Expected: /dashboard/email/autoresponders/create, Got: ' + currentUrl2;
        console.log('NAVIGATION FAILED - URL did not change');
        
        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-02-after-click.png'), fullPage: true });
      }
    }

    console.log('Step 11: Test direct navigation to create page...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const directUrl = page.url();
    console.log('Direct navigation URL:', directUrl);
    
    if (directUrl.includes('/dashboard/email/autoresponders/create')) {
      console.log('Direct navigation works!');
      results.directNavigationWorks = true;
      
      await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-04-direct-nav.png'), fullPage: true });
    } else {
      console.log('Direct navigation failed');
      results.directNavigationWorks = false;
    }

  } catch (error) {
    console.error('Test Error:', error.message);
    results.errorFound = error.message;
    await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-error.png'), fullPage: true });
  }

  console.log('\nFINAL RESULTS:');
  console.log('==================');
  console.log('Button Navigates:', results.buttonNavigates ? 'YES' : 'NO');
  console.log('Form Fields Visible:', results.formFieldsVisible ? 'YES' : 'NO');
  console.log('Direct Navigation Works:', results.directNavigationWorks ? 'YES' : 'NO');
  console.log('Error Found:', results.errorFound || 'None');
  console.log('Console Errors:', results.consoleErrors.length > 0 ? results.consoleErrors.join('\n') : 
