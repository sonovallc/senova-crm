const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing Objects Duplicate Functionality...');

  try {
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000); // Give the page extra time to fully render

    // Login
    console.log('2. Logging in as admin...');
    // Check what's on the page
    const pageContent = await page.textContent('body');
    console.log('   Page content preview:', pageContent.substring(0, 200));

    // Try different selectors
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill('admin@evebeautyma.com');
    } else {
      await page.fill('input[name="email"]', 'admin@evebeautyma.com');
    }
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✓ Login successful');

    // Navigate to Objects
    console.log('3. Navigating to Objects...');
    await page.click('a[href="/dashboard/objects"]');
    await page.waitForURL('**/dashboard/objects', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Objects page loaded');

    // Check if there are any objects
    const noObjectsText = await page.textContent('body');
    if (noObjectsText.includes('No objects found')) {
      console.log('   ! No objects found in the system');
      console.log('   Creating a test object first...');

      // Create a test object
      await page.click('button:has-text("Create Object")');
      await page.waitForURL('**/dashboard/objects/create');

      await page.fill('input[name="name"]', 'Test Company for Duplication');
      await page.selectOption('select[name="type"]', 'company');
      await page.fill('input[name="company_info.legal_name"]', 'Test Legal Name LLC');
      await page.fill('input[name="company_info.email"]', 'test@example.com');
      await page.fill('input[name="company_info.phone"]', '555-0100');

      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/objects');
      console.log('   ✓ Test object created');
    }

    // Now test the duplicate functionality
    console.log('4. Testing duplicate functionality...');

    // Wait for the table to be fully loaded
    await page.waitForSelector('table', { timeout: 5000 });

    // Click on the dropdown menu for the first object (three dots button in the Actions column)
    // The button contains the MoreHorizontal icon (three dots)
    const dropdownButton = page.locator('tbody tr').first().locator('button').last();

    await dropdownButton.click();
    console.log('   ✓ Dropdown menu opened');

    // Check if Duplicate option exists
    const duplicateOption = page.locator('div[role="menuitem"]:has-text("Duplicate")');
    const duplicateExists = await duplicateOption.count() > 0;

    if (duplicateExists) {
      console.log('   ✓ Duplicate option found in menu');

      // Click duplicate
      await duplicateOption.click();
      console.log('   ✓ Clicked Duplicate option');

      // Wait for success toast or new item to appear
      await page.waitForTimeout(2000);

      // Check for success toast
      const toastSuccess = await page.locator('div:has-text("Object duplicated successfully")').count() > 0;
      if (toastSuccess) {
        console.log('   ✓ Success toast displayed');
      }

      // Verify the duplicated object exists (should have "(Copy)" in the name)
      await page.waitForTimeout(1000);
      const copyExists = await page.locator('text=/(Copy)/').count() > 0;

      if (copyExists) {
        console.log('   ✓ Duplicated object with "(Copy)" found in the list');
        console.log('\n✅ DUPLICATE FUNCTIONALITY TEST PASSED!');
      } else {
        console.log('   ⚠ Could not find duplicated object with "(Copy)" in name');
      }

    } else {
      console.log('   ❌ Duplicate option NOT found in dropdown menu');
      console.log('   Available menu items:');
      const menuItems = await page.locator('div[role="menuitem"]').allTextContents();
      menuItems.forEach(item => console.log(`     - ${item}`));
    }

    // Take a screenshot of the final state
    await page.screenshot({ path: 'objects_duplicate_test.png', fullPage: true });
    console.log('\nScreenshot saved as objects_duplicate_test.png');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'objects_duplicate_error.png', fullPage: true });
    console.log('Error screenshot saved as objects_duplicate_error.png');
  } finally {
    await browser.close();
  }
})();