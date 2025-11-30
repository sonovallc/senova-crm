const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('requestfailed', request => {
    console.log('Request Failed:', request.url(), request.failure().errorText);
  });

  try {
    // 1. Login
    console.log('1. Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('   Login successful');

    // 2. Navigate to autoresponders edit page
    console.log('2. Navigate to autoresponder edit...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // Click edit button (2nd button) on first autoresponder
    const firstRowButtons = await page.locator('tbody tr:first-child td:last-child button').all();
    if (firstRowButtons.length >= 2) {
      console.log('3. Clicking Edit button...');
      await firstRowButtons[1].click();
      await page.waitForTimeout(5000);

      await page.screenshot({ path: 'screenshots/bug7-1-edit-page.png', fullPage: true });

      // Look for template selection dropdown or section
      console.log('4. Looking for Template Selection...');

      // Check for any select/dropdown with "Template" in it
      const templateSelects = await page.locator('select, [role="combobox"], [data-testid*="template"]').all();
      console.log('   Found', templateSelects.length, 'potential template selectors');

      // Check for multi-step sequences section
      const hasSequences = await page.locator('text=Sequence').count();
      const hasMultiStep = await page.locator('text=Multi-Step').count();
      console.log('   Has Sequences section:', hasSequences > 0);
      console.log('   Has Multi-Step:', hasMultiStep > 0);

      // Look for "Add Step" or similar buttons
      const addStepBtn = page.locator('button:has-text("Add Step"), button:has-text("Add Email"), button:has-text("Add Sequence")');
      const addStepCount = await addStepBtn.count();
      console.log('   Add Step buttons:', addStepCount);

      // Try to find template selection in sequences
      if (addStepCount > 0) {
        console.log('5. Clicking Add Step button...');
        await addStepBtn.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/bug7-2-after-add-step.png', fullPage: true });
      }

      // Look for template dropdown
      const templateDropdown = page.locator('[class*="select"], [class*="dropdown"]').filter({ hasText: /template/i });
      const templateCount = await templateDropdown.count();
      console.log('6. Template dropdowns found:', templateCount);

      // Take final screenshot
      await page.screenshot({ path: 'screenshots/bug7-3-template-area.png', fullPage: true });

      // Check for any errors
      const pageText = await page.locator('body').textContent();
      const hasError = pageText.toLowerCase().includes('error') &&
                       (pageText.toLowerCase().includes('template') || pageText.toLowerCase().includes('selection'));
      console.log('7. Template-related error:', hasError);

      // Page preview
      console.log('8. Page sections:');
      const headers = await page.locator('h1, h2, h3, h4').allTextContents();
      headers.forEach((h, i) => console.log('   ', i + 1, '-', h));
    } else {
      console.log('No autoresponders to test');
    }

    // Print all collected console errors
    console.log('\n=== Console Errors ===');
    if (errors.length === 0) {
      console.log('No console errors');
    } else {
      errors.forEach((e, i) => console.log((i + 1) + '.', e.substring(0, 300)));
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'screenshots/bug7-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
