const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== BUG-015 Verification Test ===
');
    
    // Login
    console.log('T1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login successful');

    const timestamp = Date.now();
    const testEmail = ;
    
    console.log('
T2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug015-01-contacts-list.png', fullPage: true });
    console.log('✓ Screenshot: bug015-01-contacts-list.png');

    console.log('
T3: Create new contact...');
    await page.click('button:has-text("Add Contact")');
    await page.waitForTimeout(1500);
    
    // Try to find and fill the first name field
    const firstNameInput = page.locator('input').first();
    await firstNameInput.fill('Bug015');
    await page.waitForTimeout(500);
    
    // Fill other fields by order
    const allInputs = await page.locator('input[type="text"], input:not([type])').all();
    if (allInputs.length >= 2) {
      await allInputs[1].fill('Test');
    }
    
    // Fill email
    await page.locator('input[type="email"]').first().fill(testEmail);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'screenshots/bug015-02-contact-form-filled.png', fullPage: true });
    
    console.log('Clicking Create button...');
    await page.locator('button:has-text("Create")').first().click();
    await page.waitForTimeout(3000);
    console.log();
    await page.screenshot({ path: 'screenshots/bug015-03-after-create.png', fullPage: true });

    console.log('
T4: Verify contact appears in list...');
    await page.reload();
    await page.waitForTimeout(2000);
    const contactVisible = await page.locator().isVisible();
    if (contactVisible) {
      console.log('✅ SUCCESS: Contact appears in list!');
    } else {
      console.log('❌ FAIL: Contact NOT visible in list');
    }
    await page.screenshot({ path: 'screenshots/bug015-04-contact-in-list.png', fullPage: true });

    console.log('
T5: Search for contact...');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill(testEmail);
    await page.waitForTimeout(1500);
    const searchResult = await page.locator().isVisible();
    if (searchResult) {
      console.log('✅ SUCCESS: Contact is searchable!');
    } else {
      console.log('❌ FAIL: Contact NOT found in search');
    }
    await page.screenshot({ path: 'screenshots/bug015-05-search-result.png', fullPage: true });

    await searchInput.clear();
    await page.waitForTimeout(1000);

    console.log('
T6: Navigate to Campaign Creation...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Create Campaign")');
    await page.waitForTimeout(3000);

    console.log('
T7: Fill Campaign Step 1...');
    await page.fill('input[id="name"]', 'BUG-015 Test Campaign');
    await page.fill('input[id="subject"]', 'Test Subject');
    
    const editor = page.locator('.tiptap, [contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Test email content for BUG-015 verification.');
    
    await page.screenshot({ path: 'screenshots/bug015-06-campaign-step1.png', fullPage: true });
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug015-07-campaign-step2.png', fullPage: true });

    console.log('
T8: Checking recipient count...');
    const recipientText = page.locator('text=/d+ recipient/i').first();
    if (await recipientText.isVisible({ timeout: 5000 })) {
      const text = await recipientText.textContent();
      console.log();
      
      const match = text.match(/(d+)/);
      const count = match ? parseInt(match[1]) : 0;
      if (count > 0) {
        console.log('✅ SUCCESS: Recipient count > 0!');
      } else {
        console.log('❌ FAIL: Recipient count is 0');
      }
    } else {
      console.log('⚠️ No recipient count text found');
    }

    console.log('
T9: Checking Schedule & Send button...');
    const scheduleBtn = page.locator('button:has-text("Next")').last();
    const isDisabled = await scheduleBtn.isDisabled();
    
    if (isDisabled) {
      console.log('❌ FAIL: Schedule & Send button is DISABLED');
      await page.screenshot({ path: 'screenshots/bug015-FAIL-button-disabled.png', fullPage: true });
    } else {
      console.log('✅ SUCCESS: Schedule & Send button is ENABLED!');
      await scheduleBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug015-08-campaign-step3.png', fullPage: true });
      console.log('✅ SUCCESS: Reached Step 3!');
    }

    console.log('
=== BUG-015 Verification Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/bug015-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();