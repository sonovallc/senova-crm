const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';

  try {
    console.log('=== LOGGING IN ===');
    await page.goto('http://localhost:3004');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('Current URL: ' + url);
    
    if (url.includes('/login') || url.includes('localhost:3004') && !url.includes('/dashboard')) {
      console.log('On login page, filling credentials...');
      
      await page.waitForSelector('input[type="email"]', { state: 'visible' });
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.waitForTimeout(500);
      
      await page.waitForSelector('input[type="password"]', { state: 'visible' });
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.waitForTimeout(500);
      
      await page.click('button[type="submit"]');
      console.log('Submitted login, waiting for dashboard...');
      await page.waitForTimeout(5000);
    }
    
    console.log('');
    console.log('=== BUG-4: Campaign Cancel/Delete Workflow Testing ===');
    console.log('1. Navigate to campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '/bug4-fix-1-campaigns.png', fullPage: true });
    console.log('✓ Screenshot: bug4-fix-1-campaigns.png');
    
    const pageHtml = await page.content();
    console.log('Page contains "campaign": ' + pageHtml.toLowerCase().includes('campaign'));
    
    console.log('2. Looking for ALL button elements...');
    const allButtons = await page.$$('button');
    console.log('   Total buttons on page: ' + allButtons.length);
    
    for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
      const ariaLabel = await allButtons[i].getAttribute('aria-label');
      const text = await allButtons[i].textContent();
      if (ariaLabel || text) {
        console.log('   Button ' + i + ': aria-label="' + (ariaLabel || 'none') + '", text="' + (text || '').trim().substring(0, 30) + '"');
      }
    }
    
    console.log('3. Try clicking three-dot menu if found...');
    const menuButton = await page.$('button[aria-label*="menu" i], button[aria-label*="options" i], button:has-text("⋮")');
    
    if (menuButton) {
      console.log('Found menu button, clicking...');
      await menuButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + '/bug4-fix-2-menu-open.png', fullPage: true });
      console.log('✓ Screenshot: bug4-fix-2-menu-open.png');
      
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasDelete = bodyText.includes('Delete');
      const hasCancelCampaign = bodyText.includes('Cancel Campaign');
      const hasClearRecipients = bodyText.includes('Clear Recipients');
      
      console.log('');
      console.log('Menu options:');
      console.log('   Delete: ' + (hasDelete ? 'YES ✓' : 'NO'));
      console.log('   Cancel Campaign: ' + (hasCancelCampaign ? 'YES ✓' : 'NO'));
      console.log('   Clear Recipients: ' + (hasClearRecipients ? 'YES ✓' : 'NO'));
      
      await page.screenshot({ path: screenshotDir + '/bug4-fix-3-result.png', fullPage: true });
      console.log('✓ Screenshot: bug4-fix-3-result.png');
      
      if (hasDelete || hasCancelCampaign || hasClearRecipients) {
        console.log('');
        console.log('BUG-4 RESULT: PASS ✓');
      } else {
        console.log('');
        console.log('BUG-4 RESULT: FAIL ✗');
      }
    } else {
      console.log('No menu button found - taking screenshot anyway');
      await page.screenshot({ path: screenshotDir + '/bug4-fix-2-menu-open.png', fullPage: true });
      console.log('BUG-4 RESULT: INCONCLUSIVE - No menu button found');
    }
    
    console.log('');
    console.log('=== BUG-7: Autoresponder Edit Save Testing ===');
    console.log('1. Navigate to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: screenshotDir + '/bug7-fix-1-list.png', fullPage: true });
    console.log('✓ Screenshot: bug7-fix-1-list.png');
    
    console.log('2. Looking for edit buttons or links...');
    const editLinks = await page.$$('a:has-text("Edit"), button:has-text("Edit")');
    console.log('   Found ' + editLinks.length + ' edit elements');
    
    if (editLinks.length > 0) {
      console.log('3. Clicking first edit element...');
      await editLinks[0].click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: screenshotDir + '/bug7-fix-2-edit.png', fullPage: true });
      console.log('✓ Screenshot: bug7-fix-2-edit.png');
      
      const nameInput = await page.$('input[name="name"], input[name="title"]');
      if (nameInput) {
        const val = await nameInput.inputValue();
        await nameInput.fill(val + ' [TEST]');
        console.log('4. Edited name field');
      }
      
      const saveBtn = await page.$('button:has-text("Save"), button[type="submit"]');
      if (saveBtn) {
        console.log('5. Clicking Save...');
        await saveBtn.click();
        await page.waitForTimeout(4000);
        
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasError = bodyText.toLowerCase().includes('network failed');
        
        await page.screenshot({ path: screenshotDir + '/bug7-fix-3-save-result.png', fullPage: true });
        console.log('✓ Screenshot: bug7-fix-3-save-result.png');
        
        console.log('');
        console.log('Network Failed Error: ' + (hasError ? 'PRESENT ✗ (FAIL)' : 'NOT PRESENT ✓ (PASS)'));
        
        if (!hasError) {
          console.log('BUG-7 RESULT: PASS ✓');
        } else {
          console.log('BUG-7 RESULT: FAIL ✗');
        }
      }
    } else {
      console.log('BUG-7: No autoresponders found to edit');
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
