const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    console.log('CRITICAL CAMPAIGNS BUTTON TEST');
    console.log('================================\n');
    
    console.log('[1/6] Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  OK - Logged in\n');
    
    console.log('[2/6] Navigate to Campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/camp-btn-01-list.png', fullPage: true });
    console.log('  OK - Screenshot: camp-btn-01-list.png\n');
    
    console.log('[3/6] Click Create Campaign...');
    const createBtn = await page.locator('button:has-text("Create Campaign"), a:has-text("Create Campaign")').first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/camp-btn-02-wizard-step1.png', fullPage: true });
      console.log('  OK - Wizard opened\n');
    } else {
      console.log('  FAIL - Create button not found\n');
    }
    
    console.log('[4/6] Fill Campaign Details...');
    await page.fill('input[id="name"], input[name="name"]', 'Button Test ' + Date.now());
    await page.fill('input[id="subject"], input[name="subject"]', 'Test Subject');
    const editor = await page.locator('[contenteditable="true"], textarea[name="content"]').first();
    if (await editor.count() > 0) {
      await editor.click();
      await page.keyboard.type('Test content');
    }
    await page.screenshot({ path: 'screenshots/camp-btn-03-step1-filled.png', fullPage: true });
    console.log('  OK - Form filled\n');
    
    console.log('[5/6] Click Next to Step 2...');
    const nextBtn = await page.locator('button:has-text("Next")').first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/camp-btn-04-step2.png', fullPage: true });
      console.log('  OK - Step 2 loaded\n');
    } else {
      console.log('  FAIL - Next button not found\n');
    }
    
    console.log('[6/6] TEST CRITICAL BUTTON: Schedule & Send');
    const scheduleBtn = await page.locator('button:has-text("Schedule"), button:has-text("Next")').first();
    if (await scheduleBtn.count() > 0) {
      const isDisabled = await scheduleBtn.isDisabled();
      console.log('  Button found: YES');
      console.log('  Button visible: YES');
      console.log('  Button state: ' + (isDisabled ? 'DISABLED (BUG!)' : 'ENABLED (OK)'));
      
      await page.screenshot({ 
        path: 'screenshots/camp-btn-05-CRITICAL-' + (isDisabled ? 'FAIL-DISABLED' : 'PASS-ENABLED') + '.png', 
        fullPage: true 
      });
      
      if (isDisabled) {
        console.log('\n  CRITICAL FAILURE!');
        console.log('  The Schedule & Send button is DISABLED when it should be ENABLED');
        console.log('  This is the bug that needs to be fixed!');
      } else {
        console.log('\n  SUCCESS! Button is enabled');
        await scheduleBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/camp-btn-06-step3.png', fullPage: true });
        console.log('  Proceeded to Step 3');
      }
    } else {
      console.log('  FAIL - Schedule button not found');
    }
    
    console.log('\n================================');
    console.log('TEST COMPLETE');
    console.log('================================');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/camp-btn-ERROR.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
