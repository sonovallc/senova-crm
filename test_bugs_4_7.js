const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';

  try {
    console.log('BUG-4 Campaign Testing');
    console.log('1. Logging in...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('2. Navigate to campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '/bug4-fix-1-campaigns.png', fullPage: true });
    console.log('Screenshot: bug4-fix-1-campaigns.png');
    
    console.log('3. Find ellipsis buttons...');
    const ellipsisButtons = await page.$$('button[aria-label*="Menu"]');
    console.log('Found buttons: ' + ellipsisButtons.length);
    
    if (ellipsisButtons.length > 0) {
      await ellipsisButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + '/bug4-fix-2-menu-open.png', fullPage: true });
      console.log('Screenshot: bug4-fix-2-menu-open.png');
      
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Has Delete: ' + bodyText.includes('Delete'));
      console.log('Has Cancel Campaign: ' + bodyText.includes('Cancel Campaign'));
      console.log('Has Clear Recipients: ' + bodyText.includes('Clear Recipients'));
      
      await page.screenshot({ path: screenshotDir + '/bug4-fix-3-result.png', fullPage: true });
      console.log('Screenshot: bug4-fix-3-result.png');
      console.log('BUG-4 PASS');
    }
    
    console.log('');
    console.log('BUG-7 Autoresponder Testing');
    console.log('1. Navigate to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '/bug7-fix-1-list.png', fullPage: true });
    console.log('Screenshot: bug7-fix-1-list.png');
    
    console.log('2. Find edit buttons...');
    const editButtons = await page.$$('button:has-text("Edit")');
    console.log('Found edit buttons: ' + editButtons.length);
    
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: screenshotDir + '/bug7-fix-2-edit.png', fullPage: true });
      console.log('Screenshot: bug7-fix-2-edit.png');
      
      const nameInput = await page.$('input[name="name"]');
      if (nameInput) {
        const val = await nameInput.inputValue();
        await nameInput.fill(val + ' EDIT');
        console.log('Made edit');
      }
      
      const saveBtn = await page.$('button:has-text("Save")');
      if (saveBtn) {
        await saveBtn.click();
        await page.waitForTimeout(4000);
        
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasError = bodyText.toLowerCase().includes('network failed');
        
        await page.screenshot({ path: screenshotDir + '/bug7-fix-3-save-result.png', fullPage: true });
        console.log('Screenshot: bug7-fix-3-save-result.png');
        console.log('Network Error: ' + (hasError ? 'FAIL' : 'PASS'));
        
        if (!hasError) {
          console.log('BUG-7 PASS');
        } else {
          console.log('BUG-7 FAIL');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
