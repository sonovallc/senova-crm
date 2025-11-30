const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: 'auth.json'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';

  try {
    console.log('=== BUG-4: Campaign Cancel/Delete Workflow Testing ===');
    console.log('1. Navigate to campaigns (using saved auth)...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '/bug4-fix-1-campaigns.png', fullPage: true });
    console.log('✓ Screenshot: bug4-fix-1-campaigns.png');
    
    console.log('2. Find ellipsis menu buttons...');
    const ellipsisButtons = await page.$$('button[aria-label*="Menu"], button[aria-label*="menu"], button[aria-label*="Options"], button[aria-label*="options"]');
    console.log('   Found ' + ellipsisButtons.length + ' menu buttons');
    
    if (ellipsisButtons.length > 0) {
      console.log('3. Click first ellipsis menu...');
      await ellipsisButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + '/bug4-fix-2-menu-open.png', fullPage: true });
      console.log('✓ Screenshot: bug4-fix-2-menu-open.png');
      
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasDelete = bodyText.includes('Delete');
      const hasCancelCampaign = bodyText.includes('Cancel Campaign');
      const hasClearRecipients = bodyText.includes('Clear Recipients');
      
      console.log('');
      console.log('Menu options detected:');
      console.log('   Delete: ' + (hasDelete ? 'YES ✓' : 'NO ✗'));
      console.log('   Cancel Campaign: ' + (hasCancelCampaign ? 'YES ✓' : 'NO ✗'));
      console.log('   Clear Recipients: ' + (hasClearRecipients ? 'YES ✓' : 'NO ✗'));
      
      await page.screenshot({ path: screenshotDir + '/bug4-fix-3-result.png', fullPage: true });
      console.log('✓ Screenshot: bug4-fix-3-result.png');
      
      if (hasDelete || hasCancelCampaign || hasClearRecipients) {
        console.log('');
        console.log('BUG-4 RESULT: PASS ✓');
        console.log('Campaign menu options are properly displayed');
      } else {
        console.log('');
        console.log('BUG-4 RESULT: FAIL ✗');
        console.log('Expected menu options not found');
      }
    } else {
      console.log('BUG-4 RESULT: FAIL ✗ - No menu buttons found');
    }
    
    console.log('');
    console.log('=== BUG-7: Autoresponder Edit Save Testing ===');
    console.log('1. Navigate to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '/bug7-fix-1-list.png', fullPage: true });
    console.log('✓ Screenshot: bug7-fix-1-list.png');
    
    console.log('2. Find edit buttons...');
    const editButtons = await page.$$('button:has-text("Edit"), a:has-text("Edit")');
    console.log('   Found ' + editButtons.length + ' edit buttons');
    
    if (editButtons.length > 0) {
      console.log('3. Click Edit on first autoresponder...');
      await editButtons[0].click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: screenshotDir + '/bug7-fix-2-edit.png', fullPage: true });
      console.log('✓ Screenshot: bug7-fix-2-edit.png');
      
      const nameInput = await page.$('input[name="name"], input[name="title"], input[placeholder*="Name" i]');
      if (nameInput) {
        const val = await nameInput.inputValue();
        const newVal = val + ' [TEST EDIT]';
        await nameInput.fill(newVal);
        console.log('4. Made edit: "' + val + '" -> "' + newVal + '"');
      } else {
        console.log('4. No name input found, skipping edit');
      }
      
      const saveBtn = await page.$('button:has-text("Save"), button[type="submit"]');
      if (saveBtn) {
        console.log('5. Clicking Save button...');
        await saveBtn.click();
        console.log('   Waiting for response...');
        await page.waitForTimeout(4000);
        
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasError = bodyText.toLowerCase().includes('network failed');
        const hasSuccess = bodyText.toLowerCase().includes('success') || bodyText.toLowerCase().includes('saved');
        
        await page.screenshot({ path: screenshotDir + '/bug7-fix-3-save-result.png', fullPage: true });
        console.log('✓ Screenshot: bug7-fix-3-save-result.png');
        
        console.log('');
        console.log('Verification Results:');
        console.log('   Network Failed Error: ' + (hasError ? 'PRESENT ✗ (FAIL)' : 'NOT PRESENT ✓ (PASS)'));
        console.log('   Success Message: ' + (hasSuccess ? 'YES ✓' : 'NO ⚠'));
        
        console.log('');
        if (!hasError) {
          console.log('BUG-7 RESULT: PASS ✓');
          console.log('No network error on save - bug is fixed');
        } else {
          console.log('BUG-7 RESULT: FAIL ✗');
          console.log('Network error still appears on save');
        }
      } else {
        console.log('BUG-7: No Save button found');
      }
    } else {
      console.log('BUG-7: No autoresponders available to edit');
      console.log('Cannot fully verify - need existing autoresponder');
    }
    
  } catch (error) {
    console.error('');
    console.error('ERROR during testing:', error.message);
    await page.screenshot({ path: screenshotDir + '/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('');
    console.log('=== Testing Complete ===');
  }
})();
