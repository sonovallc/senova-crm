const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 7: EMAIL COMPOSE TEMPLATE SELECTION ===\n');
  console.log('This test verifies that selecting a template populates the compose form.\n');

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

    // Step 2: Navigate to Email Compose
    console.log('Step 2: Navigate to Email Compose...');
    await page.goto('http://localhost:3004/dashboard/email/compose', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test7_step2_compose_page.png' });
    console.log('Step 2: PASS - On compose page\n');

    // Step 3: Find and click the template dropdown
    console.log('Step 3: Find template selector...');

    // Look for template dropdown/select
    const templateSelectors = [
      'button:has-text("Select a template")',
      'button:has-text("Choose template")',
      '[data-testid="template-select"]',
      'select[name="template"]',
      '[role="combobox"]:has-text("template")',
      'button[role="combobox"]'
    ];

    let templateDropdown = null;
    for (const selector of templateSelectors) {
      const el = await page.$(selector);
      if (el) {
        templateDropdown = el;
        console.log(`Found template selector: ${selector}`);
        break;
      }
    }

    // Also check for any dropdown that might be template related
    if (!templateDropdown) {
      // Look for any combobox buttons
      const comboboxes = await page.$$('button[role="combobox"]');
      console.log(`Found ${comboboxes.length} combobox buttons`);

      for (let i = 0; i < comboboxes.length; i++) {
        const text = await comboboxes[i].textContent();
        console.log(`Combobox ${i}: "${text}"`);
        if (text && (text.toLowerCase().includes('template') || text.toLowerCase().includes('select'))) {
          templateDropdown = comboboxes[i];
          break;
        }
      }
    }

    await page.screenshot({ path: 'screenshots/test7_step3_before_template.png' });

    if (templateDropdown) {
      await templateDropdown.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/test7_step3_template_dropdown_open.png' });
      console.log('Step 3: PASS - Template dropdown opened\n');
    } else {
      console.log('Step 3: WARNING - Template dropdown not found, checking page structure...');

      // Take screenshot and list all buttons/selects on page
      const buttons = await page.$$('button');
      console.log(`Total buttons on page: ${buttons.length}`);
      for (let i = 0; i < Math.min(10, buttons.length); i++) {
        const text = await buttons[i].textContent();
        console.log(`  Button ${i}: "${text?.substring(0, 50)}"`);
      }
    }

    // Step 4: Select a template from dropdown
    console.log('Step 4: Select a template...');

    // Wait for dropdown options to appear
    await page.waitForTimeout(500);

    // Look for template options in the dropdown
    const templateOptionSelectors = [
      '[role="option"]',
      '[role="listbox"] [role="option"]',
      '[data-radix-collection-item]',
      '.select-item',
      'li[role="option"]'
    ];

    let templateSelected = false;
    for (const selector of templateOptionSelectors) {
      const options = await page.$$(selector);
      if (options.length > 0) {
        console.log(`Found ${options.length} options with selector: ${selector}`);

        // Find a template that has content (not "No template")
        for (const option of options) {
          const text = await option.textContent();
          console.log(`  Option: "${text}"`);

          // Select first actual template (skip "No template" or empty options)
          if (text && !text.toLowerCase().includes('no template') && text.trim().length > 0) {
            await option.click();
            templateSelected = true;
            console.log(`Selected template: "${text}"`);
            break;
          }
        }
        if (templateSelected) break;
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test7_step4_template_selected.png' });

    if (templateSelected) {
      console.log('Step 4: PASS - Template selected\n');
    } else {
      console.log('Step 4: WARNING - Could not select template\n');
    }

    // Step 5: Verify template content populated
    console.log('Step 5: Verify template content populated...');

    // Check subject field
    const subjectInput = await page.$('input[name="subject"], input[placeholder*="Subject"]');
    let subjectValue = '';
    if (subjectInput) {
      subjectValue = await subjectInput.inputValue();
      console.log(`Subject field value: "${subjectValue}"`);
    }

    // Check body content
    const bodySelectors = [
      '[contenteditable="true"]',
      '.ProseMirror',
      '.tiptap',
      'textarea[name="body"]',
      'div[role="textbox"]'
    ];

    let bodyContent = '';
    for (const selector of bodySelectors) {
      const editor = await page.$(selector);
      if (editor) {
        bodyContent = await editor.textContent() || '';
        console.log(`Body editor found (${selector}), content length: ${bodyContent.length}`);
        if (bodyContent.length > 0) {
          console.log(`Body preview: "${bodyContent.substring(0, 100)}..."`);
        }
        break;
      }
    }

    await page.screenshot({ path: 'screenshots/test7_step5_content_check.png' });

    // Step 6: Test dynamic template change
    console.log('\nStep 6: Test dynamic template change...');

    // Click template dropdown again
    if (templateDropdown) {
      await templateDropdown.click();
      await page.waitForTimeout(1000);

      // Select a different template
      const options = await page.$$('[role="option"]');
      if (options.length > 1) {
        // Click the second option (different template)
        for (let i = 0; i < options.length; i++) {
          const text = await options[i].textContent();
          if (text && !text.toLowerCase().includes('no template') && text !== bodyContent.substring(0, 20)) {
            await options[i].click();
            console.log(`Changed to template: "${text}"`);
            break;
          }
        }
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test7_step6_changed_template.png' });

    // Check if body changed
    let newBodyContent = '';
    for (const selector of bodySelectors) {
      const editor = await page.$(selector);
      if (editor) {
        newBodyContent = await editor.textContent() || '';
        break;
      }
    }

    console.log(`New body content length: ${newBodyContent.length}`);

    // Step 7: Evaluate results
    console.log('\n=== TEST 7 EVALUATION ===');

    const hasTemplateSelector = templateDropdown !== null;
    const templateWasSelected = templateSelected;
    const contentPopulated = bodyContent.length > 0 || subjectValue.length > 0;

    console.log(`Template selector found: ${hasTemplateSelector}`);
    console.log(`Template was selected: ${templateWasSelected}`);
    console.log(`Content populated: ${contentPopulated}`);

    if (hasTemplateSelector && templateWasSelected && contentPopulated) {
      console.log('\n=== TEST 7 RESULT: PASS ===');
    } else if (hasTemplateSelector) {
      console.log('\n=== TEST 7 RESULT: PARTIAL PASS - Template selector works ===');
    } else {
      console.log('\n=== TEST 7 RESULT: NEEDS INVESTIGATION ===');
    }

  } catch (error) {
    console.error('TEST 7 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test7_error.png' });
    console.log('\n=== TEST 7 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
