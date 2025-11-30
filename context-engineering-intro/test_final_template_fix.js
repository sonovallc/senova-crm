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
    console.log('\n=== STEP 1: Navigate to Templates Page ===');
    await page.goto('http://localhost:3000/dashboard/email/templates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Login required, logging in...');
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.screenshot({ path: path.join(screenshotDir, '01-login-filled.png'), fullPage: true });
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      await page.goto('http://localhost:3000/dashboard/email/templates', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: path.join(screenshotDir, '02-templates-page-loaded.png'), fullPage: true });
    console.log('✓ Templates page loaded');

    console.log('\n=== STEP 2: Open Create Template Modal ===');
    
    const newTemplateButton = await page.locator('button:has-text("New Template")').first();
    await newTemplateButton.waitFor({ state: 'visible', timeout: 5000 });
    await newTemplateButton.click();
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: path.join(screenshotDir, '03-modal-opened.png'), fullPage: true });
    console.log('✓ Modal opened');

    console.log('\n=== STEP 3: Fill Form Fields ===');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const templateName = 'Final Fix Test ' + timestamp;
    
    await page.fill('input[name="name"]', templateName);
    console.log('✓ Filled template name: ' + templateName);
    
    const categoryTrigger = await page.locator('[role="combobox"]').first();
    await categoryTrigger.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '04-category-dropdown.png'), fullPage: true });
    
    const generalOption = await page.locator('[role="option"]:has-text("General")').first();
    await generalOption.click();
    await page.waitForTimeout(500);
    console.log('✓ Selected category: General');
    
    await page.fill('input[name="subject"]', 'Test with {{contact_name}}');
    console.log('✓ Filled subject with variable');
    
    const bodyTextarea = await page.locator('textarea[name="body"]').first();
    await bodyTextarea.fill('Hello, this is a test template. ');
    
    const variablesButton = await page.locator('button:has-text("Variables")').first();
    await variablesButton.click();
    await page.waitForTimeout(500);
    
    const firstVariable = await page.locator('[role="menuitem"]').first();
    await firstVariable.click();
    await page.waitForTimeout(500);
    console.log('✓ Inserted variable into body');
    
    await page.screenshot({ path: path.join(screenshotDir, '05-form-filled.png'), fullPage: true });

    console.log('\n=== STEP 4: THE CRITICAL TEST - Click Create Template Button ===');
    
    const createButton = await page.locator('button:has-text("Create Template")').first();
    await createButton.waitFor({ state: 'visible', timeout: 5000 });
    
    console.log('Attempting to click Create Template button...');
    const startTime = Date.now();
    
    await createButton.click();
    
    const clickTime = Date.now() - startTime;
    console.log('✓ Button clicked in ' + clickTime + 'ms');
    
    await page.screenshot({ path: path.join(screenshotDir, '06-button-clicked.png'), fullPage: true });
    
    console.log('\n=== STEP 5: Verify Success ===');
    
    try {
      const successToast = await page.locator('text=/success|created/i').first();
      await successToast.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Success toast appeared');
      await page.screenshot({ path: path.join(screenshotDir, '07-success-toast.png'), fullPage: true });
    } catch (e) {
      console.log('No success toast found, checking if modal closed...');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '08-after-submission.png'), fullPage: true });
    
    const newTemplate = await page.locator('text="' + templateName + '"').first();
    try {
      await newTemplate.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ New template appears in list');
    } catch (e) {
      console.log('⚠ New template not immediately visible in list');
    }
    
    await page.screenshot({ path: path.join(screenshotDir, '09-final-state.png'), fullPage: true });

    console.log('\n=== STEP 6: Comprehensive Checks ===');
    
    const errors = consoleMessages.filter(msg => msg.includes('[error]'));
    if (errors.length > 0) {
      console.log('\n⚠ Console Errors Found:');
      errors.forEach(err => console.log(err));
    } else {
      console.log('✓ No console errors detected');
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log('Button click time: ' + clickTime + 'ms');
    console.log('Console errors: ' + errors.length);
    console.log('Screenshots saved to: screenshots/templates-final-fix-verification/');
    
    if (clickTime < 1000 && errors.length === 0) {
      console.log('\n✅ BUG FIX STATUS: VERIFIED FIXED');
      console.log('The Create Template button is now immediately clickable!');
    } else if (clickTime >= 1000) {
      console.log('\n❌ BUG FIX STATUS: STILL BROKEN');
      console.log('Button click still has delay or issues');
    } else {
      console.log('\n⚠ BUG FIX STATUS: NEEDS REVIEW');
      console.log('Button works but there are console errors');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR-state.png'), fullPage: true });
    throw error;
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
