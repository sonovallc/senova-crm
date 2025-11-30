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

  page.on('response', response => {
    if (response.url().includes('autoresponders') && !response.ok()) {
      console.log('API Response Error:', response.status(), response.url());
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
    console.log('   URL after login:', page.url());
    console.log('   Login successful');

    // 2. Navigate to autoresponders page
    console.log('2. Navigate to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/bug6-1-autoresponders-list.png', fullPage: true });

    // Check if there are any autoresponders
    const rows = await page.locator('tbody tr').count();
    console.log('3. Found', rows, 'autoresponder rows');

    if (rows === 0) {
      console.log('   No autoresponders found - need to create one first');
      console.log('   Navigate to create page...');
      await page.goto('http://localhost:3004/dashboard/email/autoresponders/create', { timeout: 90000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug6-2-create-page.png', fullPage: true });
      console.log('   Screenshot taken: create page');
    } else {
      // Find and click the Edit button (second icon button in Actions column)
      console.log('4. Looking for Edit button...');

      // The edit button should be the second one in the Actions column
      const firstRowButtons = await page.locator('tbody tr:first-child td:last-child button').all();
      console.log('   First row has', firstRowButtons.length, 'action buttons');

      if (firstRowButtons.length >= 2) {
        console.log('5. Clicking Edit button (2nd button)...');
        await firstRowButtons[1].click();
        await page.waitForTimeout(5000);

        console.log('6. Current URL:', page.url());
        await page.screenshot({ path: 'screenshots/bug6-3-edit-result.png', fullPage: true });

        // Check for error page or content
        const pageContent = await page.locator('body').textContent();
        console.log('7. Page content preview:', pageContent.substring(0, 500));

        // Check for specific errors
        const hasError = pageContent.toLowerCase().includes('error') ||
                        pageContent.toLowerCase().includes('failed') ||
                        pageContent.toLowerCase().includes('network');
        console.log('8. Has error text:', hasError);
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
    await page.screenshot({ path: 'screenshots/bug6-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
