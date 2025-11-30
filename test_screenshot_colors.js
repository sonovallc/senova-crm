const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Create screenshots directory
  if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots');
  }

  console.log('\n=== TAKING SCREENSHOTS OF COLOR CHANGES ===\n');

  try {
    // 1. Public Pricing Page
    console.log('1. Capturing Public Pricing Page...');
    await page.goto('http://localhost:3005/pricing', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: './screenshots/pricing-blue-check.png',
      fullPage: true
    });
    console.log('   ✅ Saved: screenshots/pricing-blue-check.png');

    // 2. CRM Login Page
    console.log('\n2. Capturing CRM Login Page...');
    await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: './screenshots/login-page-colors.png'
    });
    console.log('   ✅ Saved: screenshots/login-page-colors.png');

    // 3. CRM Dashboard
    console.log('\n3. Capturing CRM Dashboard...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    if (!page.url().includes('/dashboard')) {
      await page.goto('http://localhost:3005/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: './screenshots/dashboard-colors.png',
      fullPage: false
    });
    console.log('   ✅ Saved: screenshots/dashboard-colors.png');

    // 4. Contacts Page
    console.log('\n4. Capturing Contacts Page...');
    await page.goto('http://localhost:3005/dashboard/contacts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: './screenshots/contacts-colors.png',
      fullPage: false
    });
    console.log('   ✅ Saved: screenshots/contacts-colors.png');

    console.log('\n=== SCREENSHOTS COMPLETE ===');
    console.log('\nReview the screenshots to see:');
    console.log('1. Electric Blue (#0066ff) on public pricing page');
    console.log('2. Sky Blue (#4a90e2) status on CRM dashboard');
    console.log('\nScreenshots saved in: ./screenshots/');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Keep browser open for 3 seconds to see the result
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();