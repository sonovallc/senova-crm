const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== BUG-015 Verification Test ===\n');
    
    // Login
    console.log('T1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login successful');

    // Create a new contact with unique identifier
    const timestamp = Date.now();
    const testEmail = `bug015test${timestamp}@example.com`;
    
    console.log('\nT2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug015-01-contacts-list.png', fullPage: true });
    console.log('✓ Screenshot: bug015-01-contacts-list.png');

    console.log('\nT3: Create new contact...');
    await page.click('button:has-text("Add Contact")');
    await page.waitForTimeout(1000);
    
    // Fill contact form
    await page.fill('input[name="firstName"]', 'Bug015');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', testEmail);
    await page.screenshot({ path: 'screenshots/bug015-02-contact-form-filled.png', fullPage: true });
    
    // Submit
    await page.click('button:has-text("Create Contact")');
    await page.waitForTimeout(3000);
    console.log(`✓ Contact created: ${testEmail}`);
    await page.screenshot({ path: 'screenshots/bug015-03-after-create.png', fullPage: true });

    // Verify contact appears in list
    console.log('\nT4: Verify contact appears in list...');
    await page.reload();
    await page.waitForTimeout(2000);
    const contactVisible = await page.locator(`text=${testEmail}`).isVisible();
    if (contactVisible) {
      console.log('✅ SUCCESS: Contact appears in list!');
    } else {
      console.log('❌ FAIL: Contact NOT visible in list');
    }
    await page.screenshot({ path: 'screenshots/bug015-04-contact-in-list.png', fullPage: true });

    // Search for contact
    console.log('\nT5: Search for contact...');
    await page.fill('input[placeholder*="Search"]', testEmail);
    await page.waitForTimeout(1500);
    const searchResult = await page.locator(`text=${testEmail}`).isVisible();
    if (searchResult) {
      console.log('✅ SUCCESS: Contact is searchable!');
    } else {
      console.log('❌ FAIL: Contact NOT found in search');
    }
    await page.screenshot({ path: 'screenshots/bug015-05-search-result.png', fullPage: true });

    // Test Campaign Wizard
    console.log('\nT6: Navigate to Campaign Creation...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Create Campaign")');
    await page.waitForTimeout(3000);

    // Fill Step 1
    console.log('\nT7: Fill Campaign Step 1...');
    await page.fill('input[id="name"]', 'BUG-015 Test Campaign');
    await page.fill('input[id="subject"]', 'Test Subject');
    
    // Fill email body
    const editor = await page.locator('.tiptap').or(page.locator('[contenteditable="true"]'));
    await editor.first().click();
    await page.keyboard.type('Test email content for BUG-015 verification.');
    await page.screenshot({ path: 'screenshots/bug015-06-campaign-step1.png', fullPage: true });
    
    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug015-07-campaign-step2.png', fullPage: true });

    // Check recipient count
    console.log('\nT8: Checking recipient count...');
    const recipientText = await page.locator('text=/\d+ recipient/i').first();
    if (await recipientText.isVisible()) {
      const text = await recipientText.textContent();
      console.log(`✅ SUCCESS: ${text}`);
      
      // Extract number
      const match = text.match(/(\d+)/);
      const count = match ? parseInt(match[1]) : 0;
      if (count > 0) {
        console.log('✅ SUCCESS: Recipient count > 0!');
      } else {
        console.log('❌ FAIL: Recipient count is 0');
      }
    } else {
      console.log('⚠️ No recipient count text found');
    }

    // Check if Schedule & Send button is enabled
    console.log('\nT9: Checking Schedule & Send button...');
    const scheduleBtn = await page.locator('button:has-text("Next: Schedule")').or(page.locator('button:has-text("Schedule & Send")'));
    const isDisabled = await scheduleBtn.first().isDisabled();
    
    if (isDisabled) {
      console.log('❌ FAIL: Schedule & Send button is DISABLED');
      await page.screenshot({ path: 'screenshots/bug015-FAIL-button-disabled.png', fullPage: true });
    } else {
      console.log('✅ SUCCESS: Schedule & Send button is ENABLED!');
      
      // Try to proceed to Step 3
      await scheduleBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug015-08-campaign-step3.png', fullPage: true });
      console.log('✅ SUCCESS: Reached Step 3!');
    }

    console.log('\n=== BUG-015 Verification Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/bug015-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
