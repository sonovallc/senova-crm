const { chromium } = require('playwright');

(async () => {
  console.log('=== FULL CONTACT EDIT WORKFLOW TEST ===\n');

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
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('  ✓ Login successful\n');

    // Step 2: Navigate to Contacts
    console.log('Step 2: Navigating to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v5-full-01-contacts-list.png' });
    console.log('  ✓ Contacts page loaded');
    console.log('  Screenshot: v5-full-01-contacts-list.png\n');

    // Step 3: Click on contact name (should be blue link now)
    console.log('Step 3: Clicking on contact name link...');
    const contactLink = await page.locator('a[href*="/dashboard/contacts/"]').first();

    if (await contactLink.count() === 0) {
      throw new Error('No contact links found! Names are not clickable.');
    }

    const href = await contactLink.getAttribute('href');
    const contactName = await contactLink.textContent();
    console.log('  Found contact:', contactName);
    console.log('  Link href:', href);

    // Click and wait for navigation
    await Promise.all([
      page.waitForURL('**/dashboard/contacts/**', { timeout: 10000 }),
      contactLink.click()
    ]);

    await page.waitForTimeout(2000);
    const detailUrl = page.url();
    console.log('  ✓ Navigated to:', detailUrl);
    await page.screenshot({ path: 'screenshots/v5-full-02-detail-page.png' });
    console.log('  Screenshot: v5-full-02-detail-page.png\n');

    // Step 4: Look for Edit button
    console.log('Step 4: Looking for Edit button...');
    const editButton = await page.locator('button:has-text("Edit")').first();

    if (await editButton.count() === 0) {
      console.log('  ✗ No Edit button found!');
      // List all buttons
      const buttons = await page.locator('button').all();
      console.log('  Available buttons:');
      for (const btn of buttons.slice(0, 10)) {
        const text = await btn.textContent();
        console.log('    -', text?.trim());
      }
    } else {
      console.log('  ✓ Edit button found!');
      await page.screenshot({ path: 'screenshots/v5-full-03-edit-button.png' });
      console.log('  Screenshot: v5-full-03-edit-button.png\n');

      // Step 5: Click Edit button
      console.log('Step 5: Clicking Edit button...');
      await editButton.click();
      await page.waitForTimeout(3000);

      const afterEditUrl = page.url();
      console.log('  URL after Edit click:', afterEditUrl);
      await page.screenshot({ path: 'screenshots/v5-full-04-after-edit-click.png' });

      // Check for modal
      const modal = await page.locator('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="DialogContent"]').first();
      if (await modal.count() > 0) {
        console.log('  ✓ Edit modal opened!');
        await page.screenshot({ path: 'screenshots/v5-full-05-edit-modal.png' });
        console.log('  Screenshot: v5-full-05-edit-modal.png\n');

        // Step 6: Modify a field
        console.log('Step 6: Modifying last name field...');
        const lastNameInput = await page.locator('input[name="last_name"], input[id*="last"]').first();

        if (await lastNameInput.count() > 0) {
          const currentValue = await lastNameInput.inputValue();
          console.log('  Current value:', currentValue);

          const newValue = currentValue.includes('EDITED')
            ? currentValue.replace(' EDITED', '')
            : currentValue + ' EDITED';

          await lastNameInput.fill(newValue);
          console.log('  New value:', newValue);
          await page.screenshot({ path: 'screenshots/v5-full-06-field-modified.png' });
          console.log('  ✓ Field modified\n');

          // Step 7: Click Save/Update
          console.log('Step 7: Clicking Save/Update...');
          const saveButton = await page.locator('button:has-text("Update"), button:has-text("Save"), button[type="submit"]:has-text("Update")').first();

          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'screenshots/v5-full-07-after-save.png' });
            console.log('  ✓ Save clicked');
            console.log('  Screenshot: v5-full-07-after-save.png\n');

            // Check for success toast
            const toast = await page.locator('[class*="toast"], [class*="Toast"], [role="status"]').first();
            if (await toast.count() > 0) {
              const toastText = await toast.textContent();
              console.log('  Toast message:', toastText);
            }
          } else {
            console.log('  ✗ No Save/Update button found');
          }
        } else {
          console.log('  ✗ Last name input not found');
          // List all inputs
          const inputs = await page.locator('input').all();
          console.log('  Inputs found:', inputs.length);
          for (const inp of inputs.slice(0, 10)) {
            const name = await inp.getAttribute('name');
            const id = await inp.getAttribute('id');
            console.log('    - name:', name, 'id:', id);
          }
        }
      } else {
        console.log('  ✗ No modal opened after clicking Edit');
      }
    }

    // Final verification
    console.log('\n=== TEST COMPLETE ===');
    await page.screenshot({ path: 'screenshots/v5-full-08-final.png' });

  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/v5-full-error.png' });
  } finally {
    await browser.close();
  }
})();
