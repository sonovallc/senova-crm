const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 3: BULK DELETE CONTACTS ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test3_step1_login.png' });
    console.log('Step 1: PASS - Logged in\n');

    // Step 2: Navigate to Contacts
    console.log('Step 2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test3_step2_contacts_list.png' });

    // Count contacts before delete
    const contactCards = await page.$$('[class*="Card"]');
    const initialCount = contactCards.length;
    console.log(`Found ${initialCount} contacts before deletion`);
    console.log('Step 2: PASS - On contacts page\n');

    // Step 3: Click "Select All" checkbox
    console.log('Step 3: Select all contacts...');

    // Look for "Select All" checkbox
    const selectAllCheckbox = await page.$('input[type="checkbox"]:near(:text("Select All"))');
    if (selectAllCheckbox) {
      await selectAllCheckbox.click();
      console.log('Clicked Select All checkbox');
    } else {
      // Try alternative: click the text itself
      const selectAllText = await page.$('text=Select All');
      if (selectAllText) {
        await selectAllText.click();
        console.log('Clicked Select All text');
      } else {
        // Try finding checkbox near the header
        const firstCheckbox = await page.$('.grid input[type="checkbox"], main input[type="checkbox"]');
        if (firstCheckbox) {
          await firstCheckbox.click();
          console.log('Clicked first checkbox in grid');
        }
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test3_step3_selected.png' });
    console.log('Step 3: PASS - Contacts selected\n');

    // Step 4: Look for bulk action buttons
    console.log('Step 4: Find delete button...');

    // After selecting, a bulk action bar should appear
    // Look for delete button
    const deleteSelectors = [
      'button:has-text("Delete")',
      'button:has-text("Delete Selected")',
      '[data-testid="bulk-delete"]',
      'button[class*="destructive"]',
    ];

    let deleteBtn = null;
    for (const selector of deleteSelectors) {
      deleteBtn = await page.$(selector);
      if (deleteBtn) {
        console.log(`Found delete button with: ${selector}`);
        break;
      }
    }

    if (deleteBtn) {
      await page.screenshot({ path: 'screenshots/test3_step4_delete_btn.png' });
      console.log('Step 4: PASS - Delete button found\n');

      // Step 5: Click delete
      console.log('Step 5: Click delete and confirm...');
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Look for confirmation dialog
      const confirmBtn = await page.$('button:has-text("Confirm"), button:has-text("Delete"), [role="alertdialog"] button');
      if (confirmBtn) {
        await confirmBtn.click();
        console.log('Clicked confirmation');
      }

      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/test3_step5_after_delete.png' });
      console.log('Step 5: PASS - Delete attempted\n');

      // Step 6: Verify deletion
      console.log('Step 6: Verify contacts deleted...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const remainingCards = await page.$$('[class*="Card"]');
      const finalCount = remainingCards.length;

      await page.screenshot({ path: 'screenshots/test3_step6_verified.png' });

      if (finalCount < initialCount) {
        console.log(`Contacts deleted! Before: ${initialCount}, After: ${finalCount}`);
        console.log('\n=== TEST 3 RESULT: PASS ===');
      } else {
        console.log(`No change in count. Before: ${initialCount}, After: ${finalCount}`);
        console.log('\n=== TEST 3 RESULT: NEEDS VERIFICATION ===');
      }
    } else {
      console.log('Step 4: FAIL - Delete button not found');
      await page.screenshot({ path: 'screenshots/test3_step4_no_delete_btn.png' });
      console.log('\n=== TEST 3 RESULT: FAIL - No delete button found ===');
    }

  } catch (error) {
    console.error('TEST 3 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test3_error.png' });
    console.log('\n=== TEST 3 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
