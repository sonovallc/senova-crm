const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'testing', 'production-fixes');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('Step 1: Navigate to http://localhost:3004');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('Step 2: Login with test credentials');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('Step 3: Navigate to /dashboard/email/compose');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('Step 4: Taking screenshot of compose page');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'BUG001-01-compose-page.png'),
      fullPage: true 
    });

    console.log('Step 5: Finding Variables button');
    const possibleSelectors = [
      'button:has-text("Variables")',
      'button:has-text("Insert Variable")',
      '[aria-label*="variable" i]',
      '[title*="variable" i]',
      'button[class*="variable" i]',
      '[data-testid*="variable"]'
    ];

    let variablesButton = null;
    for (const selector of possibleSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          variablesButton = button;
          console.log('Found Variables button with selector: ' + selector);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!variablesButton) {
      console.log('ERROR: Variables button not found. Checking available buttons:');
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(b => ({ text: b.textContent, class: b.className, aria: b.getAttribute('aria-label') }))
      );
      console.log('Available buttons:', JSON.stringify(allButtons, null, 2));
      throw new Error('Variables button not found on page');
    }

    console.log('Step 6: Clicking Variables button and measuring response time');
    const startTime = Date.now();
    await variablesButton.click();
    await page.waitForTimeout(1000);
    const responseTime = Date.now() - startTime;
    console.log('Response time: ' + responseTime + 'ms');

    if (responseTime > 500) {
      console.log('WARNING: Response time ' + responseTime + 'ms exceeds 500ms threshold');
    }

    console.log('Step 7: Taking screenshot of dropdown open');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'BUG001-02-dropdown-open.png'),
      fullPage: true 
    });

    console.log('Step 8: Verifying dropdown content');
    const dropdownVisible = await page.isVisible('[role="menu"], [class*="dropdown"], [class*="menu"]');
    console.log('Dropdown visible:', dropdownVisible);

    const dropdownText = await page.evaluate(() => {
      const dropdown = document.querySelector('[role="menu"], [class*="dropdown"], [class*="menu"]');
      return dropdown ? dropdown.textContent : 'No dropdown found';
    });
    console.log('Dropdown content:', dropdownText);

    const expectedCategories = [
      'Contact Info', 'first_name', 'last_name', 'full_name', 'email', 'phone',
      'Address', 'address', 'city', 'state', 'zip_code', 'country',
      'Company', 'company', 'job_title',
      'Social', 'facebook', 'instagram', 'linkedin', 'twitter',
      'System', 'current_date', 'unsubscribe_link', 'company_name',
      'Sender', 'sender_name', 'sender_email', 'sender_signature'
    ];

    const foundCategories = [];
    const missingCategories = [];
    
    for (const category of expectedCategories) {
      if (dropdownText.toLowerCase().includes(category.toLowerCase())) {
        foundCategories.push(category);
      } else {
        missingCategories.push(category);
      }
    }

    console.log('Found categories:', foundCategories);
    console.log('Missing categories:', missingCategories);

    console.log('Step 9: Clicking on first_name variable');
    try {
      await page.click('text=first_name', { timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('Error clicking first_name:', e.message);
    }

    console.log('Step 10: Taking screenshot of variable inserted');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'BUG001-03-variable-inserted.png'),
      fullPage: true 
    });

    console.log('Step 11: Checking if {{first_name}} was inserted');
    const editorContent = await page.evaluate(() => {
      const selectors = ['[contenteditable="true"]', 'textarea', '.editor', '[role="textbox"]'];
      for (const sel of selectors) {
        const editor = document.querySelector(sel);
        if (editor) {
          return editor.textContent || editor.value || 'Editor found but empty';
        }
      }
      return 'No editor found';
    });
    console.log('Editor content:', editorContent);

    const variableInserted = editorContent.includes('{{first_name}}');
    console.log('Variable inserted:', variableInserted);

    console.log('\n=== TEST RESULTS ===');
    console.log('Response Time: ' + (responseTime < 500 ? 'PASS' : 'FAIL') + ' (' + responseTime + 'ms)');
    console.log('Dropdown Visible: ' + (dropdownVisible ? 'PASS' : 'FAIL'));
    console.log('Categories Found: ' + foundCategories.length + '/' + expectedCategories.length);
    console.log('Variable Inserted: ' + (variableInserted ? 'PASS' : 'FAIL'));

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'BUG001-ERROR.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
