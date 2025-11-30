const { chromium } = require('playwright');

(async () => {
  console.log('=== CONTACT EDIT WORKFLOW TEST ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('  ✓ Login successful\n');

    // Navigate to Contacts
    console.log('Step 2: Navigating to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v5-edit-01-list.png' });
    console.log('  ✓ Contacts loaded\n');

    // Find a proper contact link (exclude sidebar links)
    console.log('Step 3: Finding contact link in the main content...');

    // Get all links that look like contact detail pages (UUID pattern)
    const contactLinks = await page.locator('a[href*="/dashboard/contacts/"]').all();
    console.log('  Total contact-like links found:', contactLinks.length);

    let targetLink = null;
    let targetHref = '';
    let targetName = '';

    for (const link of contactLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();

      // Skip sidebar links like "Deleted Contacts"
      if (href && !href.includes('deleted') && href.match(/\/dashboard\/contacts\/[a-f0-9-]{36}/)) {
        targetLink = link;
        targetHref = href;
        targetName = text;
        console.log('  Found valid contact:', text, '→', href);
        break;
      }
    }

    if (!targetLink) {
      console.log('  ✗ No valid contact links found with UUID pattern');
      console.log('  Listing all contact links:');
      for (const link of contactLinks.slice(0, 5)) {
        const h = await link.getAttribute('href');
        const t = await link.textContent();
        console.log('    -', t, '→', h);
      }
      throw new Error('No valid contact links');
    }

    console.log('  ✓ Target contact:', targetName, '\n');

    // Click and navigate
    console.log('Step 4: Clicking contact link...');
    await targetLink.click();
    await page.waitForTimeout(5000);  // Wait for navigation

    const currentUrl = page.url();
    console.log('  Current URL:', currentUrl);
    await page.screenshot({ path: 'screenshots/v5-edit-02-after-click.png' });

    if (currentUrl.includes('/dashboard/contacts/') && currentUrl !== 'http://localhost:3004/dashboard/contacts') {
      console.log('  ✓ Navigated to detail page!\n');
      await page.screenshot({ path: 'screenshots/v5-edit-03-detail.png' });

      // Look for Edit button
      console.log('Step 5: Looking for Edit button...');
      const editBtn = await page.locator('button:has-text("Edit")').first();

      if (await editBtn.count() > 0) {
        console.log('  ✓ Edit button found!');
        await page.screenshot({ path: 'screenshots/v5-edit-04-edit-btn.png' });

        // Click Edit
        console.log('\nStep 6: Clicking Edit...');
        await editBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/v5-edit-05-after-edit.png' });

        const afterEditUrl = page.url();
        console.log('  URL:', afterEditUrl);

        // Check for modal or form
        const modal = await page.locator('[role="dialog"]').first();
        if (await modal.count() > 0) {
          console.log('  ✓ Edit modal opened!\n');
          await page.screenshot({ path: 'screenshots/v5-edit-06-modal.png' });

          // Find and modify last name
          console.log('Step 7: Modifying last name...');
          await page.waitForTimeout(1000);

          // Try different selectors for last name input
          let lastNameInput = await page.locator('input[name="last_name"]').first();
          if (await lastNameInput.count() === 0) {
            lastNameInput = await page.locator('label:has-text("Last Name") >> xpath=following-sibling::input').first();
          }
          if (await lastNameInput.count() === 0) {
            lastNameInput = await page.locator('input').nth(1);  // Usually second input after first name
          }

          if (await lastNameInput.count() > 0) {
            const oldValue = await lastNameInput.inputValue();
            const newValue = oldValue + ' EDITED';
            await lastNameInput.fill(newValue);
            console.log('  Changed:', oldValue, '→', newValue);
            await page.screenshot({ path: 'screenshots/v5-edit-07-modified.png' });

            // Save
            console.log('\nStep 8: Saving...');
            const saveBtn = await page.locator('button:has-text("Update"), button:has-text("Save")').first();
            if (await saveBtn.count() > 0) {
              await saveBtn.click();
              await page.waitForTimeout(3000);
              await page.screenshot({ path: 'screenshots/v5-edit-08-saved.png' });
              console.log('  ✓ Save clicked!');

              // Check for success
              const successToast = await page.locator('text=success, text=Success, text=updated').first();
              if (await successToast.count() > 0) {
                console.log('  ✓ Success message shown!\n');
              }
            }
          } else {
            console.log('  ✗ Could not find last name input');
          }
        } else {
          console.log('  No modal - checking if form appeared inline');
        }
      } else {
        console.log('  ✗ No Edit button found on detail page');
        const buttons = await page.locator('button').all();
        console.log('  Buttons found:', buttons.length);
        for (const b of buttons.slice(0, 10)) {
          console.log('    -', await b.textContent());
        }
      }
    } else {
      console.log('  ✗ Navigation failed - still on contacts list');
    }

    console.log('\n=== TEST COMPLETE ===');
    await page.screenshot({ path: 'screenshots/v5-edit-final.png' });

  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/v5-edit-error.png' });
  } finally {
    await browser.close();
  }
})();
