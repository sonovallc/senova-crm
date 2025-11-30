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
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-00-login.png'), fullPage: true });
    
    console.log('Step 2: Login with credentials...');
    await page.locator('input[type="email"]').first().fill('admin@evebeautyma.com');
    await page.locator('input[type="password"]').first().fill('TestPass123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    console.log('Step 3: Navigate to autoresponders page...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('Current URL:', page.url());

    console.log('Step 4: Take screenshot of autoresponders list...');
    await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-01-list.png'), fullPage: true });

    console.log('Step 5: Find Create Autoresponder button...');
    
    const selectors = [
      '[data-testid="autoresponder-create-button"]',
      'button:has-text("Create Autoresponder")',
      'a:has-text("Create Autoresponder")',
      'button:has-text("New Autoresponder")',
      'a:has-text("New Autoresponder")'
    ];

    let createButton = null;
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        createButton = page.locator(selector).first();
        console.log('Found Create button using selector:', selector);
        break;
      }
    }

    if (!createButton) {
      results.errorFound = 'Create Autoresponder button not found on page';
      console.log('ERROR: Create button NOT FOUND');
      const allButtons = await page.locator('button').allTextContents();
      console.log('All buttons on page:', allButtons);
      const allLinks = await page.locator('a').allTextContents();
      console.log('All links on page:', allLinks.slice(0, 10));
    } else {
      console.log('Step 6: Click the Create Autoresponder button...');
      await createButton.click();
      
      console.log('Step 7: Wait 3 seconds for navigation...');
      await page.waitForTimeout(3000);

      const urlAfter = page.url();
      console.log('URL after button click:', urlAfter);

      if (urlAfter.includes('/dashboard/email/autoresponders/create')) {
        results.buttonNavigates = true;
        console.log('SUCCESS: Button navigated to create form!');

        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-02-after-click.png'), fullPage: true });

        console.log('Step 8: Check for form fields...');
        const formFields = await page.locator('input, textarea, select').count();
        console.log('Form fields found:', formFields);
        
        if (formFields > 0) {
          results.formFieldsVisible = true;
          console.log('SUCCESS: Form fields are visible and interactive!');
          
          const labels = await page.locator('label').allTextContents();
          console.log('Form field labels:', labels);
        }

        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-03-form-fields.png'), fullPage: true });

      } else {
        results.buttonNavigates = false;
        results.errorFound = 'Button click did not navigate. Expected: /autoresponders/create, Got: ' + urlAfter;
        console.log('FAILED: Navigation did not occur. URL did not change.');
        
        await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-02-after-click.png'), fullPage: true });
      }
    }

    console.log('Step 9: Test direct navigation as fallback...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const directUrl = page.url();
    console.log('Direct navigation URL:', directUrl);
    
    if (directUrl.includes('/dashboard/email/autoresponders/create')) {
      console.log('SUCCESS: Direct navigation to create page works!');
      results.directNavigationWorks = true;
      await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-04-direct-nav.png'), fullPage: true });
    } else {
      console.log('FAILED: Direct navigation failed');
      results.directNavigationWorks = false;
    }

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    results.errorFound = error.message;
    try {
      await page.screenshot({ path: path.join(screenshotDir, 'BUG003-retest-error.png'), fullPage: true });
    } catch (e) {
      console.error('Could not take error screenshot');
    }
  }

  console.log('\n========================================');
  console.log('    BUG-003 VERIFICATION RESULTS');
  console.log('========================================');
  console.log('Create Button Navigates:', results.buttonNavigates ? 'YES' : 'NO');
  console.log('Form Fields Visible:', results.formFieldsVisible ? 'YES' : 'NO');
  console.log('Direct Navigation Works:', results.directNavigationWorks ? 'YES' : 'NO');
  console.log('Error Found:', results.errorFound || 'None');
  console.log('Console Errors:', results.consoleErrors.length > 0 ? results.consoleErrors.length + ' errors' : 'None');
  console.log('========================================');

  fs.writeFileSync(
    path.join(screenshotDir, 'BUG003-retest-results.json'),
    JSON.stringify(results, null, 2)
  );

  await browser.close();
})();
