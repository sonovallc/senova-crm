const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3004/auth/login');

    // Login
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('Logged in successfully');

    // Navigate to contacts page
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);

    // Click on the first contact in the table to view details
    const firstContactRow = await page.locator('table tbody tr').first();
    if (await firstContactRow.count() > 0) {
      // Click on the View button (eye icon)
      await firstContactRow.locator('button:has(svg)').first().click();
      await page.waitForTimeout(2000);

      console.log('Navigated to contact detail page');

      // Check if the Objects section exists
      const objectsSection = await page.locator('text="Objects"').first();
      if (await objectsSection.count() > 0) {
        console.log('✓ Objects section found on contact detail page');

        // Check for the "Add to Object" button
        const addButton = await page.locator('button:has-text("Add to Object")');
        if (await addButton.count() > 0) {
          console.log('✓ "Add to Object" button found (user has manage permissions)');

          // Click the button to open the dialog
          await addButton.click();
          await page.waitForTimeout(1000);

          // Check if dialog opened
          const dialog = await page.locator('text="Add Contact to Object"');
          if (await dialog.count() > 0) {
            console.log('✓ Add to Object dialog opened successfully');

            // Check for search input
            const searchInput = await page.locator('input[placeholder="Search objects..."]');
            if (await searchInput.count() > 0) {
              console.log('✓ Search input found in dialog');
            }

            // Close dialog
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        } else {
          console.log('⚠ "Add to Object" button not found (user may not have manage permissions)');
        }

        // Check the objects section content
        const objectsCard = await page.locator('.card:has-text("Objects")').first();
        const cardContent = await objectsCard.textContent();
        console.log('\nObjects section content preview:');
        console.log(cardContent.substring(0, 200) + '...');

      } else {
        console.log('✗ Objects section NOT found on contact detail page');
      }
    } else {
      console.log('No contacts found to test');
    }

    // Take a screenshot
    await page.screenshot({
      path: 'contact-objects-section.png',
      fullPage: true
    });
    console.log('\nScreenshot saved as contact-objects-section.png');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();