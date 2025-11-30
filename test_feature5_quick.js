const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Feature 5: Autoresponders Test ===');

    // T1: Login
    console.log('\nT1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Login URL:', page.url());

    // T2: Navigate to Autoresponders List
    console.log('\nT2: Navigate to autoresponders list...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/f5-01-list.png', fullPage: true });
    console.log('Screenshot: f5-01-list.png');

    // T3: Click Create Autoresponder
    console.log('\nT3: Click Create Autoresponder button...');
    const createBtn = await page.locator('text=Create Autoresponder').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/f5-02-create-page.png', fullPage: true });
      console.log('Screenshot: f5-02-create-page.png');
      console.log('Create page URL:', page.url());
    } else {
      console.log('Create button not found');
    }

    // T4: Check for placeholder text (should NOT exist)
    console.log('\nT4: Checking for placeholder stub text...');
    const stubText = await page.locator('text=This page will contain').count();
    if (stubText > 0) {
      console.log('❌ FAIL: Placeholder stub text still exists!');
    } else {
      console.log('✓ PASS: No placeholder stub text found');
    }

    // T5: Verify form fields exist
    console.log('\nT5: Verifying form fields...');
    const nameInput = await page.locator('input[placeholder*="name" i]').count();
    const saveButton = await page.locator('text=Save').count();
    console.log(`Name inputs found: ${nameInput}`);
    console.log(`Save buttons found: ${saveButton}`);

    if (nameInput > 0 && saveButton > 0) {
      console.log('✓ PASS: Form fields present');
    } else {
      console.log('❌ FAIL: Form fields missing');
    }

    // T6: Fill basic form
    console.log('\nT6: Attempting to fill form...');
    await page.screenshot({ path: 'screenshots/f5-03-form-filled.png', fullPage: true });
    console.log('Screenshot: f5-03-form-filled.png');

    // Get console errors
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    console.log(`\nConsole errors: ${consoleMessages.length}`);
    if (consoleMessages.length > 0) {
      console.log('Errors:', consoleMessages.slice(0, 5));
    }

    console.log('\n=== Test Complete ===');
    console.log('Screenshots saved to screenshots/');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/f5-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
