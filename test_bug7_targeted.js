const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';

  try {
    console.log('=== LOGGING IN ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForTimeout(4000);
    console.log('✓ Logged in');
    
    console.log('');
    console.log('=== BUG-7: Autoresponder Edit Save Testing ===');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '/bug7-fix-1-list.png', fullPage: true });
    console.log('✓ Screenshot: bug7-fix-1-list.png');
    
    console.log('Looking for autoresponder row with Test response 1...');
    
    const row = await page.$('text=Test response 1');
    if (row) {
      const parent = await row.evaluateHandle(el => el.closest('tr'));
      
      console.log('Checking for Edit button or clickable link in the row...');
      const editButton = await parent.$('button:has-text("Edit"), a:has-text("Edit")');
      
      if (editButton) {
        console.log('Found Edit button, clicking...');
        await editButton.click();
      } else {
        console.log('No Edit button found, trying to click the name link...');
        const nameLink = await parent.$('a, button');
        if (nameLink) {
          await nameLink.click();
        } else {
          const nameCell = await parent.$('text=Test response 1');
          await nameCell.click();
        }
      }
      
      await page.waitForTimeout(4000);
      await page.screenshot({ path: screenshotDir + '/bug7-fix-2-edit.png', fullPage: true });
      console.log('✓ Screenshot: bug7-fix-2-edit.png');
      
      const currentUrl = page.url();
      console.log('Current URL: ' + currentUrl);
      
      if (currentUrl.includes('/edit') || currentUrl.includes('/autoresponders/')) {
        console.log('Navigated to edit page');
        
        const nameInput = await page.$('input[name="name"], input[name="title"]');
        if (nameInput) {
          const val = await nameInput.inputValue();
          await nameInput.fill(val + ' [TEST]');
          console.log('Made edit to name field');
        }
        
        const saveBtn = await page.$('button:has-text("Save"), button[type="submit"]');
        if (saveBtn) {
          console.log('Clicking Save...');
          await saveBtn.click();
          await page.waitForTimeout(4000);
          
          const text = await page.evaluate(() => document.body.innerText);
          const hasError = text.toLowerCase().includes('network failed');
          const hasSuccess = text.toLowerCase().includes('success') || text.toLowerCase().includes('saved');
          
          await page.screenshot({ path: screenshotDir + '/bug7-fix-3-save-result.png', fullPage: true });
          console.log('✓ Screenshot: bug7-fix-3-save-result.png');
          
          console.log('');
          console.log('Save Results:');
          console.log('  Network Failed Error: ' + (hasError ? '✗ PRESENT (FAIL)' : '✓ NOT PRESENT (PASS)'));
          console.log('  Success Message: ' + (hasSuccess ? '✓ YES' : '⚠ NO'));
          
          console.log('');
          if (!hasError) {
            console.log('BUG-7 RESULT: ✓ PASS');
            console.log('No network error on save');
          } else {
            console.log('BUG-7 RESULT: ✗ FAIL');
            console.log('Network error still present');
          }
        } else {
          console.log('No Save button found on edit page');
        }
      } else {
        console.log('Did not navigate to edit page');
        console.log('BUG-7 RESULT: INCONCLUSIVE - Could not access edit form');
      }
    } else {
      console.log('Could not find autoresponder');
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: screenshotDir + '/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
