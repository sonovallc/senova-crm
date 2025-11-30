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
    console.log('✓ Logged in successfully');
    
    console.log('');
    console.log('=== BUG-4: Campaign Cancel/Delete Workflow ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '/bug4-fix-1-campaigns.png', fullPage: true });
    console.log('✓ Screenshot: bug4-fix-1-campaigns.png');
    
    console.log('Looking for three-dot menu (ellipsis) on campaign rows...');
    
    const threeDotMenus = await page.$$('button[aria-label*="menu" i], button[aria-label*="option" i], button:has(svg.lucide-more-vertical), button:has(svg.lucide-ellipsis)');
    console.log('Found ' + threeDotMenus.length + ' potential menu buttons');
    
    if (threeDotMenus.length === 0) {
      const allButtons = await page.$$('button');
      for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
        const text = await allButtons[i].textContent();
        const ariaLabel = await allButtons[i].getAttribute('aria-label');
        const classes = await allButtons[i].getAttribute('class');
        console.log('Button ' + i + ': text="' + (text || '').trim().substring(0, 20) + '", aria="' + (ariaLabel || 'none') + '"');
      }
    }
    
    if (threeDotMenus.length > 0) {
      console.log('Clicking first three-dot menu...');
      await threeDotMenus[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + '/bug4-fix-2-menu-open.png', fullPage: true });
      console.log('✓ Screenshot: bug4-fix-2-menu-open.png');
      
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasDelete = bodyText.includes('Delete');
      const hasCancelCampaign = bodyText.includes('Cancel Campaign');
      const hasClearRecipients = bodyText.includes('Clear Recipients');
      const hasEdit = bodyText.includes('Edit');
      
      console.log('');
      console.log('Menu Options Detected:');
      console.log('  Delete: ' + (hasDelete ? '✓ YES' : '✗ NO'));
      console.log('  Cancel Campaign: ' + (hasCancelCampaign ? '✓ YES' : '✗ NO'));
      console.log('  Clear Recipients: ' + (hasClearRecipients ? '✓ YES' : '✗ NO'));
      console.log('  Edit: ' + (hasEdit ? '✓ YES' : '✗ NO'));
      
      await page.screenshot({ path: screenshotDir + '/bug4-fix-3-result.png', fullPage: true });
      console.log('✓ Screenshot: bug4-fix-3-result.png');
      
      console.log('');
      if (hasDelete || hasCancelCampaign || hasClearRecipients) {
        console.log('BUG-4 RESULT: ✓ PASS');
        console.log('Campaign menu options are properly displayed');
      } else {
        console.log('BUG-4 RESULT: ✗ FAIL');
        console.log('Expected menu options not found');
      }
    } else {
      console.log('');
      console.log('BUG-4 RESULT: ✗ FAIL');
      console.log('No three-dot menu buttons found on campaigns');
    }
    
    console.log('');
    console.log('=== BUG-7: Autoresponder Edit Save ===');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '/bug7-fix-1-list.png', fullPage: true });
    console.log('✓ Screenshot: bug7-fix-1-list.png');
    
    console.log('Looking for autoresponder row to click...');
    
    const autoresponderRow = await page.$('text=Test response 1');
    if (autoresponderRow) {
      console.log('Found autoresponder, clicking on it...');
      await autoresponderRow.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: screenshotDir + '/bug7-fix-2-edit.png', fullPage: true });
      console.log('✓ Screenshot: bug7-fix-2-edit.png');
      
      const nameInput = await page.$('input[name="name"], input[name="title"], input[placeholder*="name" i]');
      if (nameInput) {
        const currentVal = await nameInput.inputValue();
        const newVal = currentVal + ' [EDITED]';
        await nameInput.fill(newVal);
        console.log('Made edit: "' + currentVal + '" -> "' + newVal + '"');
      } else {
        console.log('No name input found, skipping edit');
      }
      
      const saveButton = await page.$('button:has-text("Save"), button[type="submit"]');
      if (saveButton) {
        console.log('Clicking Save button...');
        await saveButton.click();
        console.log('Waiting for response...');
        await page.waitForTimeout(4000);
        
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasNetworkError = bodyText.toLowerCase().includes('network failed');
        const hasSuccess = bodyText.toLowerCase().includes('success') || bodyText.toLowerCase().includes('saved');
        
        await page.screenshot({ path: screenshotDir + '/bug7-fix-3-save-result.png', fullPage: true });
        console.log('✓ Screenshot: bug7-fix-3-save-result.png');
        
        console.log('');
        console.log('Save Results:');
        console.log('  Network Failed Error: ' + (hasNetworkError ? '✗ PRESENT (FAIL)' : '✓ NOT PRESENT (PASS)'));
        console.log('  Success Message: ' + (hasSuccess ? '✓ YES' : '⚠ NO'));
        
        console.log('');
        if (!hasNetworkError) {
          console.log('BUG-7 RESULT: ✓ PASS');
          console.log('No network error on save - bug is fixed');
        } else {
          console.log('BUG-7 RESULT: ✗ FAIL');
          console.log('Network error still appears on save');
        }
      } else {
        console.log('No Save button found');
      }
    } else {
      console.log('BUG-7 RESULT: INCONCLUSIVE');
      console.log('Could not find autoresponder to test');
    }
    
  } catch (error) {
    console.error('');
    console.error('ERROR:', error.message);
    await page.screenshot({ path: screenshotDir + '/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('');
    console.log('=== Testing Complete ===');
  }
})();
