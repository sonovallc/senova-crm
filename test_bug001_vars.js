const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'testing', 'production-fixes');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    console.log('3. Waiting for navigation...');
    await page.waitForTimeout(4000);
    
    console.log('4. Navigating to email compose page...');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('5. Taking screenshot of compose page...');
    await page.screenshot({ path: path.join(screenshotDir, 'BUG001-01-compose-page.png'), fullPage: true });
    
    console.log('6. Finding Variables button...');
    const variablesBtn = await page.locator('[data-testid="variables-dropdown-trigger"]').first();
    const isVisible = await variablesBtn.isVisible();
    console.log('   Variables button visible:', isVisible);
    
    if (!isVisible) {
      console.log('ERROR: Variables button not found');
      throw new Error('Variables button not visible');
    }
    
    console.log('7. Clicking Variables button (measuring response time)...');
    const startTime = Date.now();
    await variablesBtn.click();
    await page.waitForTimeout(500);
    const responseTime = Date.now() - startTime;
    console.log('   Response time:', responseTime, 'ms');
    console.log('   Response time check:', responseTime < 500 ? 'PASS' : 'FAIL');
    
    console.log('8. Taking screenshot with dropdown open...');
    await page.screenshot({ path: path.join(screenshotDir, 'BUG001-02-dropdown-open.png'), fullPage: true });
    
    console.log('9. Verifying dropdown content...');
    const dropdown = await page.locator('[role="menu"]').first();
    const dropdownVisible = await dropdown.isVisible();
    console.log('   Dropdown visible:', dropdownVisible);
    
    const dropdownText = await dropdown.textContent();
    console.log('   Dropdown text length:', dropdownText.length);
    
    const expectedVars = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'company', 'current_date'];
    let foundCount = 0;
    const foundVars = [];
    const missingVars = [];
    
    for (const v of expectedVars) {
      if (dropdownText.includes(v)) {
        foundCount++;
        foundVars.push(v);
      } else {
        missingVars.push(v);
      }
    }
    console.log('   Found variables:', foundVars.join(', '));
    if (missingVars.length > 0) {
      console.log('   Missing variables:', missingVars.join(', '));
    }
    
    console.log('10. Clicking first_name variable...');
    try {
      await page.locator('[data-testid="variable-first_name"]').click();
      console.log('    Clicked first_name successfully');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('    Error clicking first_name:', e.message);
    }
    
    console.log('11. Taking screenshot after insertion...');
    await page.screenshot({ path: path.join(screenshotDir, 'BUG001-03-variable-inserted.png'), fullPage: true });
    
    console.log('12. Checking editor content...');
    let variableInserted = false;
    try {
      const editor = await page.locator('[contenteditable="true"]').first();
      const editorContent = await editor.textContent();
      variableInserted = editorContent.includes('first_name');
      console.log('    Variable inserted:', variableInserted);
      console.log('    Editor content preview:', editorContent.substring(0, 100));
    } catch (e) {
      console.log('    Could not read editor:', e.message);
    }
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Test 1: Compose page loads - PASS');
    console.log('Test 2: Variables button visible - ' + (isVisible ? 'PASS' : 'FAIL'));
    console.log('Test 3: Response time < 500ms - ' + (responseTime < 500 ? 'PASS' : 'FAIL') + ' (' + responseTime + 'ms)');
    console.log('Test 4: Dropdown displays - ' + (dropdownVisible ? 'PASS' : 'FAIL'));
    console.log('Test 5: Variables present - ' + (foundCount >= 6 ? 'PASS' : 'PARTIAL') + ' (' + foundCount + '/8)');
    console.log('Test 6: Variable insertion - ' + (variableInserted ? 'PASS' : 'FAIL'));
    
    const overallPass = isVisible && responseTime < 500 && dropdownVisible && foundCount >= 6;
    console.log('\n*** OVERALL: ' + (overallPass ? 'PASS' : 'FAIL') + ' ***');
    
    console.log('\nScreenshots saved to:', screenshotDir);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'BUG001-ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
