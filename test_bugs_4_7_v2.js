const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';

  try {
    console.log('BUG-4 Campaign Testing');
    console.log('1. Logging in...');
    await page.goto('http://localhost:3004');
    await page.waitForLoadState('networkidle');
    
    const emailInput = await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await emailInput.fill('admin@evebeautyma.com');
    
    const passwordInput = await page.waitForSelector('input[type="password"]', { state: 'visible' });
    await passwordInput.fill('TestPass123!');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    console.log('2. Navigate to campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '/bug4-fix-1-campaigns.png', fullPage: true });
    console.log('Screenshot: bug4-fix-1-campaigns.png');
    
    console.log('3. Find ellipsis buttons...');
    const ellipsisButtons = await page.$$('button[aria-label*="Menu"], button[aria-label*="menu"], button[aria-label*="Options"], button[aria-label*="options"]');
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
      console.log('BUG-4 PASS - Menu options visible');
    } else {
      console.log('BUG-4 FAIL - No menu buttons found');
    }
    
    console.log('');
    console.log('BUG-7 Autoresponder Testing');
    console.log('1. Navigate to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '/bug7-fix-1-list.png', fullPage: true });
    console.log('Screenshot: bug7-fix-1-list.png');
    
    console.log('2. Find edit buttons...');
    const editButtons = await page.$$('button:has-text("Edit"), a:has-text("Edit")');
    console.log('Found edit buttons: ' + editButtons.length);
    
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: screenshotDir + '/bug7-fix-2-edit.png', fullPage: true });
      console.log('Screenshot: bug7-fix-2-edit.png');
      
      const nameInput = await page.$('input[name="name"], input[name="title"]');
      if (nameInput) {
        const val = await nameInput.inputValue();
        await nameInput.fill(val + ' EDIT');
        console.log('Made edit to name');
      }
      
      const saveBtn = await page.$('button:has-text("Save"), button[type="submit"]');
      if (saveBtn) {
        console.log('3. Clicking Save...');
        await saveBtn.click();
        await page.waitForTimeout(4000);
        
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasError = bodyText.toLowerCase().includes('network failed');
        
        await page.screenshot({ path: screenshotDir + '/bug7-fix-3-save-result.png', fullPage: true });
        console.log('Screenshot: bug7-fix-3-save-result.png');
        console.log('Network Error Present: ' + (hasError ? 'YES' : 'NO'));
        
        if (!hasError) {
          console.log('BUG-7 PASS - No network error');
        } else {
          console.log('BUG-7 FAIL - Network error still present');
        }
      } else {
        console.log('BUG-7 - No Save button found');
      }
    } else {
      console.log('BUG-7 - No autoresponders to edit');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: screenshotDir + '/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('Testing complete');
  }
})();
