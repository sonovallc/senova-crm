const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== ISSUE-005 RE-VERIFICATION: CSV Export Button (After Rebuild) ===\n');

    // Navigate directly to dashboard
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3004/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    // Check if we're on login page
    if (page.url().includes('/login') || page.url().includes('/dashboard')) {
      console.log('Taking screenshot of current page...');
      await page.screenshot({ 
        path: 'screenshots/ISSUE005-retest-current-page.png',
        fullPage: true
      });

      // Try to find and fill login form
      const emailInput = await page.locator('input[type="email"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      
      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Logging in...');
        await emailInput.fill('admin@evebeautyma.com');
        await passwordInput.fill('TestPass123!');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      }
    }

    // Navigate to contacts
    console.log('Navigating to contacts page...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    console.log('Taking screenshot of contacts page header...');
    await page.screenshot({ 
      path: 'screenshots/ISSUE005-retest-01-header.png',
      fullPage: true
    });

    // Check for Export All button
    console.log('\nChecking for Export All button with data-testid="export-all-button"...');
    const exportButton = await page.locator('[data-testid="export-all-button"]');
    const isVisible = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('\n=== RESULT ===');
    console.log('Export All button visible: ' + (isVisible ? 'YES' : 'NO'));

    if (isVisible) {
      console.log('\nButton found! Clicking Export All button...');
      await exportButton.click();
      await page.waitForTimeout(2000);

      const toast = await page.locator('.Toastify__toast').isVisible().catch(() => false);
      console.log('Toast notification appeared: ' + (toast ? 'YES' : 'NO'));

      await page.screenshot({ 
        path: 'screenshots/ISSUE005-retest-02-after-click.png',
        fullPage: true
      });
    } else {
      console.log('\nExport All button NOT found with data-testid');
      console.log('Searching for any export-related buttons...');
      
      const allButtons = await page.locator('button').all();
      let foundExport = false;
      for (const btn of allButtons) {
        const text = await btn.textContent().catch(() => '');
        if (text.toLowerCase().includes('export')) {
          console.log('Found button with text: "' + text + '"');
          foundExport = true;
        }
      }
      if (!foundExport) {
        console.log('No buttons with "export" text found');
      }
    }

    console.log('\n=== SCREENSHOTS SAVED ===');
    console.log('- ISSUE005-retest-01-header.png');
    if (isVisible) {
      console.log('- ISSUE005-retest-02-after-click.png');
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ 
      path: 'screenshots/ISSUE005-retest-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
})();
