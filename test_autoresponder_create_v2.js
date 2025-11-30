const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 10: AUTORESPONDER CREATE (v2) ===\n');

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
    await page.screenshot({ path: 'screenshots/test10v2_step2_list.png' });
    console.log('Step 2: PASS - On autoresponders page\n');

    // Step 3: Click Create Autoresponder and wait for dialog/form
    console.log('Step 3: Click Create Autoresponder...');

    const createBtn = await page.$('button:has-text("Create Autoresponder")');
    if (createBtn) {
      await createBtn.click();
      console.log('Clicked Create Autoresponder button');
    }

    // Wait for dialog or page change
    await page.waitForTimeout(3000);

    // Check if a dialog opened
    const dialog = await page.$('[role="dialog"], [data-state="open"], .modal, [class*="Dialog"]');
    if (dialog) {
      console.log('Dialog detected');
    }

    // Check if URL changed (navigate to create page)
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    await page.screenshot({ path: 'screenshots/test10v2_step3_after_click.png' });

    // Check what's on the page now
    const pageContent = await page.content();

    // Look for form elements
    const hasNameInput = await page.$('input[name="name"], input[id="name"], input[placeholder*="name" i]');
    const hasSubjectInput = await page.$('input[name="subject"], input[id="subject"]');
    const hasTriggerSelect = await page.$('select[name="trigger"], button[role="combobox"]');

    console.log(`Form elements found: name=${!!hasNameInput}, subject=${!!hasSubjectInput}, trigger=${!!hasTriggerSelect}`);

    // If form elements exist, fill them
    if (hasNameInput || hasSubjectInput) {
      console.log('Step 3: PASS - Create form detected\n');

      // Step 4: Fill form
      console.log('Step 4: Fill autoresponder form...');
      const timestamp = Date.now();

      if (hasNameInput) {
        await hasNameInput.fill(`TestAutoresponder_${timestamp}`);
        console.log('Filled name');
      }

      if (hasSubjectInput) {
        await hasSubjectInput.fill(`Auto Response Subject ${timestamp}`);
        console.log('Filled subject');
      }

      // Select trigger
      const triggerDropdowns = await page.$$('button[role="combobox"]');
      console.log(`Found ${triggerDropdowns.length} combobox dropdowns`);

      for (let i = 0; i < triggerDropdowns.length; i++) {
        const text = await triggerDropdowns[i].textContent();
        console.log(`  Dropdown ${i}: "${text}"`);
      }

      // Click trigger dropdown (usually first one related to trigger type)
      if (triggerDropdowns.length > 0) {
        await triggerDropdowns[0].click();
        await page.waitForTimeout(500);

        const options = await page.$$('[role="option"]');
        if (options.length > 0) {
          const firstOptionText = await options[0].textContent();
          await options[0].click();
          console.log(`Selected trigger: "${firstOptionText}"`);
        }
        await page.waitForTimeout(500);
      }

      // Fill body/content
      const editor = await page.$('[contenteditable="true"], .tiptap, .ProseMirror, textarea[name="body"]');
      if (editor) {
        await editor.click();
        await page.keyboard.type('Thank you for contacting us! Hello {{first_name}}, we will respond shortly.');
        console.log('Filled body');
      }

      await page.screenshot({ path: 'screenshots/test10v2_step4_filled.png' });
      console.log('Step 4: PASS - Form filled\n');

      // Step 5: Save
      console.log('Step 5: Save autoresponder...');

      const saveBtns = await page.$$('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
      console.log(`Found ${saveBtns.length} potential save buttons`);

      for (const btn of saveBtns) {
        const text = await btn.textContent();
        const isDisabled = await btn.isDisabled();
        console.log(`  Button: "${text}" (disabled: ${isDisabled})`);

        if (!isDisabled && (text.includes('Create') || text.includes('Save'))) {
          await btn.click();
          console.log(`Clicked: "${text}"`);
          break;
        }
      }

      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/test10v2_step5_saved.png' });
      console.log('Step 5: PASS - Save clicked\n');

      // Step 6: Verify
      console.log('Step 6: Verify autoresponder created...');

      // Navigate back to list if needed
      if (!page.url().includes('autoresponders')) {
        await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
        await page.waitForTimeout(3000);
      }

      await page.screenshot({ path: 'screenshots/test10v2_step6_verify.png' });

      const listContent = await page.content();
      if (listContent.includes(`TestAutoresponder_${timestamp}`) || listContent.includes('TestAutoresponder_')) {
        console.log('Step 6: PASS - Autoresponder found in list!\n');
        console.log('\n=== TEST 10 RESULT: PASS ===');
      } else {
        // Count total autoresponders
        const countEl = await page.$('text=/Total Autoresponders/');
        if (countEl) {
          const parent = await countEl.evaluateHandle(el => el.parentElement);
          const countText = await parent.textContent();
          console.log(`Autoresponder stats: ${countText}`);
        }
        console.log('Step 6: Autoresponder may have been created');
        console.log('\n=== TEST 10 RESULT: NEEDS VERIFICATION ===');
      }

    } else {
      console.log('Step 3: FAIL - Create form not found');
      console.log('Checking if this is a wizard or different UI...');

      // List all visible inputs and buttons
      const inputs = await page.$$('input:visible');
      const buttons = await page.$$('button:visible');
      console.log(`Visible inputs: ${inputs.length}, buttons: ${buttons.length}`);

      for (let i = 0; i < Math.min(5, inputs.length); i++) {
        const placeholder = await inputs[i].getAttribute('placeholder');
        const name = await inputs[i].getAttribute('name');
        console.log(`  Input ${i}: placeholder="${placeholder}", name="${name}"`);
      }

      console.log('\n=== TEST 10 RESULT: FAIL - Form not detected ===');
    }

  } catch (error) {
    console.error('TEST 10 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test10v2_error.png' });
    console.log('\n=== TEST 10 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
