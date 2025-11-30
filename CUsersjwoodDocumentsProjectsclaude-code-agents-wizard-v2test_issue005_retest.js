const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== ISSUE-005 RE-VERIFICATION: CSV Export Button (After Rebuild) ===\n');

    // Navigate to login
    await page.goto('http://localhost:3004');
    await page.waitForTimeout(2000);

    // Login
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to contacts
    console.log('Navigating to contacts page...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);

    // Take screenshot of the page header
    console.log('Taking screenshot of page header...');
    await page.screenshot({ 
      path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\ISSUE005-retest-01-header.png',
      fullPage: true
    });

    // Check for Export All button by data-testid
    console.log('\nChecking for Export All button...');
    const exportButton = await page.locator('[data-testid="export-all-button"]');
    const isVisible = await exportButton.isVisible().catch(() => false);

    console.log('\n=== RESULT ===');
    console.log('Export All button visible: ' + (isVisible ? 'YES' : 'NO'));

    if (isVisible) {
      console.log('\nAttempting to click Export All button...');
      await exportButton.click();
      await page.waitForTimeout(2000);

      // Check for toast notification
      const toast = await page.locator('.Toastify__toast').isVisible().catch(() => false);
      console.log('Toast notification appeared: ' + (toast ? 'YES' : 'NO'));

      // Take screenshot after click
      await page.screenshot({ 
        path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\ISSUE005-retest-02-after-click.png',
        fullPage: true
      });
    } else {
      console.log('\nExport All button NOT found with data-testid="export-all-button"');
      console.log('Searching for any button containing "Export" text...');
      
      // Try to find any export-related button
      const allButtons = await page.locator('button').all();
      for (const btn of allButtons) {
        const text = await btn.textContent().catch(() => '');
        if (text.toLowerCase().includes('export')) {
          console.log('Found button with text: "' + text + '"');
        }
      }
    }

    console.log('\nScreenshots saved:');
    console.log('- ISSUE005-retest-01-header.png');
    if (isVisible) {
      console.log('- ISSUE005-retest-02-after-click.png');
    }

  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();
