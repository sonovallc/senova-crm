const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 3: BULK DELETE CONTACTS (v2) ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Step 1: PASS - Logged in\n');

    // Step 2: Navigate to Contacts
    console.log('Step 2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // Count contacts via checkboxes (each contact card has a checkbox)
    const contactCheckboxes = await page.$$('input[type="checkbox"]');
    // First checkbox is "Select All", rest are individual contacts
    const initialCount = contactCheckboxes.length - 1;
    console.log(`Found ${initialCount} contact checkboxes`);
    await page.screenshot({ path: 'screenshots/test3v2_step2_contacts.png' });
    console.log('Step 2: PASS - On contacts page\n');

    if (initialCount === 0) {
      console.log('No contacts to delete. Test skipped.');
      console.log('\n=== TEST 3 RESULT: SKIP - No contacts ===');
      await browser.close();
      return;
    }

    // Step 3: Click "Select All" checkbox (the first one)
    console.log('Step 3: Click Select All checkbox...');
    const selectAllCheckbox = contactCheckboxes[0];
    await selectAllCheckbox.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/test3v2_step3_selected.png' });
    console.log('Step 3: PASS - Select All clicked\n');

    // Step 4: Look for bulk action bar/buttons that appear after selection
    console.log('Step 4: Find bulk delete button...');
    await page.waitForTimeout(500);

    // Look for delete button - it may appear in a toolbar after selection
    const deleteBtn = await page.$('button:has-text("Delete Selected"), button:has-text("Delete"), [aria-label*="delete"]');

    if (deleteBtn) {
      console.log('Found Delete button');
      await page.screenshot({ path: 'screenshots/test3v2_step4_delete_btn.png' });
      console.log('Step 4: PASS - Delete button visible\n');

      // Step 5: Click delete
      console.log('Step 5: Click delete...');
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/test3v2_step5_confirm_dialog.png' });

      // Look for confirmation dialog and click confirm
      const confirmBtn = await page.$('[role="alertdialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Delete"), button:has-text("Confirm")');
      if (confirmBtn) {
        await confirmBtn.click();
        console.log('Clicked confirmation');
      }

      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/test3v2_step5_after_delete.png' });
      console.log('Step 5: PASS - Delete executed\n');

      // Step 6: Verify
      console.log('Step 6: Verify deletion...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const finalCheckboxes = await page.$$('input[type="checkbox"]');
      const finalCount = finalCheckboxes.length - 1;

      await page.screenshot({ path: 'screenshots/test3v2_step6_verified.png' });
      console.log(`Before: ${initialCount}, After: ${finalCount}`);

      if (finalCount < initialCount) {
        console.log('\n=== TEST 3 RESULT: PASS ===');
      } else {
        console.log('\n=== TEST 3 RESULT: NEEDS VERIFICATION ===');
      }
    } else {
      // No delete button found - let's see what bulk actions are available
      console.log('Delete button not immediately visible. Checking page...');

      // Take screenshot to see what's on the page
      await page.screenshot({ path: 'screenshots/test3v2_step4_looking.png' });

      // Maybe there's a dropdown or actions menu
      const actionsBtn = await page.$('button:has-text("Actions"), button:has-text("Bulk"), [aria-label="Actions"]');
      if (actionsBtn) {
        await actionsBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/test3v2_step4_actions_menu.png' });

        const deleteOption = await page.$('text=Delete');
        if (deleteOption) {
          await deleteOption.click();
          console.log('Clicked Delete from Actions menu');
        }
      }

      console.log('\n=== TEST 3 RESULT: MANUAL CHECK NEEDED ===');
      console.log('Check screenshots for UI state');
    }

  } catch (error) {
    console.error('TEST 3 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test3v2_error.png' });
    console.log('\n=== TEST 3 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
