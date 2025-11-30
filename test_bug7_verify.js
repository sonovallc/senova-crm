const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== BUG-7 VERIFICATION: Multi-Step Template Selection ===\n');

    // 1. Login
    console.log('1. Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // Wait for redirect with timeout
    await page.waitForTimeout(5000);
    console.log('   Current URL:', page.url());
    console.log('   Login complete');

    // 2. Navigate to autoresponders create page
    console.log('2. Navigate to Autoresponders Create...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/bug7-1-create-page.png', fullPage: true });
    console.log('   Screenshot: bug7-1-create-page.png');

    // 3. Fill basic info
    console.log('3. Fill basic info...');
    const nameInput = page.locator('input#name').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('BUG-7 Test Autoresponder');
      console.log('   Name filled');
    }

    // 4. Scroll down to find the sequence section
    console.log('4. Scroll to sequence section...');
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    // 5. Enable multi-step sequence
    console.log('5. Enable multi-step sequence...');
    // Find the checkbox by looking for the label text
    const sequenceLabel = page.locator('label:has-text("Enable multi-step sequence")').first();
    if (await sequenceLabel.count() > 0) {
      await sequenceLabel.click();
      console.log('   Clicked sequence label');
    } else {
      // Try finding the checkbox directly
      const sequenceCheckbox = page.locator('#sequence-enabled').first();
      if (await sequenceCheckbox.count() > 0) {
        await sequenceCheckbox.click();
        console.log('   Clicked sequence checkbox');
      }
    }

    await page.waitForTimeout(1000);

    // Scroll more to see the sequence section
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/bug7-2-sequence-enabled.png', fullPage: true });
    console.log('   Screenshot: bug7-2-sequence-enabled.png');

    // 6. Click Add Sequence Step
    console.log('6. Add Sequence Step...');
    const addStepBtn = page.locator('button:has-text("Add Sequence Step")').first();
    if (await addStepBtn.count() > 0) {
      await addStepBtn.click();
      await page.waitForTimeout(1000);
      console.log('   Added sequence step');
    } else {
      console.log('   WARNING: Add Step button not found - sequence may not be enabled');

      // Debug: check what's on page
      const pageText = await page.locator('body').textContent();
      if (pageText.includes('Add Sequence')) {
        console.log('   "Add Sequence" text found on page');
      }
    }

    // Scroll to bottom to see the step
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/bug7-3-step-added.png', fullPage: true });
    console.log('   Screenshot: bug7-3-step-added.png');

    // 7. Find template dropdown in sequence step
    console.log('7. Find template dropdown in Step 1...');

    // Look for all comboboxes on the page
    const allCombos = await page.locator('button[role="combobox"]').all();
    console.log('   Total comboboxes found:', allCombos.length);

    // Find the one that says "Custom Content" or "Choose a template" (the step template dropdown)
    let stepDropdown = null;
    for (let i = 0; i < allCombos.length; i++) {
      const text = await allCombos[i].textContent();
      console.log('   Combobox', i, ':', text);
      if (text && (text.includes('Custom Content') || text.includes('Choose a template'))) {
        // Skip the first one if there are multiples - that might be the main template selector
        if (!stepDropdown || i > 0) {
          stepDropdown = allCombos[i];
        }
      }
    }

    if (stepDropdown) {
      const dropdownText = await stepDropdown.textContent();
      console.log('   Using step dropdown with text:', dropdownText);

      console.log('8. Click template dropdown...');
      await stepDropdown.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'screenshots/bug7-4-dropdown-open.png', fullPage: true });
      console.log('   Screenshot: bug7-4-dropdown-open.png');

      // Find and click on a template option (not 'Custom Content')
      const options = await page.locator('[role="option"]').all();
      console.log('   Found', options.length, 'options');

      let selectedTemplateName = null;
      for (const opt of options) {
        const optText = await opt.textContent();
        if (optText && optText.indexOf('Custom') === -1 && optText.indexOf('Loading') === -1 && optText.trim() !== '' && optText.indexOf('None') === -1) {
          selectedTemplateName = optText.trim();
          console.log('   Selecting template:', selectedTemplateName);
          await opt.click();
          break;
        }
      }

      if (!selectedTemplateName) {
        console.log('   WARNING: No templates available to select');
      }

      await page.waitForTimeout(2000); // Wait for async fetch

      await page.screenshot({ path: 'screenshots/bug7-5-template-selected.png', fullPage: true });
      console.log('   Screenshot: bug7-5-template-selected.png');

      // CRITICAL: Check if dropdown still shows selected template
      const dropdownAfter = await stepDropdown.textContent();
      console.log('\n=== CRITICAL VERIFICATION ===');
      console.log('Selected template:', selectedTemplateName);
      console.log('Dropdown text after selection:', dropdownAfter);

      if (selectedTemplateName && dropdownAfter && dropdownAfter.indexOf('Custom Content') === -1 && dropdownAfter.indexOf('Choose') === -1) {
        console.log('\n*** SUCCESS: Template selection PERSISTED! ***');
        console.log('BUG-7 STATUS: FIXED');
      } else if (!selectedTemplateName) {
        console.log('\n*** INCONCLUSIVE: No templates available to test ***');
        console.log('BUG-7 STATUS: NEEDS MANUAL VERIFICATION');
      } else {
        console.log('\n*** FAILURE: Template selection RESET ***');
        console.log('BUG-7 STATUS: STILL BROKEN');
      }

      // Also check if subject was populated
      const subjectInputs = await page.locator('input[id*="step-subject"]').all();
      if (subjectInputs.length > 0) {
        const subjectValue = await subjectInputs[0].inputValue();
        console.log('Subject field value:', subjectValue || '(empty)');
        if (subjectValue && subjectValue.trim() !== '') {
          console.log('*** Subject was populated from template - GOOD ***');
        }
      }

    } else {
      console.log('   Could not find step template dropdown');
      console.log('   This may mean the sequence step was not added');
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'screenshots/bug7-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
