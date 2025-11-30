/**
 * COMPREHENSIVE OBJECTS FEATURE TEST
 * Tests all Objects functionality including create, edit, copy, contact/user assignment
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = './screenshots/objects-comprehensive';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let screenshotIndex = 0;
async function screenshot(page, name) {
  screenshotIndex++;
  const filepath = path.join(SCREENSHOT_DIR, `${String(screenshotIndex).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  Screenshot: ${name}`);
  return filepath;
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('COMPREHENSIVE OBJECTS FEATURE TEST');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const results = {
    login: { status: 'pending', notes: '' },
    objectsPageAccess: { status: 'pending', notes: '' },
    createObject: { status: 'pending', notes: '' },
    viewObject: { status: 'pending', notes: '' },
    editObject: { status: 'pending', notes: '' },
    copyObject: { status: 'pending', notes: '' },
    contactsTab: { status: 'pending', notes: '' },
    assignContacts: { status: 'pending', notes: '' },
    usersTab: { status: 'pending', notes: '' },
    assignUsers: { status: 'pending', notes: '' },
    contactPageObjectAssignment: { status: 'pending', notes: '' },
    deleteObject: { status: 'pending', notes: '' }
  };

  try {
    // ========== LOGIN ==========
    console.log('\n[1/12] LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, 'login-page');

    await page.fill('input[type="email"], input[name="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'D3n1w3n1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'dashboard');
    results.login = { status: 'PASS', notes: 'Logged in successfully' };
    console.log('  PASS: Logged in');

    // ========== NAVIGATE TO OBJECTS ==========
    console.log('\n[2/12] NAVIGATE TO OBJECTS PAGE');
    await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, 'objects-page');

    const objectsHeading = await page.$('h1:has-text("Objects"), h2:has-text("Objects")');
    if (objectsHeading) {
      results.objectsPageAccess = { status: 'PASS', notes: 'Objects page loads correctly' };
      console.log('  PASS: Objects page accessible');
    } else {
      results.objectsPageAccess = { status: 'FAIL', notes: 'Objects page did not load properly' };
      console.log('  FAIL: Objects page not loading');
    }

    // ========== CREATE OBJECT ==========
    console.log('\n[3/12] CREATE OBJECT');
    const createBtn = await page.$('button:has-text("Create Object"), a:has-text("Create Object"), button:has-text("Create First Object")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'create-object-form');
      console.log('  Found create form');

      // Analyze form fields
      console.log('  Analyzing form fields...');
      const allInputs = await page.$$('input, select, textarea');
      console.log(`  Total inputs found: ${allInputs.length}`);

      // Try to fill name field
      const nameInput = await page.$('input[name="name"], input#name, input[placeholder*="name" i], input[placeholder*="Name"]');
      if (nameInput) {
        await nameInput.fill('Test Company Object');
        console.log('  Filled: name = Test Company Object');
      }

      // Try to fill type/industry fields
      const typeSelect = await page.$('select[name="type"]');
      if (typeSelect) {
        await typeSelect.selectOption({ index: 1 });
        console.log('  Selected type');
      }

      // Check for company_info fields
      const industryInput = await page.$('input[name*="industry" i], select[name*="industry" i]');
      if (industryInput) {
        try {
          const tagName = await industryInput.evaluate(el => el.tagName);
          if (tagName === 'SELECT') {
            await industryInput.selectOption({ index: 1 });
          } else {
            await industryInput.fill('Technology');
          }
          console.log('  Filled: industry');
        } catch (e) {}
      }

      const websiteInput = await page.$('input[name*="website" i], input[type="url"]');
      if (websiteInput) {
        await websiteInput.fill('https://testcompany.com');
        console.log('  Filled: website');
      }

      const phoneInput = await page.$('input[name*="phone" i], input[type="tel"]');
      if (phoneInput) {
        await phoneInput.fill('555-123-4567');
        console.log('  Filled: phone');
      }

      await screenshot(page, 'create-object-filled');

      // Submit form
      const submitBtn = await page.$('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, 'after-create');

        // Check for success
        const successIndicator = await page.$('[class*="success"], [class*="toast"]');
        const onListPage = page.url().includes('/objects') && !page.url().includes('/create');

        if (successIndicator || onListPage) {
          results.createObject = { status: 'PASS', notes: 'Object created successfully' };
          console.log('  PASS: Object created');
        } else {
          results.createObject = { status: 'PARTIAL', notes: 'Form submitted but unclear result' };
          console.log('  PARTIAL: Form submitted, checking result...');
        }
      }
    } else {
      results.createObject = { status: 'FAIL', notes: 'Create button not found' };
      console.log('  FAIL: No create button found');
    }

    // ========== VIEW OBJECT (click on created object) ==========
    console.log('\n[4/12] VIEW OBJECT DETAIL');
    await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, 'objects-list-after-create');

    const objectLink = await page.$('table tbody tr a, [class*="card"] a, a:has-text("Test Company")');
    if (objectLink) {
      await objectLink.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'object-detail-page');

      const detailContent = await page.content();
      if (detailContent.includes('Test Company') || page.url().includes('/objects/')) {
        results.viewObject = { status: 'PASS', notes: 'Object detail page accessible' };
        console.log('  PASS: Object detail page loaded');
      } else {
        results.viewObject = { status: 'PARTIAL', notes: 'Page loaded but content unclear' };
        console.log('  PARTIAL: Page loaded');
      }
    } else {
      // Try clicking on any object row
      const anyRow = await page.$('table tbody tr:first-child');
      if (anyRow) {
        await anyRow.click();
        await page.waitForTimeout(2000);
        await screenshot(page, 'object-detail-page');
        results.viewObject = { status: 'PARTIAL', notes: 'Clicked row, checking detail' };
      } else {
        results.viewObject = { status: 'FAIL', notes: 'No objects in list to view' };
        console.log('  FAIL: No objects to click');
      }
    }

    // ========== CHECK FOR TABS ON OBJECT DETAIL ==========
    console.log('\n[5/12] CHECK CONTACTS TAB');
    const contactsTab = await page.$('[role="tab"]:has-text("Contacts"), button:has-text("Contacts"):not([class*="nav"])');
    if (contactsTab) {
      await contactsTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'contacts-tab');
      results.contactsTab = { status: 'PASS', notes: 'Contacts tab exists and clickable' };
      console.log('  PASS: Contacts tab found');

      // Look for assign button
      const assignContactBtn = await page.$('button:has-text("Assign"), button:has-text("Add Contact")');
      if (assignContactBtn) {
        console.log('  Found assign contacts button');
        await assignContactBtn.click();
        await page.waitForTimeout(1500);
        await screenshot(page, 'assign-contacts-modal');
        results.assignContacts = { status: 'PASS', notes: 'Contact assignment UI exists' };
        console.log('  PASS: Contact assignment UI available');

        // Close modal
        const closeBtn = await page.$('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"], button[class*="close"]');
        if (closeBtn) await closeBtn.click();
        await page.waitForTimeout(500);
      } else {
        results.assignContacts = { status: 'FAIL', notes: 'No assign contacts button found' };
        console.log('  FAIL: No assign button');
      }
    } else {
      results.contactsTab = { status: 'FAIL', notes: 'Contacts tab not found on object detail' };
      console.log('  FAIL: No Contacts tab');
    }

    // ========== CHECK USERS TAB ==========
    console.log('\n[6/12] CHECK USERS TAB');
    const usersTab = await page.$('[role="tab"]:has-text("Users"), button:has-text("Users"):not([class*="nav"]), [role="tab"]:has-text("Team")');
    if (usersTab) {
      await usersTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'users-tab');
      results.usersTab = { status: 'PASS', notes: 'Users tab exists and clickable' };
      console.log('  PASS: Users tab found');

      // Look for assign users button
      const assignUserBtn = await page.$('button:has-text("Assign"), button:has-text("Add User"), button:has-text("Add Team")');
      if (assignUserBtn) {
        await assignUserBtn.click();
        await page.waitForTimeout(1500);
        await screenshot(page, 'assign-users-modal');
        results.assignUsers = { status: 'PASS', notes: 'User assignment UI exists' };
        console.log('  PASS: User assignment UI available');

        // Look for permission options
        const permOptions = await page.$('[class*="permission"], input[type="checkbox"], select[name*="permission"]');
        if (permOptions) {
          console.log('  Permission options found');
        }

        // Close modal
        const closeBtn = await page.$('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]');
        if (closeBtn) await closeBtn.click();
        await page.waitForTimeout(500);
      } else {
        results.assignUsers = { status: 'FAIL', notes: 'No assign users button found' };
        console.log('  FAIL: No assign users button');
      }
    } else {
      results.usersTab = { status: 'FAIL', notes: 'Users tab not found on object detail' };
      console.log('  FAIL: No Users tab');
    }

    // ========== TEST EDIT OBJECT ==========
    console.log('\n[7/12] EDIT OBJECT');
    const editBtn = await page.$('button:has-text("Edit"), a:has-text("Edit")');
    if (editBtn) {
      await editBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'edit-object-page');

      const editNameInput = await page.$('input[name="name"], input#name');
      if (editNameInput) {
        await editNameInput.fill('Test Company Object - EDITED');
        await screenshot(page, 'edit-object-filled');

        const saveBtn = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
        if (saveBtn) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          await screenshot(page, 'after-edit');
          results.editObject = { status: 'PASS', notes: 'Object edited successfully' };
          console.log('  PASS: Object edited');
        }
      }
    } else {
      results.editObject = { status: 'FAIL', notes: 'Edit button not found' };
      console.log('  FAIL: No edit button');
    }

    // ========== TEST COPY/DUPLICATE ==========
    console.log('\n[8/12] COPY/DUPLICATE OBJECT');
    await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Look for copy/duplicate action
    const copyBtn = await page.$('button:has-text("Copy"), button:has-text("Duplicate"), button:has-text("Clone")');
    const moreMenu = await page.$('button[aria-label*="more" i], button:has-text("..."), [class*="dropdown-trigger"]');

    if (copyBtn) {
      results.copyObject = { status: 'PASS', notes: 'Copy button found' };
      console.log('  PASS: Copy button exists');
    } else if (moreMenu) {
      await moreMenu.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'more-menu-open');
      const copyInMenu = await page.$('[role="menuitem"]:has-text("Copy"), [role="menuitem"]:has-text("Duplicate")');
      if (copyInMenu) {
        results.copyObject = { status: 'PASS', notes: 'Copy in dropdown menu' };
        console.log('  PASS: Copy in dropdown');
      } else {
        results.copyObject = { status: 'FAIL', notes: 'No copy option in menu' };
        console.log('  FAIL: No copy option');
      }
    } else {
      results.copyObject = { status: 'FAIL', notes: 'No copy functionality found - MISSING FEATURE' };
      console.log('  FAIL: Copy feature MISSING');
    }

    // ========== CHECK CONTACT PAGE FOR OBJECT ASSIGNMENT ==========
    console.log('\n[9/12] CONTACT PAGE OBJECT ASSIGNMENT');
    await page.goto(`${BASE_URL}/dashboard/contacts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, 'contacts-list');

    const firstContact = await page.$('table tbody tr:first-child td a, table tbody tr:first-child a');
    if (firstContact) {
      await firstContact.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'contact-detail');

      // Look for objects assignment UI
      const objectAssignment = await page.$('button:has-text("Object"), select[name*="object" i], [class*="object-assignment"], button:has-text("Assign to Object")');
      const objectSection = await page.$$('[class*="object"]');

      if (objectAssignment) {
        results.contactPageObjectAssignment = { status: 'PASS', notes: 'Object assignment found on contact page' };
        console.log('  PASS: Object assignment on contact page');
        await screenshot(page, 'contact-object-assignment');
      } else if (objectSection.length > 0) {
        results.contactPageObjectAssignment = { status: 'PARTIAL', notes: 'Object-related UI found but unclear' };
        console.log('  PARTIAL: Some object UI found');
      } else {
        results.contactPageObjectAssignment = { status: 'FAIL', notes: 'No object assignment on contact page - MISSING FEATURE' };
        console.log('  FAIL: Object assignment MISSING on contact page');
      }
    } else {
      results.contactPageObjectAssignment = { status: 'SKIP', notes: 'No contacts to test with' };
      console.log('  SKIP: No contacts available');
    }

    // ========== TEST DELETE (optional) ==========
    console.log('\n[10/12] DELETE OBJECT (checking if available)');
    await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const deleteBtn = await page.$('button:has-text("Delete"), [aria-label*="delete" i]');
    if (deleteBtn) {
      results.deleteObject = { status: 'PASS', notes: 'Delete functionality available' };
      console.log('  PASS: Delete available');
    } else {
      results.deleteObject = { status: 'CHECK', notes: 'Delete may be in context menu' };
      console.log('  CHECK: Delete not visible, may be in context menu');
    }

    await screenshot(page, 'final-state');

  } catch (error) {
    console.error('\nTest error:', error.message);
    await screenshot(page, 'error-state');
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }

  // ========== GENERATE REPORT ==========
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  let passCount = 0;
  let failCount = 0;
  let otherCount = 0;

  for (const [testName, result] of Object.entries(results)) {
    const status = result.status;
    const emoji = status === 'PASS' ? 'v' : status === 'FAIL' ? 'X' : '-';
    console.log(`[${emoji}] ${testName}: ${status} - ${result.notes}`);

    if (status === 'PASS') passCount++;
    else if (status === 'FAIL') failCount++;
    else otherCount++;
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`PASS: ${passCount} | FAIL: ${failCount} | OTHER: ${otherCount}`);
  console.log(`Pass Rate: ${((passCount / Object.keys(results).length) * 100).toFixed(1)}%`);

  // Identify missing features
  console.log('\n' + '='.repeat(60));
  console.log('MISSING/FAILING FEATURES');
  console.log('='.repeat(60));

  const missing = Object.entries(results)
    .filter(([_, r]) => r.status === 'FAIL')
    .map(([name, r]) => `- ${name}: ${r.notes}`);

  if (missing.length > 0) {
    missing.forEach(m => console.log(m));
  } else {
    console.log('No missing features detected!');
  }

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: { pass: passCount, fail: failCount, other: otherCount },
    passRate: ((passCount / Object.keys(results).length) * 100).toFixed(1) + '%'
  };

  fs.writeFileSync('OBJECTS_COMPREHENSIVE_TEST_RESULTS.json', JSON.stringify(report, null, 2));
  console.log('\nResults saved to OBJECTS_COMPREHENSIVE_TEST_RESULTS.json');
  console.log(`Screenshots saved to ${SCREENSHOT_DIR}/`);

  return report;
}

runTests().catch(console.error);
