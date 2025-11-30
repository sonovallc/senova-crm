const { chromium } = require('playwright');
const { execSync } = require('child_process');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== BUG #1 VERIFICATION: Contact Edit Persistence ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/bug001_1_login.png', fullPage: true });
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Login successful\n');

    // Step 2: Navigate to Contacts
    console.log('Step 2: Navigating to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug001_2_contacts_list.png', fullPage: true });
    console.log('✓ On Contacts page\n');

    // Step 3: Click first contact name to open detail page
    console.log('Step 3: Opening contact detail page...');
    const firstContactName = await page.locator('table tbody tr:first-child td:nth-child(2) a').first();
    const originalName = await firstContactName.textContent();
    console.log(`Original contact name: "${originalName}"`);
    
    await firstContactName.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001_3_contact_detail_before.png', fullPage: true });
    console.log('✓ Contact detail page opened\n');

    // Get the contact ID from URL for later return
    const currentURL = page.url();
    console.log(`Contact URL: ${currentURL}\n`);

    // Step 4: Click Edit button
    console.log('Step 4: Opening edit modal...');
    await page.click('button:has-text("Edit")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/bug001_4_edit_modal_open.png', fullPage: true });
    console.log('✓ Edit modal opened\n');

    // Step 5: Change first_name with timestamp
    console.log('Step 5: Changing first name...');
    const timestamp = Math.floor(Date.now() / 1000);
    const newFirstName = `EDITED_${timestamp}`;
    console.log(`New name will be: "${newFirstName}"`);
    
    const firstNameInput = await page.locator('input[name="first_name"]');
    await firstNameInput.fill('');
    await firstNameInput.fill(newFirstName);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/bug001_5_name_changed.png', fullPage: true });
    console.log('✓ First name changed in form\n');

    // Step 6: Click Update button
    console.log('Step 6: Clicking Update button...');
    await page.click('button:has-text("Update")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001_6_after_update.png', fullPage: true });
    
    // Check for success message
    const successVisible = await page.locator('text=/updated successfully/i').isVisible().catch(() => false);
    if (successVisible) {
      console.log('✓ Success message displayed\n');
    } else {
      console.log('⚠ No success message detected\n');
    }

    // Step 7: Close modal (if still open)
    console.log('Step 7: Closing modal...');
    const closeButton = await page.locator('button:has-text("Close"), button:has-text("Cancel")').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }
    console.log('✓ Modal closed\n');

    // Step 8: Navigate AWAY from contact (back to contacts list)
    console.log('Step 8: Navigating away to contacts list...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001_7_navigated_away.png', fullPage: true });
    console.log('✓ Navigated to contacts list\n');

    // Step 9: Return to the SAME contact detail page
    console.log('Step 9: Returning to contact detail page...');
    await page.goto(currentURL);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001_8_returned_to_contact.png', fullPage: true });
    console.log('✓ Returned to contact detail page\n');

    // Step 10: VERIFY the name persisted
    console.log('Step 10: VERIFYING name persistence...\n');
    
    // Check the name in the detail view
    const displayedName = await page.locator('h1, h2, .contact-name').first().textContent();
    console.log(`Displayed name: "${displayedName}"`);
    console.log(`Expected name: "${newFirstName}"`);
    
    const nameMatches = displayedName.includes(newFirstName);
    
    if (nameMatches) {
      console.log('\n✅ UI VERIFICATION PASSED: Name persisted after navigation!\n');
    } else {
      console.log('\n❌ UI VERIFICATION FAILED: Name reverted to original!\n');
    }

    // DATABASE VERIFICATION
    console.log('=== DATABASE VERIFICATION ===\n');
    console.log('Querying database for EDITED_ contacts...\n');
    
    const dbQuery = `docker exec eve_crm_postgres psql -U eve_crm_user -d eve_crm_db -c "SELECT first_name, last_name, updated_at FROM contacts WHERE first_name LIKE 'EDITED_%' ORDER BY updated_at DESC LIMIT 1;"`;
    
    try {
      const dbResult = execSync(dbQuery, { encoding: 'utf-8', cwd: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro' });
      console.log('Database query result:');
      console.log(dbResult);
      
      const dbContainsNewName = dbResult.includes(newFirstName);
      
      if (dbContainsNewName) {
        console.log('\n✅ DATABASE VERIFICATION PASSED: New name found in database!\n');
      } else {
        console.log('\n❌ DATABASE VERIFICATION FAILED: New name NOT in database!\n');
      }

      // FINAL VERDICT
      console.log('\n=== FINAL VERDICT ===\n');
      if (nameMatches && dbContainsNewName) {
        console.log('🎉 BUG #1 FIX VERIFIED: PASS');
        console.log('- UI shows updated name after navigation');
        console.log('- Database contains the updated name');
        console.log('- Changes persist correctly\n');
      } else {
        console.log('❌ BUG #1 FIX VERIFICATION: FAIL');
        if (!nameMatches) console.log('- UI name did NOT persist');
        if (!dbContainsNewName) console.log('- Database does NOT contain new name');
        console.log('');
      }
      
    } catch (dbError) {
      console.log('❌ Database query failed:');
      console.log(dbError.message);
    }

    await page.screenshot({ path: 'screenshots/bug001_9_final_verification.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error.message);
    await page.screenshot({ path: 'screenshots/bug001_ERROR.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
