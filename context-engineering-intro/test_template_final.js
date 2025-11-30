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
    console.log(text);
  });

  try {
    console.log('STEP 1: Navigate and Login');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await page.waitForTimeout(2000);

    console.log('Filling login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: path.join(screenshotDir, '01-login-form.png'), fullPage: true });
    
    console.log('Submitting login...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    console.log('Navigating to templates...');
    await page.goto('http://localhost:3000/dashboard/email/templates', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, '02-templates-loaded.png'), fullPage: true });
    console.log('OK: Templates page loaded');

    console.log('STEP 2: Open Create Template Modal');
    
    await page.waitForSelector('button:has-text("New Template")', { timeout: 10000 });
    const newTemplateButton = await page.locator('button:has-text("New Template")').first();
    await newTemplateButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(screenshotDir, '03-modal-opened.png'), fullPage: true });
    console.log('OK: Modal opened');

    console.log('STEP 3: Fill Form Fields');
    
    const timestamp = Date.now();
    const templateName = 'Fix Test ' + timestamp;
    
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    await page.fill('input[name="name"]', templateName);
    console.log('OK: Filled name: ' + templateName);
    
    await page.waitForSelector('[role="combobox"]', { timeout: 5000 });
    const categoryTrigger = await page.locator('[role="combobox"]').first();
    await categoryTrigger.click();
    await page.waitForTimeout(1000);
    
    await page.waitForSelector('[role="option"]:has-text("General")', { timeout: 5000 });
    const generalOption = await page.locator('[role="option"]:has-text("General")').first();
    await generalOption.click();
    await page.waitForTimeout(1000);
    console.log('OK: Selected General');
    
    await page.fill('input[name="subject"]', 'Test Subject');
    console.log('OK: Filled subject');
    
    await page.waitForSelector('textarea[name="body"]', { timeout: 5000 });
    await page.fill('textarea[name="body"]', 'Test body content');
    console.log('OK: Filled body');
    
    await page.screenshot({ path: path.join(screenshotDir, '04-form-filled.png'), fullPage: true });

    console.log('STEP 4: CRITICAL TEST - Click Create Template Button');
    
    await page.waitForSelector('button:has-text("Create Template")', { timeout: 5000 });
    const createButton = await page.locator('button:has-text("Create Template")').first();
    
    console.log('Checking button state before click...');
    const isEnabled = await createButton.isEnabled();
    const isVisible = await createButton.isVisible();
    console.log('Button enabled: ' + isEnabled + ', visible: ' + isVisible);
    
    console.log('Attempting to click...');
    const startTime = Date.now();
    
    try {
      await createButton.click({ timeout: 5000 });
      const clickTime = Date.now() - startTime;
      console.log('SUCCESS: Clicked in ' + clickTime + 'ms');
      
      await page.screenshot({ path: path.join(screenshotDir, '05-button-clicked.png'), fullPage: true });
      
      console.log('STEP 5: Verify Success');
      
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(screenshotDir, '06-after-click.png'), fullPage: true });
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '07-final-state.png'), fullPage: true });

      console.log('STEP 6: Check Console Errors');
      
      const errors = consoleMessages.filter(msg => msg.includes('[error]'));
      if (errors.length > 0) {
        console.log('Console Errors: ' + errors.length);
        errors.forEach(err => console.log(err));
      } else {
        console.log('OK: No console errors');
      }

      console.log('=== TEST SUMMARY ===');
      console.log('Click time: ' + clickTime + 'ms');
      console.log('Console errors: ' + errors.length);
      
      if (clickTime < 1000 && errors.length === 0) {
        console.log('\nSTATUS: VERIFIED FIXED ✅');
        console.log('The Create Template button is now immediately clickable!');
      } else if (clickTime >= 1000) {
        console.log('\nSTATUS: STILL BROKEN ❌');
        console.log('Button click took too long: ' + clickTime + 'ms');
      } else {
        console.log('\nSTATUS: NEEDS REVIEW ⚠');
        console.log('Button works but there are ' + errors.length + ' console errors');
      }
      
    } catch (clickError) {
      console.error('CRITICAL: Button click FAILED!');
      console.error('Error: ' + clickError.message);
      await page.screenshot({ path: path.join(screenshotDir, '05-CLICK-FAILED.png'), fullPage: true });
      console.log('\nSTATUS: STILL BROKEN ❌');
      console.log('Button is NOT clickable - the bug persists!');
    }

  } catch (error) {
    console.error('TEST FAILED: ' + error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
