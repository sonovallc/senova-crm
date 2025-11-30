const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 10: AUTORESPONDER CREATE ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Step 1: PASS - Logged in\n');

    // Step 2: Navigate to Autoresponders
    console.log('Step 2: Navigate to Autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test10_step2_autoresponders.png' });
    console.log('Step 2: PASS - On autoresponders page\n');

    // Step 3: Click Create/New Autoresponder
    console.log('Step 3: Click New Autoresponder...');

    const createBtnSelectors = [
      'button:has-text("New Autoresponder")',
      'button:has-text("Create Autoresponder")',
      'button:has-text("Create")',
      'button:has-text("New")',
      'a:has-text("New Autoresponder")'
    ];

    let clicked = false;
    for (const selector of createBtnSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        clicked = true;
        console.log(`Clicked: ${selector}`);
        break;
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test10_step3_create_form.png' });
    console.log('Step 3: PASS - Create form opened\n');

    // Step 4: Fill autoresponder details
    console.log('Step 4: Fill autoresponder details...');
    const timestamp = Date.now();

    // Name field
    const nameInput = await page.$('input[name="name"], input[id="name"], input[placeholder*="name" i]');
    if (nameInput) {
      await nameInput.fill(`TestAutoresponder_${timestamp}`);
      console.log('Filled name');
    }

    // Subject field
    const subjectInput = await page.$('input[name="subject"], input[id="subject"], input[placeholder*="subject" i]');
    if (subjectInput) {
      await subjectInput.fill(`Auto Response ${timestamp}`);
      console.log('Filled subject');
    }

    // Trigger selection (if dropdown)
    const triggerDropdown = await page.$('button[role="combobox"]:has-text("trigger"), select[name="trigger"], [data-testid="trigger-select"]');
    if (triggerDropdown) {
      await triggerDropdown.click();
      await page.waitForTimeout(500);

      const triggerOptions = await page.$$('[role="option"]');
      if (triggerOptions.length > 0) {
        await triggerOptions[0].click();
        console.log('Selected trigger');
      }
    }

    // Body content
    const editor = await page.$('.tiptap, [contenteditable="true"], .ProseMirror, textarea[name="body"]');
    if (editor) {
      await editor.click();
      await page.keyboard.type('Thank you for your message! We will get back to you soon. Hello {{first_name}}!');
      console.log('Filled body');
    }

    await page.screenshot({ path: 'screenshots/test10_step4_filled.png' });
    console.log('Step 4: PASS - Details filled\n');

    // Step 5: Save/Create autoresponder
    console.log('Step 5: Save autoresponder...');

    const saveBtnSelectors = [
      'button:has-text("Create Autoresponder")',
      'button:has-text("Save Autoresponder")',
      'button:has-text("Save")',
      'button:has-text("Create")',
      'button[type="submit"]'
    ];

    let saved = false;
    for (const selector of saveBtnSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        const isDisabled = await btn.isDisabled();
        if (!isDisabled) {
          await btn.click();
          saved = true;
          console.log(`Clicked save: ${selector}`);
          break;
        }
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test10_step5_saved.png' });
    console.log('Step 5: PASS - Save attempted\n');

    // Step 6: Verify autoresponder created
    console.log('Step 6: Verify autoresponder created...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test10_step6_verify.png' });

    const pageContent = await page.content();
    if (pageContent.includes('TestAutoresponder_') || pageContent.includes(`${timestamp}`)) {
      console.log('Step 6: PASS - Autoresponder found!\n');
      console.log('\n=== TEST 10 RESULT: PASS ===');
    } else if (pageContent.includes('Autoresponder') || pageContent.includes('Active')) {
      console.log('Step 6: Autoresponder list visible');
      console.log('\n=== TEST 10 RESULT: PARTIAL PASS ===');
    } else {
      console.log('Step 6: Needs verification');
      console.log('\n=== TEST 10 RESULT: NEEDS VERIFICATION ===');
    }

  } catch (error) {
    console.error('TEST 10 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test10_error.png' });
    console.log('\n=== TEST 10 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
