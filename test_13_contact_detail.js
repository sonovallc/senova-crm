const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 13: CONTACT DETAIL & DELETE ===\n');

  try {
    // Login
    console.log('Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Logged in\n');

    // Go to contacts
    console.log('Navigating to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test13_contacts_list.png' });

    // Find the first contact link and get its href
    const contactLinks = await page.locator('a[href^="/dashboard/contacts/"]:not([href*="deleted"])').all();
    console.log(`Found ${contactLinks.length} contact links`);

    for (let i = 0; i < Math.min(5, contactLinks.length); i++) {
      const href = await contactLinks[i].getAttribute('href');
      const text = await contactLinks[i].textContent();
      console.log(`  Link ${i}: "${text?.trim()}" -> ${href}`);
    }

    if (contactLinks.length > 0) {
      const firstLink = contactLinks[0];
      const href = await firstLink.getAttribute('href');
      console.log(`\nClicking first contact link: ${href}`);

      // Try clicking with force and wait for navigation
      await Promise.all([
        page.waitForURL(/contacts/, { timeout: 10000 }).catch(() => {}),
        firstLink.click({ force: true })
      ]);

      await page.waitForTimeout(3000);
      const urlAfterClick = page.url();
      console.log(`URL after click: ${urlAfterClick}`);
      await page.screenshot({ path: 'screenshots/test13_after_click.png' });

      // Check if a dialog/modal appeared
      const dialog = await page.locator('[role="dialog"]').first();
      if (await dialog.count() > 0) {
        console.log('Dialog opened after clicking contact');
        await page.screenshot({ path: 'screenshots/test13_dialog.png' });

        // Look for delete in dialog
        const deleteInDialog = await page.locator('[role="dialog"] button:has-text("Delete")').first();
        if (await deleteInDialog.count() > 0) {
          console.log('Delete button found in dialog');
          console.log('\n=== TEST 13 RESULT: PASS - Delete in contact dialog ===');
        } else {
          console.log('Delete not found in dialog');
        }
      }

      // If URL didn't change, try direct navigation
      if (urlAfterClick === 'http://localhost:3004/dashboard/contacts') {
        console.log('\nClick did not navigate. Trying direct URL...');
        await page.goto(`http://localhost:3004${href}`, { timeout: 90000 });
        await page.waitForTimeout(3000);
        console.log(`Direct URL result: ${page.url()}`);
        await page.screenshot({ path: 'screenshots/test13_direct_nav.png' });
      }

      // Now look for delete options
      const currentUrl = page.url();
      console.log(`\nCurrent URL: ${currentUrl}`);

      // Check page content
      const pageContent = await page.content();

      // List all buttons on page
      const allButtons = await page.locator('button').all();
      console.log(`\nFound ${allButtons.length} buttons on page:`);
      for (let i = 0; i < Math.min(15, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        const ariaLabel = await allButtons[i].getAttribute('aria-label');
        if (text?.trim() || ariaLabel) {
          console.log(`  Button ${i}: text="${text?.trim()}" aria="${ariaLabel || 'none'}"`);
        }
      }

      // Look for delete button
      const deleteBtn = await page.locator('button:has-text("Delete")').first();
      if (await deleteBtn.count() > 0) {
        console.log('\nFound Delete button!');
        console.log('\n=== TEST 13 RESULT: PASS - Delete button exists ===');
      } else {
        // Check if bulk delete with selection is the way
        console.log('\nNo standalone delete button. Checking for bulk delete with selection...');

        // Select the contact and check for delete option
        const checkbox = await page.locator('button[role="checkbox"]').first();
        if (await checkbox.count() > 0) {
          await checkbox.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'screenshots/test13_with_selection.png' });

          const deleteWithSelection = await page.locator('button:has-text("Delete")').first();
          if (await deleteWithSelection.count() > 0) {
            console.log('Delete button appears after selection');
            console.log('\n=== TEST 13 RESULT: PASS - Delete via selection ===');
          } else {
            console.log('Delete option not found even after selection');
            console.log('\n=== TEST 13 RESULT: NEEDS VERIFICATION ===');
          }
        }
      }
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test13_error.png' });
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
