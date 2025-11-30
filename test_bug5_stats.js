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

    // 2. Navigate to autoresponders page
    console.log('2. Navigate to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/bug5-1-autoresponders-list.png', fullPage: true });

    // Check if there are any autoresponders
    const rows = await page.locator('tbody tr').count();
    console.log('3. Found', rows, 'autoresponder rows');

    if (rows === 0) {
      console.log('   No autoresponders found - cannot test stats');
    } else {
      // Find and click the Stats button (first icon button in Actions column)
      console.log('4. Looking for Stats button (BarChart icon)...');

      const firstRowButtons = await page.locator('tbody tr:first-child td:last-child button').all();
      console.log('   First row has', firstRowButtons.length, 'action buttons');

      if (firstRowButtons.length >= 1) {
        console.log('5. Clicking Stats button (1st button)...');
        await firstRowButtons[0].click();
        await page.waitForTimeout(5000);

        console.log('6. Current URL:', page.url());
        await page.screenshot({ path: 'screenshots/bug5-2-stats-page.png', fullPage: true });

        // Check for error page or "No Autoresponders Found"
        const pageText = await page.locator('body').textContent();

        const hasNoAutoresponders = pageText.includes('No Autoresponders Found') ||
                                    pageText.includes('No autoresponders') ||
                                    pageText.includes('not found');
        const hasError = pageText.toLowerCase().includes('network error') ||
                        pageText.toLowerCase().includes('failed to load');

        console.log('7. Has "No Autoresponders" message:', hasNoAutoresponders);
        console.log('8. Has error:', hasError);

        // Check if stats are shown
        const hasStats = pageText.includes('Total Sent') ||
                        pageText.includes('Total Executions') ||
                        pageText.includes('Statistics') ||
                        pageText.includes('Autoresponder Details');
        console.log('9. Has stats content:', hasStats);

        // Show page preview
        console.log('10. Page preview:', pageText.substring(0, 500));
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
    await page.screenshot({ path: 'screenshots/bug5-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
