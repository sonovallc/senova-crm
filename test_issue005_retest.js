const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== ISSUE-005 RE-VERIFICATION: CSV Export Button (After Rebuild) ===\n');

    await page.goto('http://localhost:3004');
    await page.waitForTimeout(2000);

    console.log('Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('Navigating to contacts page...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);

    console.log('Taking screenshot of page header...');
    await page.screenshot({ 
      path: 'screenshots/ISSUE005-retest-01-header.png',
      fullPage: true
    });

    console.log('\nChecking for Export All button...');
    const exportButton = await page.locator('[data-testid="export-all-button"]');
    const isVisible = await exportButton.isVisible().catch(() => false);

    console.log('\n=== RESULT ===');
    console.log('Export All button visible: ' + (isVisible ? 'YES' : 'NO'));

    if (isVisible) {
      console.log('\nAttempting to click Export All button...');
      await exportButton.click();
      await page.waitForTimeout(2000);

      const toast = await page.locator('.Toastify__toast').isVisible().catch(() => false);
      console.log('Toast notification appeared: ' + (toast ? 'YES' : 'NO'));

      await page.screenshot({ 
        path: 'screenshots/ISSUE005-retest-02-after-click.png',
        fullPage: true
      });
    } else {
      console.log('\nExport All button NOT found');
      console.log('Searching for any button containing Export text...');
      
      const allButtons = await page.locator('button').all();
      for (const btn of allButtons) {
        const text = await btn.textContent().catch(() => '');
        if (text.toLowerCase().includes('export')) {
          console.log('Found button: ' + text);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
