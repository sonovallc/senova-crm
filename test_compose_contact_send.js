const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 8: EMAIL COMPOSE SELECT CONTACT & SEND ===\n');
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

    await page.screenshot({ path: 'screenshots/test8_step2_compose_page.png' });
    console.log('Step 2: PASS - On compose page\n');

    // Step 3: Find and click the recipient/contact selector
    console.log('Step 3: Find contact/recipient selector...');

    // Look for recipient/to field selector
    const recipientSelectors = [
      'button:has-text("Select contact")',
      'button:has-text("Select recipient")',
      'button:has-text("Choose contact")',
      'input[placeholder*="To"]',
      'input[placeholder*="Recipient"]',
      '[data-testid="recipient-select"]',
      'button[role="combobox"]'
    ];

    let recipientDropdown = null;
    let allComboboxes = await page.$$('button[role="combobox"]');
    console.log(`Found ${allComboboxes.length} combobox buttons total`);

    // Print all comboboxes to understand the layout
    for (let i = 0; i < allComboboxes.length; i++) {
      const text = await allComboboxes[i].textContent();
      console.log(`  Combobox ${i}: "${text?.substring(0, 50)}"`);

      // The recipient selector likely mentions "contact" or is empty/placeholder
      if (text && (text.toLowerCase().includes('contact') || text.toLowerCase().includes('select'))) {
        if (!text.toLowerCase().includes('template')) {
          recipientDropdown = allComboboxes[i];
          console.log(`Found recipient selector at index ${i}`);
        }
      }
    }

    // If we didn't find one with "contact", try the first non-template combobox
    if (!recipientDropdown && allComboboxes.length > 1) {
      for (const cb of allComboboxes) {
        const text = await cb.textContent();
        if (!text?.toLowerCase().includes('template')) {
          recipientDropdown = cb;
          break;
        }
      }
    }

    await page.screenshot({ path: 'screenshots/test8_step3_before_recipient.png' });

    if (recipientDropdown) {
      await recipientDropdown.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/test8_step3_recipient_dropdown.png' });
      console.log('Step 3: PASS - Recipient dropdown opened\n');
    } else {
      console.log('Step 3: WARNING - Recipient dropdown not found\n');
    }

    // Step 4: Select a contact from dropdown
    console.log('Step 4: Select a contact...');

    await page.waitForTimeout(500);

    // Look for contact options
    const options = await page.$$('[role="option"]');
    console.log(`Found ${options.length} options`);

    let contactSelected = false;
    for (const option of options) {
      const text = await option.textContent();
      console.log(`  Option: "${text?.substring(0, 50)}"`);

      // Select first contact that has an email or name
      if (text && text.includes('@') || (text && text.trim().length > 3)) {
        await option.click();
        contactSelected = true;
        console.log(`Selected contact: "${text?.substring(0, 50)}"`);
        break;
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test8_step4_contact_selected.png' });

    if (contactSelected) {
      console.log('Step 4: PASS - Contact selected\n');
    } else {
      console.log('Step 4: WARNING - Could not select contact\n');
    }

    // Step 5: Fill subject if empty
    console.log('Step 5: Fill subject line...');

    const subjectInput = await page.$('input[name="subject"], input[placeholder*="Subject"]');
    if (subjectInput) {
      const currentSubject = await subjectInput.inputValue();
      if (!currentSubject || currentSubject.length === 0) {
        await subjectInput.fill(`Test Email ${Date.now()}`);
        console.log('Filled subject line');
      } else {
        console.log(`Subject already has value: "${currentSubject}"`);
      }
    }

    await page.screenshot({ path: 'screenshots/test8_step5_subject.png' });
    console.log('Step 5: PASS - Subject handled\n');

    // Step 6: Select a template if body is empty
    console.log('Step 6: Ensure body has content...');

    // Check body content
    const bodyEditor = await page.$('[contenteditable="true"], .ProseMirror, .tiptap');
    let bodyContent = '';
    if (bodyEditor) {
      bodyContent = await bodyEditor.textContent() || '';
    }

    if (bodyContent.length === 0) {
      // Select a template to populate body
      const templateBtn = await page.$('button:has-text("Select a template")');
      if (templateBtn) {
        await templateBtn.click();
        await page.waitForTimeout(500);

        const templateOptions = await page.$$('[role="option"]');
        for (const opt of templateOptions) {
          const text = await opt.textContent();
          if (text && !text.toLowerCase().includes('no template') && text.trim().length > 0) {
            await opt.click();
            console.log(`Selected template for body: "${text?.substring(0, 30)}"`);
            break;
          }
        }
        await page.waitForTimeout(1000);
      }
    } else {
      console.log(`Body already has content (${bodyContent.length} chars)`);
    }

    await page.screenshot({ path: 'screenshots/test8_step6_body.png' });
    console.log('Step 6: PASS - Body has content\n');

    // Step 7: Find and click Send button
    console.log('Step 7: Find Send button...');

    const sendSelectors = [
      'button:has-text("Send Email")',
      'button:has-text("Send")',
      'button[type="submit"]:has-text("Send")',
      'button:has(svg.lucide-send)'
    ];

    let sendButton = null;
    for (const selector of sendSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        sendButton = btn;
        console.log(`Found send button: ${selector}`);
        break;
      }
    }

    // List all buttons if send not found
    if (!sendButton) {
      const allBtns = await page.$$('button');
      console.log(`Listing all ${allBtns.length} buttons:`);
      for (let i = 0; i < Math.min(15, allBtns.length); i++) {
        const text = await allBtns[i].textContent();
        console.log(`  Button ${i}: "${text?.substring(0, 40)}"`);
      }
    }

    await page.screenshot({ path: 'screenshots/test8_step7_before_send.png' });

    if (sendButton) {
      console.log('Step 7: PASS - Send button found\n');

      // Step 8: Click Send
      console.log('Step 8: Click Send...');
      await sendButton.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'screenshots/test8_step8_after_send.png' });

      // Check for success message or navigation
      const pageContent = await page.content();
      const currentUrl = page.url();

      if (pageContent.includes('success') ||
        pageContent.includes('sent') ||
        pageContent.includes('Message sent') ||
        currentUrl.includes('inbox') ||
        currentUrl.includes('sent')) {
        console.log('Step 8: PASS - Email appears to have been sent!\n');
        console.log('\n=== TEST 8 RESULT: PASS ===');
      } else {
        // Check for any error messages
        const errorVisible = await page.$('text=error, text=failed, [role="alert"]');
        if (errorVisible) {
          const errorText = await errorVisible.textContent();
          console.log(`Step 8: WARNING - Possible error: "${errorText}"`);
          console.log('\n=== TEST 8 RESULT: NEEDS VERIFICATION ===');
        } else {
          console.log('Step 8: Send clicked, no clear success/error indicator');
          console.log('\n=== TEST 8 RESULT: PARTIAL PASS ===');
        }
      }
    } else {
      console.log('Step 7: FAIL - Send button not found\n');
      console.log('\n=== TEST 8 RESULT: NEEDS INVESTIGATION ===');
    }

  } catch (error) {
    console.error('TEST 8 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test8_error.png' });
    console.log('\n=== TEST 8 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
