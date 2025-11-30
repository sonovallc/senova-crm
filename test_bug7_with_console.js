const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console logs
  page.on('console', msg => {
    if (msg.text().includes('BUG7 DEBUG')) {
      console.log('BROWSER CONSOLE:', msg.text());
    }
  });

  try {
    console.log('=== BUG-7 VERIFICATION WITH CONSOLE LOGGING ===\n');

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

    // 2. Navigate to autoresponders create page - force hard reload
    console.log('2. Navigate to Autoresponders Create (with hard reload)...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create', { timeout: 90000 });
    await page.waitForTimeout(1000);
    // Force hard reload to ensure latest code
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

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
    const sequenceLabel = page.locator('label:has-text("Enable multi-step sequence")').first();
    if (await sequenceLabel.count() > 0) {
      await sequenceLabel.click();
      console.log('   Clicked sequence label');
    } else {
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

    // 6. Click Add Sequence Step
    console.log('6. Add Sequence Step...');
    const addStepBtn = page.locator('button:has-text("Add Sequence Step")').first();
    if (await addStepBtn.count() > 0) {
      await addStepBtn.click();
      await page.waitForTimeout(1000);
      console.log('   Added sequence step');
    }

    // Scroll to bottom to see the step
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // 7. Find template dropdown in sequence step
    console.log('7. Find template dropdown in Step 1...');

    // Look for the template dropdown by id
    const stepTemplateDropdown = page.locator('button#step-template-0').first();
    const stepTemplateCount = await stepTemplateDropdown.count();
    console.log('   step-template-0 found:', stepTemplateCount > 0);

    if (stepTemplateCount === 0) {
      // Try all comboboxes
      const allCombos = await page.locator('button[role="combobox"]').all();
      console.log('   Total comboboxes found:', allCombos.length);
      for (let i = 0; i < allCombos.length; i++) {
        const text = await allCombos[i].textContent();
        console.log('   Combobox', i, ':', text);
      }
    }

    // Use step-template-0 id
    let stepDropdown = page.locator('#step-template-0').first();
    if (await stepDropdown.count() === 0) {
      // Fallback to 4th combobox (Custom Content)
      stepDropdown = page.locator('button[role="combobox"]').nth(3);
    }

    const dropdownTextBefore = await stepDropdown.textContent();
    console.log('   Dropdown text before:', dropdownTextBefore);

    console.log('8. Click template dropdown...');
    await stepDropdown.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/bug7-console-1-dropdown-open.png', fullPage: true });
    console.log('   Screenshot: bug7-console-1-dropdown-open.png');

    // Find and click on a template option (not 'Custom Content')
    const options = await page.locator('[role="option"]').all();
    console.log('   Found', options.length, 'options');

    let selectedTemplateName = null;
    for (const opt of options) {
      const optText = await opt.textContent();
      if (optText && optText.indexOf('Custom') === -1 && optText.indexOf('Loading') === -1 && optText.trim() !== '' && optText.indexOf('None') === -1) {
        selectedTemplateName = optText.trim();
        console.log('   About to select template:', selectedTemplateName);
        await opt.click();
        console.log('   Template option clicked');
        break;
      }
    }

    // Wait for the console log to appear and state to update
    console.log('9. Waiting for state update...');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/bug7-console-2-after-selection.png', fullPage: true });
    console.log('   Screenshot: bug7-console-2-after-selection.png');

    // Check the dropdown text after selection
    const dropdownTextAfter = await stepDropdown.textContent();
    console.log('\n=== CRITICAL VERIFICATION ===');
    console.log('Selected template:', selectedTemplateName);
    console.log('Dropdown text BEFORE:', dropdownTextBefore);
    console.log('Dropdown text AFTER:', dropdownTextAfter);

    // Check subject field
    const subjectInput = page.locator('input#step-subject-0').first();
    let subjectValue = '';
    if (await subjectInput.count() > 0) {
      subjectValue = await subjectInput.inputValue();
    }
    console.log('Subject field value:', subjectValue || '(empty)');

    if (selectedTemplateName && dropdownTextAfter && !dropdownTextAfter.includes('Custom Content')) {
      console.log('\n*** SUCCESS: Template selection PERSISTED! ***');
      console.log('BUG-7 STATUS: FIXED');
    } else if (!selectedTemplateName) {
      console.log('\n*** INCONCLUSIVE: No templates available to test ***');
      console.log('BUG-7 STATUS: NEEDS MANUAL VERIFICATION');
    } else {
      console.log('\n*** FAILURE: Template selection RESET ***');
      console.log('BUG-7 STATUS: STILL BROKEN');
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'screenshots/bug7-console-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
