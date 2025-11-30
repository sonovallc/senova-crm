const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots';
  
  try {
    console.log('BUG-4: Campaign Cancel Delete Workflow Testing');
    
    console.log('Step 1: Navigating to login page');
    await page.goto('http://localhost:3004');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      console.log('Logging in');
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    console.log('Step 2: Navigating to Campaigns');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '\bug4-fix-1-campaigns.png', fullPage: true });
    console.log('Screenshot: bug4-fix-1-campaigns.png');
    
    console.log('Step 3: Looking for ellipsis menu');
    const ellipsisButtons = await page.$$('button[data-testid*="ellipsis"], button[aria-label*="menu"], button:has-text("...")');
    console.log('Found ellipsis buttons: ' + ellipsisButtons.length);
    
    if (ellipsisButtons.length > 0) {
      console.log('Step 4: Clicking ellipsis menu');
      await ellipsisButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + '\bug4-fix-2-menu-open.png', fullPage: true });
      console.log('Screenshot: bug4-fix-2-menu-open.png');
      
      const menuText = await page.textContent('body');
      console.log('Menu has Delete: ' + menuText.includes('Delete'));
      console.log('Menu has Cancel Campaign: ' + menuText.includes('Cancel Campaign'));
      console.log('Menu has Clear Recipients: ' + menuText.includes('Clear Recipients'));
      
      const deleteButton = await page.$('button:has-text("Delete")');
      if (deleteButton) {
        console.log('Step 5: Testing Delete');
        await deleteButton.click();
        await page.waitForTimeout(2000);
        
        const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Yes")');
        if (confirmButton) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
        
        await page.screenshot({ path: screenshotDir + '\bug4-fix-3-result.png', fullPage: true });
        console.log('Screenshot: bug4-fix-3-result.png');
      }
    }
    
    console.log('');
    console.log('BUG-7: Autoresponder Edit Save Testing');
    
    console.log('Step 1: Navigating to Autoresponders');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '\bug7-fix-1-list.png', fullPage: true });
    console.log('Screenshot: bug7-fix-1-list.png');
    
    const editButtons = await page.$$('button:has-text("Edit"), a:has-text("Edit")');
    console.log('Found edit buttons: ' + editButtons.length);
    
    if (editButtons.length > 0) {
      console.log('Step 2: Clicking Edit');
      await editButtons[0].click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: screenshotDir + '\bug7-fix-2-edit.png', fullPage: true });
      console.log('Screenshot: bug7-fix-2-edit.png');
      
      const nameInput = await page.$('input[name="name"], input[name="title"]');
      if (nameInput) {
        console.log('Step 3: Making a change');
        const currentValue = await nameInput.inputValue();
        await nameInput.fill(currentValue + ' EDITED');
      }
      
      console.log('Step 4: Clicking Save');
      const saveButton = await page.$('button:has-text("Save")');
      if (saveButton) {
        await saveButton.click();
        await page.waitForTimeout(3000);
        
        const bodyText = await page.textContent('body');
        const hasNetworkError = bodyText.toLowerCase().includes('network failed');
        
        await page.screenshot({ path: screenshotDir + '\bug7-fix-3-save-result.png', fullPage: true });
        console.log('Screenshot: bug7-fix-3-save-result.png');
        
        console.log('');
        console.log('Network Failed Error: ' + (hasNetworkError ? 'FAIL' : 'PASS'));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
