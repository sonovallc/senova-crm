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
    console.log('Step 1: Navigate to login page');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 30000 });
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
    const variablesButton = await page.locator('[data-testid="variables-dropdown-trigger"]').first();
    const isVisible = await variablesButton.isVisible();
    
    if (!isVisible) {
      console.log('ERROR: Variables button not visible');
      throw new Error('Variables button not found');
    }

    console.log('Found Variables button with testid');

    console.log('Step 6: Clicking Variables button and measuring response time');
    const startTime = Date.now();
    await variablesButton.click();
    await page.waitForTimeout(1000);
    const responseTime = Date.now() - startTime;
    console.log('Response time: ' + responseTime + 'ms');

    console.log('Step 7: Taking screenshot of dropdown open');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'BUG001-02-dropdown-open.png'),
      fullPage: true 
    });

    console.log('Step 8: Verifying dropdown content');
    const dropdownVisible = await page.locator('[role="menu"]').isVisible();
    console.log('Dropdown visible:', dropdownVisible);

    const dropdownText = await page.locator('[role="menu"]').textContent();
    console.log('Dropdown content preview:', dropdownText.substring(0, 200));

    const expectedVars = ['first_name', 'last_name', 'email', 'phone', 'address', 'city'];
    let foundCount = 0;
    for (const v of expectedVars) {
      if (dropdownText.includes(v)) foundCount++;
    }
    
    console.log('Found ' + foundCount + '/' + expectedVars.length + ' expected variables');

    console.log('Step 9: Clicking on first_name variable');
    await page.locator('[data-testid="variable-first_name"]').click();
    await page.waitForTimeout(1000);

    console.log('Step 10: Taking screenshot after insertion');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'BUG001-03-variable-inserted.png'),
      fullPage: true 
    });

    console.log('Step 11: Checking editor content');
    const editor = await page.locator('[contenteditable="true"]').first();
    const editorContent = await editor.textContent();
    console.log('Editor content:', editorContent.substring(0, 100));

    const variableInserted = editorContent.includes('first_name');
    console.log('Variable inserted:', variableInserted);

    console.log('
=== FINAL TEST RESULTS ===');
    console.log('Response Time: ' + (responseTime < 500 ? 'PASS' : 'FAIL') + ' (' + responseTime + 'ms)');
    console.log('Dropdown Visible: ' + (dropdownVisible ? 'PASS' : 'FAIL'));
    console.log('Variables Found: ' + (foundCount >= 5 ? 'PASS' : 'FAIL'));
    console.log('Variable Inserted: ' + (variableInserted ? 'PASS' : 'FAIL'));
    
    const overallPass = responseTime < 500 && dropdownVisible && foundCount >= 5 && variableInserted;
    console.log('
*** OVERALL: ' + (overallPass ? 'PASS' : 'FAIL') + ' ***');

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