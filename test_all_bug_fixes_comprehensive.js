const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    test1: { name: 'Contact Edit Persistence', status: 'PENDING', details: [] },
    test2: { name: 'Template Body Population', status: 'PENDING', details: [] },
    test3: { name: 'Template Selection State', status: 'PENDING', details: [] },
    test4: { name: 'Campaign Wizard', status: 'PENDING', details: [] },
    test5: { name: 'Autoresponder Triggers', status: 'PENDING', details: [] },
    test6: { name: 'Autoresponder Template Dropdown', status: 'PENDING', details: [] },
    test7: { name: 'Sidebar Scrolling', status: 'PENDING', details: [] },
    test8: { name: 'Preview Contact Selector', status: 'PENDING', details: [] }
  };

  const timestamp = Date.now();

  try {
    console.log('Starting comprehensive bug fix testing...
');

    // LOGIN
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/bugfixes_00_login.png', fullPage: true });
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/bugfixes_00_dashboard.png', fullPage: true });
    console.log('Login successful
');

    // TEST 1: Contact Edit Persistence
    console.log('=== TEST 1: Contact Edit Persistence ===');
    try {
      await page.goto('http://localhost:3004/dashboard/contacts');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bugfixes_01_contacts_list.png', fullPage: true });
      
      const contactLink = await page.waitForSelector('a.text-blue-600', { timeout: 5000 });
      const contactHref = await contactLink.getAttribute('href');
      results.test1.details.push('Found contact link: ' + contactHref);
      
      await contactLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bugfixes_01_contact_detail.png', fullPage: true });
      
      const editButton = await page.waitForSelector('button:has-text("Edit")', { timeout: 5000 });
      results.test1.details.push('Edit button found');
      await editButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/bugfixes_01_edit_modal_open.png', fullPage: true });
      
      const testValue = 'TEST_EDIT_' + timestamp;
      const firstNameInput = await page.waitForSelector('input[name="first_name"]', { timeout: 5000 });
      await firstNameInput.fill('');
      await firstNameInput.fill(testValue);
      results.test1.details.push('Changed first_name to: ' + testValue);
      await page.screenshot({ path: 'screenshots/bugfixes_01_edited.png', fullPage: true });
      
      const updateButton = await page.waitForSelector('button:has-text("Update")', { timeout: 5000 });
      await updateButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bugfixes_01_after_update.png', fullPage: true });
      
      await page.goto('http://localhost:3004/dashboard');
      await page.waitForTimeout(1000);
      await page.goto('http://localhost:3004' + contactHref);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bugfixes_01_verify_persistence.png', fullPage: true });
      
      const pageContent = await page.content();
      if (pageContent.includes(testValue)) {
        results.test1.status = 'PASS';
        results.test1.details.push('✓ Name persisted correctly: ' + testValue);
      } else {
        results.test1.status = 'FAIL';
        results.test1.details.push('✗ Name did not persist');
      }
    } catch (error) {
      results.test1.status = 'FAIL';
      results.test1.details.push('ERROR: ' + error.message);
    }
    console.log('Result: ' + results.test1.status);
    console.log(results.test1.details.join('
') + '
');

    // ... continuing with other tests (truncated for brevity)
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
})();