/**
 * QUICK OBJECTS TEST - Check what's actually on the Objects page
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = './screenshots/objects-quick-test';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot: ${filepath}`);
  return filepath;
}

async function runTest() {
  console.log('Starting browser...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Set longer timeouts
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  try {
    // LOGIN
    console.log('1. Going to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    console.log('Login page loaded');
    await screenshot(page, '01-login');

    // Fill credentials
    console.log('2. Filling login form...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'D3n1w3n1!');
    await screenshot(page, '02-login-filled');

    // Submit
    console.log('3. Clicking login...');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log('Logged in, current URL:', page.url());
    await page.waitForTimeout(2000);
    await screenshot(page, '03-dashboard');

    // Navigate to Objects
    console.log('4. Looking for Objects in sidebar...');

    // Try clicking Objects link
    const objectsLink = await page.$('a[href*="/objects"], a:has-text("Objects")');
    if (objectsLink) {
      console.log('Found Objects link, clicking...');
      await objectsLink.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('Objects link not found, navigating directly...');
      await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    console.log('Current URL:', page.url());
    await screenshot(page, '04-objects-page');

    // Analyze what's on the page
    console.log('\n=== ANALYZING OBJECTS PAGE ===');

    // Check page title/heading
    const heading = await page.$eval('h1, h2, [class*="title"]', el => el.textContent).catch(() => 'Not found');
    console.log('Page heading:', heading);

    // Check for error messages
    const errorContent = await page.content();
    if (errorContent.includes('404') || errorContent.includes('Not Found')) {
      console.log('ERROR: Page shows 404');
    }
    if (errorContent.includes('error') && !errorContent.includes('no errors')) {
      console.log('WARNING: Page may contain errors');
    }

    // Check for Create button
    const createBtn = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), a:has-text("Create")');
    console.log('Create button:', createBtn ? 'FOUND' : 'NOT FOUND');

    // Check for table/list
    const table = await page.$('table');
    const grid = await page.$('[class*="grid"]');
    console.log('Table view:', table ? 'FOUND' : 'NOT FOUND');
    console.log('Grid view:', grid ? 'FOUND' : 'NOT FOUND');

    // If create button exists, click it
    if (createBtn) {
      console.log('\n5. Clicking Create button...');
      await createBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '05-create-form');
      console.log('Current URL after create:', page.url());

      // Analyze form fields
      console.log('\n=== ANALYZING CREATE FORM ===');
      const inputs = await page.$$('input, select, textarea');
      console.log(`Total form inputs: ${inputs.length}`);

      for (const input of inputs) {
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder');
        if (name || placeholder) {
          console.log(`  - ${name || 'unnamed'} (${type || 'text'}): ${placeholder || ''}`);
        }
      }

      // Try to fill the form
      console.log('\n6. Filling create form...');

      // Name field
      const nameField = await page.$('input[name="name"], input[id="name"], input[placeholder*="name" i]');
      if (nameField) {
        await nameField.fill('Playwright Test Object');
        console.log('Filled name field');
      }

      await screenshot(page, '06-form-filled');

      // Find save button
      const saveBtn = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      if (saveBtn) {
        console.log('7. Clicking Save...');
        await saveBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, '07-after-save');
        console.log('Current URL after save:', page.url());
      }
    }

    // Navigate back to list
    await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, '08-objects-list-final');

    // Check for objects in list
    const rows = await page.$$('table tbody tr');
    console.log(`\nObjects in list: ${rows.length}`);

    // If there's an object, click on it
    if (rows.length > 0) {
      console.log('\n8. Clicking first object...');
      const firstLink = await page.$('table tbody tr:first-child a');
      if (firstLink) {
        await firstLink.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '09-object-detail');

        // Check for tabs
        console.log('\n=== CHECKING OBJECT DETAIL TABS ===');
        const tabs = await page.$$('[role="tab"], [class*="tab"], button[class*="tab"]');
        console.log(`Tabs found: ${tabs.length}`);
        for (const tab of tabs) {
          const text = await tab.textContent();
          console.log(`  - Tab: ${text.trim()}`);
        }

        // Click Contacts tab if exists
        const contactsTab = await page.$('button:has-text("Contacts"), [role="tab"]:has-text("Contacts")');
        if (contactsTab) {
          await contactsTab.click();
          await page.waitForTimeout(1500);
          await screenshot(page, '10-contacts-tab');
          console.log('Clicked Contacts tab');
        }

        // Click Users tab if exists
        const usersTab = await page.$('button:has-text("Users"), [role="tab"]:has-text("Users")');
        if (usersTab) {
          await usersTab.click();
          await page.waitForTimeout(1500);
          await screenshot(page, '11-users-tab');
          console.log('Clicked Users tab');
        }
      }
    }

    // Check contacts page for object assignment
    console.log('\n9. Checking Contacts page for object assignment...');
    await page.goto(`${BASE_URL}/dashboard/contacts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, '12-contacts-page');

    const firstContact = await page.$('table tbody tr:first-child a');
    if (firstContact) {
      await firstContact.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '13-contact-detail');

      // Look for object assignment UI
      const objectUI = await page.$('[class*="object"], button:has-text("Object"), select[name*="object"]');
      console.log('Object assignment on contact page:', objectUI ? 'FOUND' : 'NOT FOUND');
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test error:', error.message);
    await screenshot(page, 'error-state');
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

runTest().catch(console.error);
