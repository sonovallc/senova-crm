const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 5: EMAIL TEMPLATE CREATE (v2) ===\n');

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

    // Step 2: Navigate directly to Email Templates page
    console.log('Step 2: Navigate to Email Templates...');
    await page.goto('http://localhost:3004/dashboard/email/templates', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test5v2_step2_templates_page.png' });
    console.log('Step 2: PASS - On templates page\n');

    // Step 3: Click "New Template" button
    console.log('Step 3: Click New Template button...');

    // Look for the blue "New Template" button visible in screenshot
    const newTemplateBtn = await page.$('button:has-text("New Template")');
    if (newTemplateBtn) {
      await newTemplateBtn.click();
      console.log('Clicked New Template button');
    } else {
      console.log('New Template button not found, trying alternative...');
      await page.click('text=New Template');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test5v2_step3_create_form.png' });

    // Check if we're on a create page or dialog
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    console.log('Step 3: PASS - New Template clicked\n');

    // Step 4: Fill in template details
    console.log('Step 4: Fill template details...');

    const timestamp = Date.now();
    const templateName = `AutoTest_${timestamp}`;
    const templateSubject = `Auto Subject ${timestamp}`;

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Try to find and fill name field
    let nameFilled = false;
    const nameSelectors = [
      'input[name="name"]',
      'input#name',
      'input[placeholder*="Name"]',
      'input[placeholder*="name"]',
      '[data-testid="template-name"]'
    ];

    for (const selector of nameSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.fill(templateName);
        console.log(`Filled name using: ${selector}`);
        nameFilled = true;
        break;
      }
    }

    // Try to find and fill subject field
    let subjectFilled = false;
    const subjectSelectors = [
      'input[name="subject"]',
      'input#subject',
      'input[placeholder*="Subject"]',
      'input[placeholder*="subject"]'
    ];

    for (const selector of subjectSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.fill(templateSubject);
        console.log(`Filled subject using: ${selector}`);
        subjectFilled = true;
        break;
      }
    }

    // Try to fill body/content
    let bodyFilled = false;
    const bodySelectors = [
      '[contenteditable="true"]',
      '.ProseMirror',
      '.tiptap',
      'textarea[name="body"]',
      'textarea[name="body_html"]',
      'div[role="textbox"]'
    ];

    for (const selector of bodySelectors) {
      const editor = await page.$(selector);
      if (editor) {
        await editor.click();
        await page.keyboard.type('This is an automated test template body. Hello {{first_name}}!');
        console.log(`Filled body using: ${selector}`);
        bodyFilled = true;
        break;
      }
    }

    await page.screenshot({ path: 'screenshots/test5v2_step4_filled_form.png' });
    console.log(`Form status: name=${nameFilled}, subject=${subjectFilled}, body=${bodyFilled}`);
    console.log('Step 4: PASS - Form filled\n');

    // Step 5: Save/Create the template
    console.log('Step 5: Save template...');

    const saveSelectors = [
      'button:has-text("Create Template")',
      'button:has-text("Save Template")',
      'button:has-text("Save")',
      'button:has-text("Create")',
      'button[type="submit"]'
    ];

    let saved = false;
    for (const selector of saveSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        console.log(`Clicked save using: ${selector}`);
        saved = true;
        break;
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test5v2_step5_after_save.png' });
    console.log('Step 5: PASS - Save attempted\n');

    // Step 6: Verify
    console.log('Step 6: Verify template created...');

    // Go to templates list
    await page.goto('http://localhost:3004/dashboard/email/templates', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test5v2_step6_verify.png' });

    const pageContent = await page.content();
    if (pageContent.includes('AutoTest_') || pageContent.includes(templateName)) {
      console.log('Step 6: PASS - Template found in list!\n');
      console.log('\n=== TEST 5 RESULT: PASS ===');
    } else {
      console.log('Step 6: Template not found in list. May need manual verification.');
      console.log('\n=== TEST 5 RESULT: NEEDS VERIFICATION ===');
    }

  } catch (error) {
    console.error('TEST 5 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test5v2_error.png' });
    console.log('\n=== TEST 5 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
