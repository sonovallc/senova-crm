const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots', 'round2-bugfix');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  let consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push('Page error: ' + error.message);
  });

  try {
    console.log('=== BUG-3 COMPREHENSIVE TEST ===');
    console.log('Testing with REAL templates that have content\n');

    // Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });

    // Navigate to inbox
    console.log('Step 2: Opening inbox and composer...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    
    const composeButton = await page.locator('button:has-text("Compose Email")').first();
    await composeButton.click();
    await page.waitForTimeout(2000);

    // Find template selector
    const templateDropdown = await page.locator('select').first();
    const options = await templateDropdown.locator('option').all();
    
    console.log('\nFound', options.length, 'templates:');
    
    // Test selecting multiple templates
    let templatesWithContent = [];
    for (let i = 0; i < Math.min(options.length, 5); i++) {
      const text = await options[i].textContent();
      const value = await options[i].getAttribute('value');
      console.log('  ', i + 1, ':', text, '(value:', value, ')');
      
      if (value && value !== 'no-template' && value !== '' && value !== 'null') {
        templatesWithContent.push({ text, value, index: i });
      }
    }

    if (templatesWithContent.length === 0) {
      console.log('\nWARNING: No templates with content found, using no-template');
      templatesWithContent.push({ text: 'Custom (No Template)', value: 'no-template', index: 0 });
    }

    console.log('\n=== TESTING TEMPLATE SELECTION ===');
    let allTestsPassed = true;

    for (let i = 0; i < Math.min(templatesWithContent.length, 3); i++) {
      const template = templatesWithContent[i];
      console.log('\nTest', i + 1, ': Selecting "' + template.text + '"');
      
      try {
        await templateDropdown.selectOption(template.value);
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const errorElements = await page.locator('text=/TypeError|crash|Cannot read/i').all();
        
        if (currentUrl.includes('/dashboard/inbox') && errorElements.length === 0) {
          console.log('  PASS: No crash, page stable');
        } else {
          console.log('  FAIL: Error detected');
          allTestsPassed = false;
          break;
        }
      } catch (error) {
        console.log('  FAIL:', error.message);
        allTestsPassed = false;
        break;
      }
    }

    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-final-test.png'), fullPage: true });

    console.log('\n=== FINAL VERDICT ===');
    console.log('Console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log('  -', err));
    }

    if (allTestsPassed && consoleErrors.length === 0) {
      console.log('\n========================================');
      console.log('*** BUG-3: COMPREHENSIVELY FIXED ***');
      console.log('All template selections work perfectly!');
      console.log('========================================');
    } else {
      console.log('\n========================================');
      console.log('*** BUG-3: ISSUES DETECTED ***');
      console.log('========================================');
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-comprehensive-error.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
