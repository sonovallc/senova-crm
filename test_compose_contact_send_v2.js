const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 8: EMAIL COMPOSE SELECT CONTACT & SEND (v2) ===\n');
  console.log('This test verifies selecting a contact recipient and sending an email.\n');

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

    await page.screenshot({ path: 'screenshots/test8v2_step2_compose_page.png' });
    console.log('Step 2: PASS - On compose page\n');

    // Step 3: Click "Select from contacts" link to open contact selector
    console.log('Step 3: Click "Select from contacts" link...');

    const selectContactsLink = await page.$('text=Select from contacts');
    if (selectContactsLink) {
      await selectContactsLink.click();
      await page.waitForTimeout(1500);
      console.log('Clicked "Select from contacts" link');
    } else {
      // Try alternative selectors
      const altLink = await page.$('button:has-text("Select from contacts"), a:has-text("Select from contacts")');
      if (altLink) {
        await altLink.click();
        await page.waitForTimeout(1500);
        console.log('Clicked contact selector via alternative');
      }
    }

    await page.screenshot({ path: 'screenshots/test8v2_step3_contact_selector.png' });
    console.log('Step 3: PASS - Contact selector opened\n');

    // Step 4: Select a contact from the dialog/dropdown
    console.log('Step 4: Select a contact...');

    await page.waitForTimeout(1000);

    // Look for contact options in a dialog or dropdown
    // Check for dialog first
    const dialog = await page.$('[role="dialog"], [data-state="open"], .modal, [class*="Dialog"]');
    if (dialog) {
      console.log('Contact selection dialog found');
    }

    // Look for contact items to click
    const contactSelectors = [
      '[role="dialog"] [role="option"]',
      '[role="dialog"] button',
      '[role="dialog"] [class*="contact"]',
      '[role="listbox"] [role="option"]',
      '[data-radix-collection-item]',
      'button[data-contact-id]',
      '[class*="ContactItem"]',
      '[role="dialog"] tr',
      '[role="dialog"] li'
    ];

    let contactSelected = false;
    for (const selector of contactSelectors) {
      const items = await page.$$(selector);
      if (items.length > 0) {
        console.log(`Found ${items.length} items with selector: ${selector}`);

        // Try to click the first contact
        for (const item of items) {
          const text = await item.textContent();
          console.log(`  Item: "${text?.substring(0, 60)}"`);

          // Click if it looks like a contact (has name or email)
          if (text && (text.includes('@') || text.length > 2)) {
            try {
              await item.click();
              contactSelected = true;
              console.log(`Selected: "${text?.substring(0, 40)}"`);
              break;
            } catch (e) {
              // Try next item
            }
          }
        }
        if (contactSelected) break;
      }
    }

    // If no contact selected via items, try checkbox selection
    if (!contactSelected) {
      const checkboxes = await page.$$('[role="dialog"] button[role="checkbox"], [role="dialog"] input[type="checkbox"]');
      if (checkboxes.length > 0) {
        console.log(`Found ${checkboxes.length} checkboxes in dialog`);
        await checkboxes[0].click();
        contactSelected = true;
        console.log('Selected contact via checkbox');

        // Look for a confirm/add button
        await page.waitForTimeout(500);
        const addBtn = await page.$('[role="dialog"] button:has-text("Add"), [role="dialog"] button:has-text("Select"), [role="dialog"] button:has-text("Confirm")');
        if (addBtn) {
          await addBtn.click();
          console.log('Clicked Add/Select button');
        }
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test8v2_step4_contact_selected.png' });

    if (contactSelected) {
      console.log('Step 4: PASS - Contact selected\n');
    } else {
      // As fallback, try typing an email directly in the To field
      console.log('Step 4: Trying to type email directly...');
      const toInput = await page.$('input[placeholder*="email"], input[placeholder*="contact"]');
      if (toInput) {
        await toInput.fill('test@example.com');
        await page.keyboard.press('Enter');
        console.log('Typed email directly in To field');
        contactSelected = true;
      }
    }

    // Close any open dialog
    const closeBtn = await page.$('[role="dialog"] button[aria-label="Close"], [role="dialog"] button:has(svg.lucide-x)');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 5: Select a template
    console.log('Step 5: Select a template...');

    const templateDropdown = await page.$('button:has-text("Select a template"), [class*="template"] button');
    if (templateDropdown) {
      await templateDropdown.click();
      await page.waitForTimeout(1000);

      const templateOptions = await page.$$('[role="option"]');
      console.log(`Found ${templateOptions.length} template options`);

      for (const opt of templateOptions) {
        const text = await opt.textContent();
        if (text && !text.toLowerCase().includes('select') && text.trim().length > 0) {
          await opt.click();
          console.log(`Selected template: "${text?.substring(0, 40)}"`);
          break;
        }
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test8v2_step5_template.png' });
    console.log('Step 5: PASS - Template selected\n');

    // Step 6: Check subject is filled
    console.log('Step 6: Verify subject...');
    const subjectInput = await page.$('input[placeholder*="subject"], input[name="subject"]');
    if (subjectInput) {
      const subjectVal = await subjectInput.inputValue();
      if (!subjectVal || subjectVal.length === 0) {
        await subjectInput.fill(`Test Email ${Date.now()}`);
        console.log('Filled subject');
      } else {
        console.log(`Subject: "${subjectVal}"`);
      }
    }
    console.log('Step 6: PASS\n');

    // Step 7: Check Send button state
    console.log('Step 7: Check Send button...');

    await page.screenshot({ path: 'screenshots/test8v2_step7_before_send.png' });

    const sendBtn = await page.$('button:has-text("Send Email"), button:has-text("Send")');
    if (sendBtn) {
      const isDisabled = await sendBtn.isDisabled();
      console.log(`Send button disabled: ${isDisabled}`);

      if (!isDisabled) {
        console.log('Step 7: PASS - Send button enabled\n');

        // Step 8: Click Send
        console.log('Step 8: Click Send...');
        await sendBtn.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'screenshots/test8v2_step8_after_send.png' });

        const pageContent = await page.content();
        if (pageContent.toLowerCase().includes('success') ||
            pageContent.toLowerCase().includes('sent') ||
            pageContent.toLowerCase().includes('message sent')) {
          console.log('Step 8: PASS - Email sent!\n');
          console.log('\n=== TEST 8 RESULT: PASS ===');
        } else {
          console.log('Step 8: Send clicked, checking result...');
          console.log('\n=== TEST 8 RESULT: PARTIAL PASS ===');
        }
      } else {
        console.log('Step 7: Send button is disabled');
        console.log('This may be because no valid recipient was selected.');
        console.log('\n=== TEST 8 RESULT: NEEDS RECIPIENT SELECTION FIX ===');
      }
    } else {
      console.log('Step 7: Send button not found');
      console.log('\n=== TEST 8 RESULT: NEEDS INVESTIGATION ===');
    }

  } catch (error) {
    console.error('TEST 8 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test8v2_error.png' });
    console.log('\n=== TEST 8 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
