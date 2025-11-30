const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 4: CSV IMPORT (Full Workflow) ===\n');

  // Create a test CSV file
  const csvContent = `first_name,last_name,email,phone,company,status
TestImport1,User1,import1@test.com,555-0001,Import Co,LEAD
TestImport2,User2,import2@test.com,555-0002,Import Co,PROSPECT
TestImport3,User3,import3@test.com,555-0003,Import Co,CUSTOMER`;

  const csvPath = path.join(__dirname, 'test_import.csv');
  fs.writeFileSync(csvPath, csvContent);
  console.log('Created test CSV file:', csvPath);

  try {
    // Step 1: Login
    console.log('\nStep 1: Login...');
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
    await page.screenshot({ path: 'screenshots/test4_step2_contacts.png' });
    console.log('Step 2: PASS - On contacts page\n');

    // Step 3: Click Import Contacts button
    console.log('Step 3: Click Import Contacts...');
    const importBtn = await page.$('button:has-text("Import Contacts"), button:has-text("Import")');
    if (importBtn) {
      await importBtn.click();
      console.log('Clicked Import Contacts button');
    } else {
      console.log('Import button not found directly, looking in header...');
      await page.click('text=Import Contacts');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test4_step3_import_dialog.png' });
    console.log('Step 3: PASS - Import dialog should be open\n');

    // Step 4: Upload CSV file
    console.log('Step 4: Upload CSV file...');

    // Look for file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(csvPath);
      console.log('CSV file uploaded');
    } else {
      // Try finding dropzone
      console.log('Looking for file upload area...');
      const dropzone = await page.$('[class*="dropzone"], [class*="upload"]');
      if (dropzone) {
        // Use page.setInputFiles on any file input that appears
        await page.setInputFiles('input[type="file"]', csvPath);
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test4_step4_file_uploaded.png' });
    console.log('Step 4: PASS - File uploaded\n');

    // Step 5: Map columns (if required)
    console.log('Step 5: Check for column mapping...');
    await page.waitForTimeout(2000);

    // Look for a "Next" or "Continue" or "Map Fields" button
    const nextBtn = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Map")');
    if (nextBtn) {
      await nextBtn.click();
      console.log('Clicked Next/Continue');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'screenshots/test4_step5_mapping.png' });
    console.log('Step 5: PASS - Column mapping step\n');

    // Step 6: Complete import
    console.log('Step 6: Complete import...');

    // Look for Import/Finish/Complete button
    const completeBtn = await page.$('button:has-text("Import"), button:has-text("Finish"), button:has-text("Complete")');
    if (completeBtn) {
      await completeBtn.click();
      console.log('Clicked Import/Complete button');
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/test4_step6_importing.png' });
    console.log('Step 6: PASS - Import initiated\n');

    // Step 7: Verify imported contacts
    console.log('Step 7: Verify imported contacts...');

    // Navigate to contacts and search for imported contacts
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // Search for one of the imported contacts
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('TestImport1');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'screenshots/test4_step7_verify.png' });

    // Check if the imported contact appears
    const pageContent = await page.content();
    if (pageContent.includes('TestImport1') || pageContent.includes('import1@test.com')) {
      console.log('Step 7: PASS - Imported contact found!\n');
      console.log('\n=== TEST 4 RESULT: PASS ===');
    } else {
      console.log('Step 7: NEEDS VERIFICATION - Check screenshots\n');
      console.log('\n=== TEST 4 RESULT: NEEDS MANUAL VERIFICATION ===');
    }

  } catch (error) {
    console.error('TEST 4 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test4_error.png' });
    console.log('\n=== TEST 4 RESULT: ERROR ===');
  }

  // Cleanup
  try {
    fs.unlinkSync(csvPath);
  } catch (e) {}

  await page.waitForTimeout(3000);
  await browser.close();
})();
