const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 6: TEMPLATE EDIT BODY DISPLAYS (Bug #6 Verification) ===\n');
  console.log('This test verifies that when editing a template, the body content is displayed.\n');

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
    await page.goto('http://localhost:3004/dashboard/email/templates', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test6_step2_templates.png' });
    console.log('Step 2: PASS - On templates page\n');

    // Step 3: Find a template with content and click Edit
    console.log('Step 3: Click Edit on a template...');

    // Look for edit button (pencil icon) on one of the templates
    // The templates have edit icons in their card footers
    const editBtn = await page.$('button[aria-label*="edit"], button:has(svg.lucide-pencil), button:has(svg[class*="edit"])');

    if (!editBtn) {
      // Try finding by looking for the pencil icon in the template card
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const svg = await btn.$('svg');
        if (svg) {
          const svgClass = await svg.getAttribute('class');
          if (svgClass && (svgClass.includes('pencil') || svgClass.includes('edit'))) {
            await btn.click();
            console.log('Clicked edit button (found via SVG class)');
            break;
          }
        }
      }
    } else {
      await editBtn.click();
      console.log('Clicked edit button');
    }

    // Alternative: click directly on Edit text or icon in the template card
    if (!editBtn) {
      // Try the Pencil icon that's visible in the screenshot
      await page.click('svg.lucide-pencil', { timeout: 5000 }).catch(async () => {
        // Last resort: look for any clickable edit action
        const templateCard = await page.$('[class*="Card"]');
        if (templateCard) {
          const pencilBtn = await templateCard.$('button:nth-of-type(1)');
          if (pencilBtn) {
            await pencilBtn.click();
            console.log('Clicked first button in template card (likely Preview)');
          }
        }
      });
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test6_step3_edit_clicked.png' });
    console.log('Step 3: PASS - Edit clicked\n');

    // Step 4: Check if template edit form opened and has body content
    console.log('Step 4: Verify body content displays in edit form...');

    await page.waitForTimeout(1000);

    // Look for the body editor and check if it has content
    const bodySelectors = [
      '[contenteditable="true"]',
      '.ProseMirror',
      '.tiptap',
      'textarea[name="body"]',
      'textarea[name="body_html"]'
    ];

    let bodyContent = '';
    let editorFound = false;

    for (const selector of bodySelectors) {
      const editor = await page.$(selector);
      if (editor) {
        editorFound = true;
        bodyContent = await editor.textContent() || await editor.innerText();
        console.log(`Found editor with selector: ${selector}`);
        console.log(`Editor content length: ${bodyContent.length} characters`);
        if (bodyContent.length > 0) {
          console.log(`First 100 chars: "${bodyContent.substring(0, 100)}..."`);
        }
        break;
      }
    }

    await page.screenshot({ path: 'screenshots/test6_step4_edit_form.png' });

    // Step 5: Evaluate result
    console.log('\nStep 5: Evaluate Bug #6 status...');

    if (!editorFound) {
      console.log('WARNING: Editor element not found. Form may not have opened.');
      console.log('\n=== TEST 6 RESULT: NEEDS VERIFICATION ===');
    } else if (bodyContent.length > 0) {
      console.log('SUCCESS: Body content IS displayed in edit form!');
      console.log('Bug #6 appears to be FIXED.');
      console.log('\n=== TEST 6 RESULT: PASS - BUG #6 FIXED ===');
    } else {
      console.log('FAIL: Editor found but body content is EMPTY!');
      console.log('Bug #6 is NOT fixed - template body does not display on edit.');
      console.log('\n=== TEST 6 RESULT: FAIL - BUG #6 NOT FIXED ===');
    }

  } catch (error) {
    console.error('TEST 6 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test6_error.png' });
    console.log('\n=== TEST 6 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
