const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots';
  
  try {
    console.log('BUG-4 Campaign Testing');
    
    await page.goto('http://localhost:3004', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4000);
    }
    
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '\bug4-fix-1-campaigns.png', fullPage: true });
    console.log('Screenshot: bug4-fix-1-campaigns.png');
    
    const ellipsisButtons = await page.29010('button[aria-label*="Menu"], button:has-text("...")');
    console.log('Ellipsis buttons found: ' + ellipsisButtons.length);
    
    if (ellipsisButtons.length > 0) {
      await ellipsisButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + '\bug4-fix-2-menu-open.png', fullPage: true });
      console.log('Screenshot: bug4-fix-2-menu-open.png');
      
      const menuText = await page.textContent('body');
      console.log('Has Delete: ' + menuText.includes('Delete'));
      console.log('Has Cancel Campaign: ' + menuText.includes('Cancel Campaign'));
      console.log('Has Clear Recipients: ' + menuText.includes('Clear Recipients'));
      
      const deleteButton = await page.;
      if (deleteButton) {
        await deleteButton.click();
        await page.waitForTimeout(2000);
        
        const confirmButton = await page.;
        if (confirmButton) {
          await confirmButton.click();
          await page.waitForTimeout(3000);
        }
        
        await page.screenshot({ path: screenshotDir + '\bug4-fix-3-result.png', fullPage: true });
        console.log('Screenshot: bug4-fix-3-result.png');
        console.log('BUG-4 COMPLETE');
      }
    }
    
    console.log('');
    console.log('BUG-7 Autoresponder Testing');
    
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '\bug7-fix-1-list.png', fullPage: true });
    console.log('Screenshot: bug7-fix-1-list.png');
    
    const editButtons = await page.29010('button:has-text("Edit"), a:has-text("Edit")');
    console.log('Edit buttons found: ' + editButtons.length);
    
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: screenshotDir + '\bug7-fix-2-edit.png', fullPage: true });
      console.log('Screenshot: bug7-fix-2-edit.png');
      
      const nameInput = await page.;
      if (nameInput) {
        const currentValue = await nameInput.inputValue();
        await nameInput.fill(currentValue + ' EDITED');
        console.log('Made edit to name field');
      }
      
      const saveButton = await page.;
      if (saveButton) {
        await saveButton.click();
        await page.waitForTimeout(4000);
        
        const bodyText = await page.textContent('body');
        const hasNetworkError = bodyText.toLowerCase().includes('network failed');
        
        await page.screenshot({ path: screenshotDir + '\bug7-fix-3-save-result.png', fullPage: true });
        console.log('Screenshot: bug7-fix-3-save-result.png');
        console.log('Network Error Present: ' + (hasNetworkError ? 'FAIL' : 'PASS'));
        
        if (!hasNetworkError) {
          console.log('BUG-7 PASSED');
        } else {
          console.log('BUG-7 FAILED');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
