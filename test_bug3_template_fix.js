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
    // 1. Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('SUCCESS: Logged in');

    // 2. Navigate to inbox
    console.log('\nStep 2: Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-fix-1.png'), fullPage: true });
    console.log('SUCCESS: Screenshot 1 - Inbox view');

    // 3. Click "Compose Email" button to open composer
    console.log('\nStep 3: Opening email composer...');
    
    const composeButton = await page.locator('button:has-text("Compose Email")').first();
    if (await composeButton.count() > 0) {
      console.log('Found Compose Email button');
      await composeButton.click();
      await page.waitForTimeout(3000);
    } else {
      throw new Error('Could not find Compose Email button');
    }

    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-fix-2.png'), fullPage: true });
    console.log('SUCCESS: Screenshot 2 - Composer opened');

    // 4. Find template selector dropdown
    console.log('\nStep 4: Looking for template selector...');
    await page.waitForTimeout(2000);
    
    // Look for select dropdown
    const selectElements = await page.locator('select').all();
    console.log('Found', selectElements.length, 'select elements');
    
    let templateDropdown = null;
    if (selectElements.length > 0) {
      // Try to find the one with template options
      for (let i = 0; i < selectElements.length; i++) {
        const options = await selectElements[i].locator('option').all();
        console.log('Select', i, 'has', options.length, 'options');
        if (options.length > 1) {
          templateDropdown = selectElements[i];
          console.log('SUCCESS: Found template selector (select', i, ')');
          break;
        }
      }
    }

    if (!templateDropdown) {
      await page.screenshot({ path: path.join(screenshotDir, 'bug-3-fix-3-no-selector.png'), fullPage: true });
      throw new Error('Template selector not found');
    }

    // 5. Screenshot showing the dropdown
    console.log('\nStep 5: Preparing to select template...');
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-fix-3.png'), fullPage: true });
    console.log('SUCCESS: Screenshot 3 - Before template selection');

    // 6. Select a template
    console.log('\nStep 6: Selecting a template...');
    const options = await templateDropdown.locator('option').all();
    console.log('Found', options.length, 'options in dropdown');

    let selectedTemplate = false;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const text = await option.textContent();
      const value = await option.getAttribute('value');
      console.log('  Option', i, ':', text, '- value:', value);
      
      if (value && value !== '' && value !== 'null' && !text.includes('Select')) {
        console.log('  -> Selecting this template (value:', value, ')');
        await templateDropdown.selectOption(value);
        selectedTemplate = true;
        console.log('SUCCESS: Selected template -', text);
        break;
      }
    }

    if (!selectedTemplate) {
      console.log('WARNING: No valid templates found in dropdown');
    }

    await page.waitForTimeout(3000);

    // 7. Check for errors and take final screenshot
    console.log('\nStep 7: Checking results...');
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const errorElements = await page.locator('text=/TypeError|crash|Cannot read/i').all();
    console.log('Error elements found:', errorElements.length);
    
    if (errorElements.length > 0) {
      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].textContent();
        console.log('  Error text:', text.substring(0, 100));
      }
    }
    
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-fix-4.png'), fullPage: true });
    console.log('SUCCESS: Screenshot 4 - Result after template selection');

    await page.waitForTimeout(2000);

    console.log('\n=== FINAL VERDICT ===');
    console.log('Console errors captured:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log('  -', err));
    }

    const stillOnInbox = currentUrl.includes('/dashboard/inbox');
    const noErrorElements = errorElements.length === 0;
    const noConsoleErrors = consoleErrors.length === 0 || 
                            consoleErrors.every(e => !e.includes('TypeError') && !e.includes('Cannot read'));

    console.log('\nChecks:');
    console.log('  Still on inbox page:', stillOnInbox);
    console.log('  No TypeError elements:', noErrorElements);
    console.log('  No TypeError in console:', noConsoleErrors);

    if (stillOnInbox && noErrorElements && noConsoleErrors) {
      console.log('\n========================================');
      console.log('*** BUG-3: FIXED ***');
      console.log('Template selection worked without crashing!');
      console.log('========================================');
    } else {
      console.log('\n========================================');
      console.log('*** BUG-3: STILL BROKEN ***');
      console.log('========================================');
      if (!stillOnInbox) console.log('  ISSUE: Navigated away from inbox');
      if (!noErrorElements) console.log('  ISSUE: TypeError visible on page');
      if (!noConsoleErrors) console.log('  ISSUE: TypeError in console');
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-fix-error.png'), fullPage: true }).catch(() => {});
    console.log('\n*** BUG-3: TEST FAILED ***');
  } finally {
    await browser.close();
  }
})();
