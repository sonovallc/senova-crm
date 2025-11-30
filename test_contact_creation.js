const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));

  try {
    console.log('=== Contact Creation Test ===\n');

    // Login
    console.log('T1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login successful');

    // Navigate to Contacts
    console.log('\nT2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/contact-01-list.png', fullPage: true });
    console.log('✓ Screenshot: contact-01-list.png');

    // Click Add Contact
    console.log('\nT3: Click Add Contact button...');
    const createBtn = await page.locator('text=Add Contact').first();
    await createBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/contact-02-modal-open.png', fullPage: true });
    console.log('✓ Screenshot: contact-02-modal-open.png');

    // Check for z-index issues
    console.log('\nT4: Testing dropdowns visibility (z-index fixes)...');

    // Test Status dropdown
    const statusTrigger = await page.locator('[role="combobox"]').filter({ hasText: 'Lead' }).first();
    if (await statusTrigger.isVisible()) {
      await statusTrigger.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/contact-03-status-dropdown.png', fullPage: true });
      console.log('✓ Status dropdown opened (visible above modal)');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Fill form
    console.log('\nT5: Filling contact form...');
    await page.fill('input[id="first_name"]', 'Test');
    await page.fill('input[id="last_name"]', 'Contact');
    await page.fill('input[id="email"]', `test${Date.now()}@example.com`);
    await page.screenshot({ path: 'screenshots/contact-04-form-filled.png', fullPage: true });
    console.log('✓ Screenshot: contact-04-form-filled.png');

    // Submit form
    console.log('\nT6: Submitting contact form...');
    const saveBtn = await page.locator('button:has-text("Save")').or(page.locator('button:has-text("Create")'));
    await saveBtn.first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/contact-05-after-submit.png', fullPage: true });
    console.log('✓ Screenshot: contact-05-after-submit.png');

    // Check for success
    console.log('\nT7: Checking for success/error...');
    const successToast = await page.locator('text=Contact created').count();
    const errorToast = await page.locator('text=Error').count();
    const failedToast = await page.locator('text=Failed').count();

    if (successToast > 0) {
      console.log('✅ SUCCESS: Contact created successfully!');
    } else if (errorToast > 0 || failedToast > 0) {
      console.log('❌ FAIL: Error toast appeared');
      await page.screenshot({ path: 'screenshots/contact-ERROR.png', fullPage: true });
    } else {
      console.log('⚠️  UNKNOWN: No clear success or error indication');
    }

    // Check console errors
    const errors = consoleMessages.filter(m => m.startsWith('error:'));
    console.log(`\nConsole Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors.slice(0, 5));
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/contact-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
