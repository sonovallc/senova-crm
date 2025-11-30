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

  try {
    // 1. Login
    console.log('1. Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('   Login successful');

    // 2. Navigate to contacts page
    console.log('2. Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/bug8-1-contacts-list.png', fullPage: true });

    // Check if there are any contacts
    const rows = await page.locator('tbody tr').count();
    console.log('3. Found', rows, 'contact rows');

    if (rows === 0) {
      console.log('   No contacts found - need to create one first');
    } else {
      // Click on first contact to view details
      console.log('4. Clicking first contact...');
      await page.locator('tbody tr:first-child').click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'screenshots/bug8-2-contact-detail.png', fullPage: true });

      // Look for Edit button
      console.log('5. Looking for Edit button...');
      const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      const editExists = await editBtn.count();
      console.log('   Edit button found:', editExists > 0);

      if (editExists > 0) {
        console.log('6. Clicking Edit button...');
        await editBtn.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'screenshots/bug8-3-edit-form.png', fullPage: true });

        // Check for custom fields section
        console.log('7. Looking for Custom Fields section...');

        // Check for common custom field labels
        const customFieldsSection = await page.locator('text=Custom Fields, text=Additional Fields, h2:has-text("Custom"), h3:has-text("Custom")').count();
        console.log('   Custom Fields section found:', customFieldsSection > 0);

        // Look for specific custom field inputs
        const pageText = await page.locator('body').textContent();

        // Check for common custom field names
        const hasCustomFieldText = pageText.toLowerCase().includes('custom') ||
                                   pageText.toLowerCase().includes('additional');
        console.log('   Has custom/additional text:', hasCustomFieldText);

        // Look for any input fields beyond the basic ones
        const allInputs = await page.locator('input, textarea, select').count();
        console.log('   Total form inputs:', allInputs);

        // Check for specific field types
        const basicFields = ['name', 'email', 'phone', 'first', 'last'];
        let basicFieldCount = 0;
        for (const field of basicFields) {
          const count = await page.locator(`input[name*="${field}" i], input[placeholder*="${field}" i]`).count();
          basicFieldCount += count;
        }
        console.log('   Basic fields found:', basicFieldCount);
        console.log('   Potential custom fields:', allInputs - basicFieldCount);

        // List all visible form labels
        console.log('8. Form field labels:');
        const labels = await page.locator('label, [class*="label"]').allTextContents();
        labels.forEach((l, i) => {
          if (l.trim()) console.log('   ', i + 1, '-', l.trim().substring(0, 50));
        });

        // Check for errors related to custom fields
        const hasError = pageText.toLowerCase().includes('error') &&
                        pageText.toLowerCase().includes('field');
        console.log('9. Field-related error:', hasError);

        // Take another screenshot after scrolling
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/bug8-4-edit-form-bottom.png', fullPage: true });
      }
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
    await page.screenshot({ path: 'screenshots/bug8-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
