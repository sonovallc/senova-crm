const { chromium } = require('playwright');
const { execSync } = require('child_process');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const screenshotPath = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';

  try {
    console.log('=== BUG #1 VERIFICATION: Contact Edit Persistence ===\n');

    // Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: `${screenshotPath}/bug001_1_login.png`, fullPage: true });
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('OK Login successful\n');

    // Navigate to Contacts
    console.log('Step 2: Navigating to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotPath}/bug001_2_contacts.png`, fullPage: true });
    console.log('OK On Contacts page\n');

    // Click first contact
    console.log('Step 3: Opening contact detail...');
    const firstContact = await page.locator('a[href*="/dashboard/contacts/"]').first();
    const originalName = await firstContact.textContent();
    console.log(`Original name: "${originalName}"`);
    await firstContact.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotPath}/bug001_3_detail_before.png`, fullPage: true });
    const contactURL = page.url();
    console.log(`Contact URL: ${contactURL}\n`);

    // Open edit modal
    console.log('Step 4: Opening edit modal...');
    await page.click('button:has-text("Edit")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotPath}/bug001_4_edit_open.png`, fullPage: true });
    console.log('OK Edit modal opened\n');

    // Change name
    console.log('Step 5: Changing first name...');
    const timestamp = Math.floor(Date.now() / 1000);
    const newName = `EDITED_${timestamp}`;
    console.log(`New name: "${newName}"`);
    const nameInput = await page.locator('input[name="first_name"]');
    await nameInput.fill('');
    await nameInput.fill(newName);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotPath}/bug001_5_name_changed.png`, fullPage: true });
    console.log('OK Name changed in form\n');

    // Click Update
    console.log('Step 6: Clicking Update...');
    await page.click('button:has-text("Update")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotPath}/bug001_6_after_update.png`, fullPage: true });
    const hasSuccess = await page.locator('text=/updated successfully/i').isVisible().catch(() => false);
    console.log(hasSuccess ? 'OK Success message shown\n' : 'WARN No success message\n');

    // Close modal
    console.log('Step 7: Closing modal...');
    const closer = await page.locator('button:has-text("Close"), button:has-text("Cancel")').first();
    if (await closer.isVisible().catch(() => false)) {
      await closer.click();
      await page.waitForTimeout(1000);
    }
    console.log('OK Modal closed\n');

    // Navigate away
    console.log('Step 8: Navigating away...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotPath}/bug001_7_away.png`, fullPage: true });
    console.log('OK Navigated to contacts list\n');

    // Return to contact
    console.log('Step 9: Returning to contact...');
    await page.goto(contactURL);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotPath}/bug001_8_returned.png`, fullPage: true });
    console.log('OK Returned to contact\n');

    // Verify UI
    console.log('Step 10: VERIFYING persistence...\n');
    const bodyText = await page.locator('body').textContent();
    const nameInUI = bodyText.includes(newName);
    console.log(`UI contains "${newName}": ${nameInUI}`);
    
    if (nameInUI) {
      console.log('\nPASS UI VERIFICATION: Name persisted!\n');
    } else {
      console.log('\nFAIL UI VERIFICATION: Name did NOT persist!\n');
      console.log('Page text sample:', bodyText.substring(0, 500));
    }

    // Verify database
    console.log('=== DATABASE VERIFICATION ===\n');
    const dbCmd = 'docker exec eve_crm_postgres psql -U eve_crm_user -d eve_crm_db -c "SELECT first_name, last_name, updated_at FROM contacts WHERE first_name LIKE \'EDITED_%\' ORDER BY updated_at DESC LIMIT 1;"';
    
    try {
      const dbResult = execSync(dbCmd, { 
        encoding: 'utf-8', 
        cwd: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro' 
      });
      console.log('Database query result:');
      console.log(dbResult);
      
      const nameInDB = dbResult.includes(newName);
      console.log(`\nDB contains "${newName}": ${nameInDB}`);
      
      if (nameInDB) {
        console.log('\nPASS DATABASE VERIFICATION: Name in database!\n');
      } else {
        console.log('\nFAIL DATABASE VERIFICATION: Name NOT in database!\n');
      }

      // Final verdict
      console.log('\n=== FINAL VERDICT ===\n');
      if (nameInUI && nameInDB) {
        console.log('SUCCESS BUG #1 FIX VERIFIED: PASS');
        console.log('- UI shows updated name after navigation');
        console.log('- Database contains the updated name');
        console.log('- Changes persist correctly\n');
      } else {
        console.log('FAILURE BUG #1 FIX VERIFICATION: FAIL');
        if (!nameInUI) console.log('- UI name did NOT persist');
        if (!nameInDB) console.log('- Database does NOT contain new name');
        console.log('');
      }
      
    } catch (dbError) {
      console.log('ERROR Database query failed:');
      console.log(dbError.message);
    }

    await page.screenshot({ path: `${screenshotPath}/bug001_9_final.png`, fullPage: true });
    
  } catch (error) {
    console.error('\nERROR TEST FAILED:');
    console.error(error.message);
    await page.screenshot({ path: `${screenshotPath}/bug001_ERROR.png`, fullPage: true });
  } finally {
    await browser.close();
  }
})();
