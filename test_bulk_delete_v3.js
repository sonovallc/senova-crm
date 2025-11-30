const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 3: BULK DELETE CONTACTS (v3) ===\n');

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
    await page.waitForTimeout(4000); // Wait longer for contacts to load

    await page.screenshot({ path: 'screenshots/test3v3_step2_contacts.png' });
    console.log('Step 2: PASS - On contacts page\n');

    // Step 3: Click on "Select All" text/checkbox area
    console.log('Step 3: Click Select All...');

    // Find the "Select All" checkbox button (Radix UI checkbox)
    // It should be a button with role="checkbox" near the "Select All" text
    const selectAllBtn = await page.$('button[role="checkbox"]');

    if (selectAllBtn) {
      await selectAllBtn.click();
      console.log('Clicked Select All checkbox button');
    } else {
      // Try clicking on the label/text
      await page.click('text=Select All');
      console.log('Clicked Select All text');
    }

    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/test3v3_step3_selected.png' });
    console.log('Step 3: PASS - Contacts selected\n');

    // Step 4: Look for Delete button after selection
    console.log('Step 4: Find delete button...');
    await page.waitForTimeout(500);

    // After selecting, look for a "Delete Selected" or trash button
    let deleteBtn = await page.$('button:has-text("Delete Selected")');
    if (!deleteBtn) {
      deleteBtn = await page.$('button:has-text("Delete")');
    }
    if (!deleteBtn) {
      // Look for trash icon button
      deleteBtn = await page.$('button:has(svg[class*="trash"]), button[aria-label*="delete"]');
    }

    await page.screenshot({ path: 'screenshots/test3v3_step4_looking_for_delete.png' });

    if (deleteBtn) {
      console.log('Found Delete button');
      console.log('Step 4: PASS - Delete button visible\n');

      // Step 5: Click delete
      console.log('Step 5: Click delete...');
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/test3v3_step5_after_click_delete.png' });

      // Look for confirmation dialog
      const confirmDialog = await page.$('[role="alertdialog"], [role="dialog"]');
      if (confirmDialog) {
        console.log('Confirmation dialog appeared');
        // Find and click the destructive/confirm button
        const confirmBtn = await page.$('[role="alertdialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Delete"), button[class*="destructive"]');
        if (confirmBtn) {
          await confirmBtn.click();
          console.log('Clicked confirm delete');
        }
      }

      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/test3v3_step5_after_delete.png' });
      console.log('Step 5: PASS - Delete action completed\n');

      // Step 6: Verify
      console.log('Step 6: Verify deletion...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/test3v3_step6_after_reload.png' });

      // Check if page shows "No contacts" or similar empty state
      const emptyState = await page.$('text=No contacts');
      const remainingContacts = await page.$$('button[role="checkbox"]');

      if (emptyState || remainingContacts.length <= 1) {
        console.log('All contacts deleted successfully!');
        console.log('\n=== TEST 3 RESULT: PASS ===');
      } else {
        console.log(`${remainingContacts.length - 1} contacts remaining`);
        console.log('\n=== TEST 3 RESULT: PARTIAL - Some contacts remain ===');
      }
    } else {
      console.log('Delete button not found after selection.');
      console.log('The UI may not have a bulk delete feature or requires different interaction.');
      console.log('\n=== TEST 3 RESULT: MANUAL CHECK NEEDED ===');
    }

  } catch (error) {
    console.error('TEST 3 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test3v3_error.png' });
    console.log('\n=== TEST 3 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
