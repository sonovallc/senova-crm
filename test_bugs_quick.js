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
    console.log('Logged in');
    
    console.log('');
    console.log('=== BUG-4: Campaign Menu Testing ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '/bug4-fix-1-campaigns.png', fullPage: true });
    console.log('Screenshot: bug4-fix-1-campaigns.png');
    
    const allButtons = await page.$$('button');
    console.log('Total buttons: ' + allButtons.length);
    
    let foundMenu = false;
    for (let i = 0; i < allButtons.length; i++) {
      const ariaLabel = await allButtons[i].getAttribute('aria-label');
      if (ariaLabel && ariaLabel.toLowerCase().includes('menu')) {
        console.log('Found menu button: ' + ariaLabel);
        await allButtons[i].click();
        foundMenu = true;
        break;
      }
    }
    
    if (foundMenu) {
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + '/bug4-fix-2-menu-open.png', fullPage: true });
      console.log('Screenshot: bug4-fix-2-menu-open.png');
      
      const text = await page.evaluate(() => document.body.innerText);
      const hasDelete = text.includes('Delete');
      const hasCancelCampaign = text.includes('Cancel Campaign');
      const hasClearRecipients = text.includes('Clear Recipients');
      
      console.log('Menu Options:');
      console.log('  Delete: ' + (hasDelete ? 'YES' : 'NO'));
      console.log('  Cancel Campaign: ' + (hasCancelCampaign ? 'YES' : 'NO'));
      console.log('  Clear Recipients: ' + (hasClearRecipients ? 'YES' : 'NO'));
      
      await page.screenshot({ path: screenshotDir + '/bug4-fix-3-result.png', fullPage: true });
      console.log('Screenshot: bug4-fix-3-result.png');
      
      if (hasDelete || hasCancelCampaign || hasClearRecipients) {
        console.log('BUG-4 RESULT: PASS');
      } else {
        console.log('BUG-4 RESULT: FAIL');
      }
    } else {
      console.log('BUG-4 RESULT: NO MENU FOUND');
    }
    
    console.log('');
    console.log('=== BUG-7: Autoresponder Save Testing ===');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '/bug7-fix-1-list.png', fullPage: true });
    console.log('Screenshot: bug7-fix-1-list.png');
    
    const editEls = await page.$$('a:has-text("Edit"), button:has-text("Edit")');
    console.log('Edit elements: ' + editEls.length);
    
    if (editEls.length > 0) {
      await editEls[0].click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: screenshotDir + '/bug7-fix-2-edit.png', fullPage: true });
      console.log('Screenshot: bug7-fix-2-edit.png');
      
      const nameInput = await page.$('input[name="name"]');
      if (nameInput) {
        const val = await nameInput.inputValue();
        await nameInput.fill(val + ' TEST');
      }
      
      const saveBtn = await page.$('button:has-text("Save")');
      if (saveBtn) {
        await saveBtn.click();
        await page.waitForTimeout(4000);
        
        const text = await page.evaluate(() => document.body.innerText);
        const hasError = text.toLowerCase().includes('network failed');
        
        await page.screenshot({ path: screenshotDir + '/bug7-fix-3-save-result.png', fullPage: true });
        console.log('Screenshot: bug7-fix-3-save-result.png');
        console.log('Network Error: ' + (hasError ? 'YES (FAIL)' : 'NO (PASS)'));
        
        if (!hasError) {
          console.log('BUG-7 RESULT: PASS');
        } else {
          console.log('BUG-7 RESULT: FAIL');
        }
      }
    } else {
      console.log('BUG-7: No autoresponders');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: screenshotDir + '/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
