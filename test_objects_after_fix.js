/**
 * QUICK TEST: Objects after API fix
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = './screenshots/objects-after-fix';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
  console.log('Starting test after API fix...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"], input[name="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'D3n1w3n1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('   Logged in successfully');

    // 2. Navigate to Objects
    console.log('\n2. Navigating to Objects...');
    await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-objects-page.png`, fullPage: true });

    // 3. Check if objects are displayed
    console.log('\n3. Checking for objects in list...');
    const objectsContent = await page.content();
    const hasNoObjects = objectsContent.includes('No objects found');
    const hasObjects = await page.$('table tbody tr, [class*="card"]');

    if (hasNoObjects) {
      console.log('   No objects in list (expected if none created yet)');
    } else if (hasObjects) {
      console.log('   FOUND objects in list!');
    }

    // 4. Create a new object
    console.log('\n4. Creating a new object...');
    const createBtn = await page.$('button:has-text("Create Object"), button:has-text("Create First Object")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-create-form.png`, fullPage: true });

      // Fill form
      const nameInput = await page.$('input[id="name"], input[name="name"]');
      if (nameInput) {
        await nameInput.fill('Test Object After Fix - ' + Date.now());
        console.log('   Filled name field');
      }

      // Fill industry
      const industryInput = await page.$('input[id="industry"]');
      if (industryInput) {
        await industryInput.fill('Technology');
      }

      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-form-filled.png`, fullPage: true });

      // Submit
      const submitBtn = await page.$('button[type="submit"]:has-text("Create")');
      if (submitBtn) {
        await submitBtn.click();
        console.log('   Submitted form');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-create.png`, fullPage: true });
      }
    }

    // 5. Go back to list and check
    console.log('\n5. Checking objects list after create...');
    await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-list-after-create.png`, fullPage: true });

    const objectRows = await page.$$('table tbody tr');
    console.log(`   Objects in list: ${objectRows.length}`);

    // 6. If objects exist, click on one to view detail
    if (objectRows.length > 0) {
      console.log('\n6. Clicking on first object to view detail...');
      const firstLink = await page.$('table tbody tr:first-child a, table tbody tr:first-child td:first-child');
      if (firstLink) {
        await firstLink.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-object-detail.png`, fullPage: true });

        const currentUrl = page.url();
        console.log(`   Detail URL: ${currentUrl}`);

        // Check for tabs
        const tabs = await page.$$('[role="tab"], button[class*="tab"]');
        console.log(`   Found ${tabs.length} tabs on detail page`);

        for (const tab of tabs) {
          const text = await tab.textContent();
          console.log(`     - Tab: ${text.trim()}`);
        }

        // Look for Contacts tab
        const contactsTab = await page.$('[role="tab"]:has-text("Contacts"), button:has-text("Contacts")');
        if (contactsTab) {
          await contactsTab.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/07-contacts-tab.png`, fullPage: true });
          console.log('   Clicked Contacts tab');
        }

        // Look for Users tab
        const usersTab = await page.$('[role="tab"]:has-text("Users"), button:has-text("Users")');
        if (usersTab) {
          await usersTab.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/08-users-tab.png`, fullPage: true });
          console.log('   Clicked Users tab');
        }

        // Look for Edit button
        const editBtn = await page.$('button:has-text("Edit"), a:has-text("Edit")');
        if (editBtn) {
          console.log('   Edit button found');
        } else {
          console.log('   Edit button NOT found');
        }
      }
    }

    console.log('\n========================================');
    console.log('TEST COMPLETE');
    console.log('========================================');
    console.log(`Screenshots saved to ${SCREENSHOT_DIR}/`);

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png`, fullPage: true });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

runTest().catch(console.error);
