const { chromium } = require('playwright');

(async () => {
  console.log('Starting Contact Edit Workflow Test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  Login successful');

    // Step 2: Navigate to Contacts
    console.log('Step 2: Navigating to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v5-retest-01-contacts.png' });
    console.log('  Contacts page loaded');

    // Step 3: Click on first contact to go to detail page
    console.log('Step 3: Clicking on a contact to open detail page...');

    // Look for contact cards or rows - try clicking the contact name/link
    const contactLink = await page.locator('a[href*="/dashboard/contacts/"]').first();
    if (await contactLink.count() > 0) {
      const href = await contactLink.getAttribute('href');
      console.log('  Found contact link:', href);
      await contactLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/v5-retest-02-detail-page.png' });
      console.log('  Detail page opened');
    } else {
      // Try clicking on contact card
      const contactCard = await page.locator('[class*="contact"], [class*="card"]').first();
      if (await contactCard.count() > 0) {
        await contactCard.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/v5-retest-02-detail-page.png' });
      } else {
        console.log('  Could not find contact to click');
        await page.screenshot({ path: 'screenshots/v5-retest-02-no-contact.png' });
      }
    }

    // Step 4: Look for Edit button on detail page
    console.log('Step 4: Looking for Edit button...');
    const currentUrl = page.url();
    console.log('  Current URL:', currentUrl);

    // Take screenshot of what we see
    await page.screenshot({ path: 'screenshots/v5-retest-03-current-page.png' });

    // Look for Edit button
    const editButton = await page.locator('button:has-text("Edit"), a:has-text("Edit"), [aria-label*="edit"], [aria-label*="Edit"]').first();
    if (await editButton.count() > 0) {
      console.log('  Found Edit button');
      await editButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/v5-retest-04-after-edit-click.png' });
      console.log('  Clicked Edit button');

      // Check if modal opened
      const modal = await page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
      if (await modal.count() > 0) {
        console.log('  Edit modal opened!');
        await page.screenshot({ path: 'screenshots/v5-retest-05-edit-modal.png' });

        // Try to find and modify a field
        const lastNameInput = await page.locator('input[name*="last"], input[id*="last"], label:has-text("Last Name") + input, label:has-text("Last Name") ~ input').first();
        if (await lastNameInput.count() > 0) {
          const currentValue = await lastNameInput.inputValue();
          console.log('  Current last name:', currentValue);
          await lastNameInput.fill(currentValue + ' EDITED');
          console.log('  Modified last name');
          await page.screenshot({ path: 'screenshots/v5-retest-06-field-modified.png' });

          // Click Update/Save button
          const saveButton = await page.locator('button:has-text("Update"), button:has-text("Save"), button[type="submit"]').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'screenshots/v5-retest-07-after-save.png' });
            console.log('  Clicked Save button');
          }
        }
      } else {
        console.log('  No modal detected after clicking Edit');
      }
    } else {
      console.log('  No Edit button found on current page');

      // Log all buttons on the page
      const allButtons = await page.locator('button').all();
      console.log('  Buttons found:', allButtons.length);
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        console.log('    Button:', text?.trim().substring(0, 50));
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'screenshots/v5-retest-08-final.png' });

    console.log('\nTest completed. Check screenshots in screenshots/ folder');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/v5-retest-error.png' });
  } finally {
    await browser.close();
  }
})();
