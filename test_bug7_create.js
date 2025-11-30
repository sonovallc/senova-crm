const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';

  try {
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForTimeout(4000);
    console.log('✓ Logged in');
    
    console.log('');
    console.log('=== BUG-7: Testing Autoresponder Create/Edit/Save ===');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    
    console.log('Clicking Create Autoresponder button...');
    const createBtn = await page.$('button:has-text("Create Autoresponder")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: screenshotDir + '/bug7-fix-1-create-form.png', fullPage: true });
      console.log('✓ Screenshot: bug7-fix-1-create-form.png');
      
      console.log('Filling in autoresponder form...');
      const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
      if (nameInput) {
        await nameInput.fill('Test Autoresponder for BUG-7');
        console.log('Filled name field');
      }
      
      await page.screenshot({ path: screenshotDir + '/bug7-fix-2-form-filled.png', fullPage: true });
      console.log('✓ Screenshot: bug7-fix-2-form-filled.png');
      
      const saveBtn = await page.$('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
      if (saveBtn) {
        console.log('Clicking Save/Create button...');
        await saveBtn.click();
        console.log('Waiting for response...');
        await page.waitForTimeout(5000);
        
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasNetworkError = bodyText.toLowerCase().includes('network failed');
        const hasSuccess = bodyText.toLowerCase().includes('success') || bodyText.toLowerCase().includes('saved') || bodyText.toLowerCase().includes('created');
        
        await page.screenshot({ path: screenshotDir + '/bug7-fix-3-save-result.png', fullPage: true });
        console.log('✓ Screenshot: bug7-fix-3-save-result.png');
        
        console.log('');
        console.log('=== BUG-7 VERIFICATION RESULTS ===');
        console.log('Network Failed Error: ' + (hasNetworkError ? '✗ PRESENT (FAIL)' : '✓ NOT PRESENT (PASS)'));
        console.log('Success Message: ' + (hasSuccess ? '✓ YES' : '⚠ NO'));
        
        console.log('');
        if (!hasNetworkError) {
          console.log('BUG-7 RESULT: ✓ PASS');
          console.log('No network error on autoresponder save - bug is fixed');
        } else {
          console.log('BUG-7 RESULT: ✗ FAIL');
          console.log('Network error still appears on save');
        }
      } else {
        console.log('No Save button found');
      }
    } else {
      console.log('Create Autoresponder button not found');
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: screenshotDir + '/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('');
    console.log('=== Complete ===');
  }
})();
