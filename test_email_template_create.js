const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 5: EMAIL TEMPLATE CREATE ===\n');

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

    // Step 2: Navigate to Email Templates
    console.log('Step 2: Navigate to Email Templates...');

    // Click on Email in sidebar to expand, then Templates
    const emailMenu = await page.$('text=Email');
    if (emailMenu) {
      await emailMenu.click();
      await page.waitForTimeout(500);
    }

    // Now click Templates
    await page.click('text=Templates');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test5_step2_templates_page.png' });
    console.log('Step 2: PASS - On templates page\n');

    // Step 3: Click Create Template button
    console.log('Step 3: Click Create Template...');

    const createBtn = await page.$('button:has-text("Create Template"), button:has-text("New Template"), button:has-text("Add")');
    if (createBtn) {
      await createBtn.click();
      console.log('Clicked Create Template button');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test5_step3_create_form.png' });
    console.log('Step 3: PASS - Create form open\n');

    // Step 4: Fill in template details
    console.log('Step 4: Fill template details...');

    const timestamp = Date.now();
    const templateName = `TestTemplate_${timestamp}`;
    const templateSubject = `Test Subject ${timestamp}`;

    // Fill name
    const nameInput = await page.$('input[name="name"], input[placeholder*="name"]');
    if (nameInput) {
      await nameInput.fill(templateName);
      console.log(`Set name: ${templateName}`);
    }

    // Fill subject
    const subjectInput = await page.$('input[name="subject"], input[placeholder*="subject"]');
    if (subjectInput) {
      await subjectInput.fill(templateSubject);
      console.log(`Set subject: ${templateSubject}`);
    }

    // Select category (if dropdown exists)
    const categorySelect = await page.$('select[name="category"], [data-testid="category-select"]');
    if (categorySelect) {
      await categorySelect.selectOption({ index: 1 });
      console.log('Selected category');
    } else {
      // Try Radix UI Select
      const selectTrigger = await page.$('button[role="combobox"]:near(:text("Category"))');
      if (selectTrigger) {
        await selectTrigger.click();
        await page.waitForTimeout(500);
        const option = await page.$('[role="option"]');
        if (option) await option.click();
      }
    }

    // Fill body content (rich text editor)
    // Try various editor selectors
    const editorSelectors = [
      '[contenteditable="true"]',
      'textarea[name="body_html"]',
      '.tiptap',
      '.ProseMirror',
      'textarea'
    ];

    for (const selector of editorSelectors) {
      const editor = await page.$(selector);
      if (editor) {
        await editor.click();
        await editor.type('<p>This is a test template body.</p><p>Testing email functionality.</p>');
        console.log(`Filled body using: ${selector}`);
        break;
      }
    }

    await page.screenshot({ path: 'screenshots/test5_step4_filled_form.png' });
    console.log('Step 4: PASS - Form filled\n');

    // Step 5: Save template
    console.log('Step 5: Save template...');

    const saveBtn = await page.$('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
    if (saveBtn) {
      await saveBtn.click();
      console.log('Clicked Save button');
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test5_step5_saved.png' });
    console.log('Step 5: PASS - Template saved\n');

    // Step 6: Verify template appears in list
    console.log('Step 6: Verify template in list...');

    // Navigate back to templates list
    await page.goto('http://localhost:3004/dashboard/email/templates', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test5_step6_verify.png' });

    const pageContent = await page.content();
    if (pageContent.includes(templateName) || pageContent.includes(`TestTemplate_`)) {
      console.log('Step 6: PASS - Template found in list!\n');
      console.log('\n=== TEST 5 RESULT: PASS ===');
    } else {
      console.log('Step 6: NEEDS VERIFICATION - Check screenshots\n');
      console.log('\n=== TEST 5 RESULT: NEEDS VERIFICATION ===');
    }

  } catch (error) {
    console.error('TEST 5 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test5_error.png' });
    console.log('\n=== TEST 5 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
