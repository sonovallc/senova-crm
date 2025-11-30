const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Campaign Wizard Test ===\n');

    // Login
    console.log('T1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login successful');

    // Navigate to Campaigns
    console.log('\nT2: Navigate to Campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/campaign-w-01-list.png', fullPage: true });
    console.log('✓ Screenshot: campaign-w-01-list.png');

    // Click Create Campaign
    console.log('\nT3: Click Create Campaign...');
    const createBtn = await page.locator('button:has-text("Create Campaign")').first();
    await createBtn.click();
    await page.waitForTimeout(4000);  // Wait longer for navigation
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'screenshots/campaign-w-02-step1.png', fullPage: true });
    console.log('✓ Screenshot: campaign-w-02-step1.png');

    // Fill Step 1
    console.log('\nT4: Fill Step 1 (Campaign Details)...');
    // Try different selectors for campaign name
    await page.fill('input[id="name"]', 'Test Campaign ' + Date.now()).catch(() =>
      page.fill('input[placeholder*="name" i]', 'Test Campaign ' + Date.now())
    );
    // Try different selectors for subject
    await page.fill('input[id="subject"]', 'Test Subject').catch(() =>
      page.fill('input[placeholder*="subject" i]', 'Test Subject')
    );

    // Fill email body - REQUIRED for Next button
    console.log('Filling email body...');
    const editor = await page.locator('.tiptap').or(page.locator('[contenteditable="true"]'));
    await editor.first().click();
    await page.keyboard.type('This is test email content for testing campaign creation.');
    console.log('✓ Email body filled');

    await page.screenshot({ path: 'screenshots/campaign-w-03-step1-filled.png', fullPage: true });
    console.log('✓ Screenshot: campaign-w-03-step1-filled.png');

    // Click Next
    console.log('\nT5: Click Next to Step 2...');
    const nextBtn = await page.locator('button:has-text("Next")').first();
    await nextBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/campaign-w-04-step2.png', fullPage: true });
    console.log('✓ Screenshot: campaign-w-04-step2.png');

    // Check recipient count
    console.log('\nT6: Checking recipient count...');
    const recipientText = await page.locator('text=/\\d+ recipients/i').first();
    if (await recipientText.isVisible()) {
      const text = await recipientText.textContent();
      console.log(`✓ Found: ${text}`);
    } else {
      console.log('⚠️  No recipient count found');
    }

    // Check if "Next: Schedule & Send" button is enabled
    console.log('\nT7: Checking if "Next: Schedule & Send" button is enabled...');
    const scheduleBtn = await page.locator('button:has-text("Next: Schedule")').or(page.locator('button:has-text("Schedule & Send")'));
    const isDisabled = await scheduleBtn.first().isDisabled();
    console.log(`Button disabled: ${isDisabled}`);

    if (isDisabled) {
      console.log('❌ FAIL: Schedule & Send button is GRAYED OUT (disabled)');
      await page.screenshot({ path: 'screenshots/campaign-w-BUTTON-DISABLED.png', fullPage: true });
    } else {
      console.log('✅ SUCCESS: Schedule & Send button is ENABLED');
      await scheduleBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/campaign-w-05-step3.png', fullPage: true });
      console.log('✓ Screenshot: campaign-w-05-step3.png - Reached Step 3');
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/campaign-w-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
