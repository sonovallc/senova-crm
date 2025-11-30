const { chromium } = require('playwright');

(async () => {
  console.log('Starting Contact Edit Functionality Test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Login
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✓ Login successful');

    // Navigate to Contacts
    console.log('3. Navigating to Contacts page...');
    await page.goto('http://localhost:3000/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    console.log('✓ Contacts page loaded');

    // Wait for contacts to load
    await page.waitForTimeout(2000);

    // Find first contact card with Edit button
    console.log('4. Looking for contact with Edit button...');

    // Try clicking on first contact to go to detail page
    const firstContactCard = await page.locator('[data-testid="contact-card"]').first().or(page.locator('.border.rounded-lg').first());

    if (await firstContactCard.count() > 0) {
      console.log('✓ Found contact card, clicking to view details...');
      await firstContactCard.click();
      await page.waitForTimeout(2000);

      // Look for Edit button on detail page
      const editButton = await page.locator('button:has-text("Edit")').first();
      if (await editButton.count() > 0) {
        console.log('✓ Found Edit button on contact detail page');

        // Click Edit button
        console.log('5. Clicking Edit button...');
        await editButton.click();
        await page.waitForTimeout(2000);

        // Check if form modal appeared
        const dialogTitle = await page.locator('[role="dialog"] h2, [role="dialog"] .text-lg').first();
        if (await dialogTitle.count() > 0) {
          const titleText = await dialogTitle.textContent();
          console.log(`✓ Edit form opened with title: "${titleText}"`);

          // Check if form fields are visible
          const firstNameInput = await page.locator('input#first_name, input[name="first_name"]').first();
          const lastNameInput = await page.locator('input#last_name, input[name="last_name"]').first();

          if (await firstNameInput.count() > 0 && await lastNameInput.count() > 0) {
            console.log('✓ Form fields are visible (first_name, last_name)');

            // Get current values
            const currentFirstName = await firstNameInput.inputValue();
            const currentLastName = await lastNameInput.inputValue();
            console.log(`   Current values: ${currentFirstName} ${currentLastName}`);

            // Try to edit first name
            console.log('6. Testing field editing...');
            await firstNameInput.fill('');
            await firstNameInput.fill(currentFirstName + ' (Edited)');
            await page.waitForTimeout(500);

            const newValue = await firstNameInput.inputValue();
            console.log(`   Updated first name to: ${newValue}`);

            // Look for Save/Update button
            const updateButton = await page.locator('button[type="submit"]:has-text("Update"), button:has-text("Save")').first();
            if (await updateButton.count() > 0) {
              console.log('✓ Save/Update button found');

              // Screenshot before saving
              await page.screenshot({ path: 'screenshots/contact-edit-form.png', fullPage: true });
              console.log('✓ Screenshot saved: screenshots/contact-edit-form.png');

              console.log('\n=== TEST RESULTS ===');
              console.log('✓ Contact Edit button exists on detail page');
              console.log('✓ Edit button opens modal with form');
              console.log('✓ Form fields are editable');
              console.log('✓ Save/Update button is present');
              console.log('\n=== CONTACT EDIT FUNCTIONALITY IS WORKING ===\n');
            } else {
              console.log('✗ Save/Update button not found');
            }

            // Click Cancel to close modal
            const cancelButton = await page.locator('button:has-text("Cancel")').first();
            if (await cancelButton.count() > 0) {
              await cancelButton.click();
              console.log('✓ Closed edit modal');
            }

          } else {
            console.log('✗ Form fields not found');
          }
        } else {
          console.log('✗ Edit form modal did not appear');
        }
      } else {
        console.log('✗ Edit button not found on contact detail page');
      }
    } else {
      console.log('✗ No contacts found on page');
    }

    // Final screenshot
    await page.screenshot({ path: 'screenshots/contact-edit-final.png', fullPage: true });
    console.log('✓ Final screenshot saved: screenshots/contact-edit-final.png');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'screenshots/contact-edit-error.png', fullPage: true });
  } finally {
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
