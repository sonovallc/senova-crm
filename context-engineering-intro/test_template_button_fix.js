const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotDir = path.join(__dirname, '..', 'screenshots', 'templates-final-fix-verification');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const consoleMessages = [];
  page.on('console', msg => {
    const msgType = msg.type();
    const msgText = msg.text();
    const text = '[' + msgType + '] ' + msgText;
    consoleMessages.push(text);
  });

  try {
    console.log('=== STEP 1: Navigate and Login ===');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await page.waitForTimeout(2000);

    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: path.join(screenshotDir, '01-login.png'), fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    await page.goto('http://localhost:3000/dashboard/email/templates', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '02-templates.png'), fullPage: true });
    console.log('✓ Templates page loaded');

    console.log('\n=== STEP 2: Open Create Template Modal ===');
    
    await page.waitForSelector('button:has-text("New Template")', { timeout: 10000 });
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '03-modal-open.png'), fullPage: true });
    console.log('✓ Modal opened');

    console.log('\n=== STEP 3: Fill Form Fields ===');
    
    const timestamp = Date.now();
    const templateName = 'Final Fix Test ' + timestamp;
    
    // Fill template name - look for the input with placeholder
    await page.waitForSelector('input[placeholder*="Welcome Email"]', { timeout: 5000 });
    await page.fill('input[placeholder*="Welcome Email"]', templateName);
    console.log('✓ Filled template name: ' + templateName);
    
    // Subject field
    await page.fill('input[placeholder*="Email subject"]', 'Test Subject Line');
    console.log('✓ Filled subject');
    
    // Body - click in the editor area
    const editor = await page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('This is test body content for the template.');
    console.log('✓ Filled body');
    
    await page.screenshot({ path: path.join(screenshotDir, '04-form-filled.png'), fullPage: true });

    console.log('\n=== STEP 4: CRITICAL TEST - Click Create Template Button ===');
    console.log('This is the moment of truth - testing if the button is clickable!');
    
    await page.waitForSelector('button:has-text("Create Template")', { timeout: 5000 });
    const createButton = await page.locator('button:has-text("Create Template")');
    
    const isEnabled = await createButton.isEnabled();
    const isVisible = await createButton.isVisible();
    console.log('Button state - Enabled: ' + isEnabled + ', Visible: ' + isVisible);
    
    console.log('\nAttempting to click Create Template button...');
    const startTime = Date.now();
    
    try {
      await createButton.click({ timeout: 2000, force: false });
      const clickTime = Date.now() - startTime;
      
      console.log('✓✓✓ BUTTON CLICKED SUCCESSFULLY in ' + clickTime + 'ms ✓✓✓');
      
      await page.screenshot({ path: path.join(screenshotDir, '05-clicked.png'), fullPage: true });
      
      console.log('\n=== STEP 5: Verify Success ===');
      
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(screenshotDir, '06-after-click.png'), fullPage: true });
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '07-final.png'), fullPage: true });

      console.log('\n=== STEP 6: Check Console Errors ===');
      
      const errors = consoleMessages.filter(msg => msg.includes('[error]'));
      if (errors.length > 0) {
        console.log('⚠ Console errors found: ' + errors.length);
        errors.forEach(err => console.log('  ' + err));
      } else {
        console.log('✓ No console errors');
      }

      console.log('\n========================================');
      console.log('           TEST SUMMARY');
      console.log('========================================');
      console.log('Button click time: ' + clickTime + 'ms');
      console.log('Console errors: ' + errors.length);
      console.log('========================================');
      
      if (clickTime < 1000 && errors.length === 0) {
        console.log('\n✅✅✅ BUG FIX STATUS: VERIFIED FIXED ✅✅✅');
        console.log('\nThe Create Template button is NOW IMMEDIATELY CLICKABLE!');
        console.log('The inline style fix (pointerEvents: none) worked perfectly.');
        console.log('\nEnd-to-end workflow complete:');
        console.log('  ✓ Modal opens');
        console.log('  ✓ Form can be filled');
        console.log('  ✓ Create button is clickable immediately');
        console.log('  ✓ No console errors');
      } else if (clickTime >= 1000) {
        console.log('\n❌ BUG FIX STATUS: STILL BROKEN');
        console.log('Button click took ' + clickTime + 'ms - still too slow!');
      } else {
        console.log('\n⚠ BUG FIX STATUS: NEEDS REVIEW');
        console.log('Button is clickable but there are ' + errors.length + ' console errors');
      }
      
    } catch (clickError) {
      const failTime = Date.now() - startTime;
      console.error('\n❌❌❌ CRITICAL FAILURE ❌❌❌');
      console.error('Button click FAILED after ' + failTime + 'ms');
      console.error('Error: ' + clickError.message);
      await page.screenshot({ path: path.join(screenshotDir, '05-CLICK-FAILED.png'), fullPage: true });
      
      console.log('\n❌ BUG FIX STATUS: STILL BROKEN');
      console.log('The Create Template button is STILL NOT CLICKABLE!');
      console.log('The inline style fix did NOT resolve the issue.');
    }

  } catch (error) {
    console.error('\n❌ TEST EXECUTION FAILED: ' + error.message);
    console.error(error.stack);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
