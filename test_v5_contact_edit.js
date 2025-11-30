const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);

  const results = [];

  try {
    console.log('=== TEST 2: CONTACT EDIT - FULL WORKFLOW ===\n');

    // Step 1: Login
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v5edit_01_login.png', fullPage: true });
    console.log('  ✓ PASS - Logged in\n');
    results.push({ step: 'Step 1: Login', status: 'PASS', screenshot: 'v5edit_01_login.png' });

    // Step 2: Navigate to Contacts
    console.log('Step 2: Navigate to Contacts');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v5edit_02_contacts.png', fullPage: true });
    console.log('  ✓ PASS - On contacts page\n');
    results.push({ step: 'Step 2: Navigate to Contacts', status: 'PASS', screenshot: 'v5edit_02_contacts.png' });

    // Step 3: Click on a Contact Card to Open Detail
    console.log('Step 3: Click on Contact to View Details');
    
    // Find all contact name elements (bold text that's clickable)
    const contactName = await page.locator('text=/Test|Patricia|John|Debra|Katie|EDITED/').first();
    const nameText = await contactName.textContent();
    console.log(`  Clicking on contact: ${nameText}`);
    
    await contactName.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/v5edit_03_detail.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/contacts/') && !currentUrl.includes('/deleted')) {
      console.log('  ✓ PASS - Contact detail page opened\n');
      results.push({ step: 'Step 3: Click on Contact', status: 'PASS', screenshot: 'v5edit_03_detail.png', note: nameText });
    } else {
      throw new Error(`Unexpected URL: ${currentUrl}`);
    }

    // Step 4: Wait for Edit Form to Load
    console.log('Step 4: Wait for Edit Form');
    await page.waitForSelector('input[name="firstName"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v5edit_04_form.png', fullPage: true });
    
    const currentFirst = await page.inputValue('input[name="firstName"]');
    const currentLast = await page.inputValue('input[name="lastName"]');
    const currentCompany = await page.inputValue('input[name="company"]');
    
    console.log(`  Current values: "${currentFirst}" "${currentLast}" @ "${currentCompany}"`);
    console.log('  ✓ PASS - Edit form loaded\n');
    results.push({ step: 'Step 4: Edit Form Loaded', status: 'PASS', screenshot: 'v5edit_04_form.png', note: `${currentFirst} ${currentLast}` });

    // Step 5: Modify Contact Fields
    console.log('Step 5: Modify Contact Fields');
    await page.fill('input[name="firstName"]', 'EditTest');
    await page.fill('input[name="lastName"]', 'Modified');
    await page.fill('input[name="company"]', 'Updated Company Inc');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/v5edit_05_modified.png', fullPage: true });
    console.log('  Modified to: EditTest Modified @ Updated Company Inc');
    console.log('  ✓ PASS - Fields modified\n');
    results.push({ step: 'Step 5: Modify Fields', status: 'PASS', screenshot: 'v5edit_05_modified.png' });

    // Step 6: Save Changes
    console.log('Step 6: Save Changes');
    
    // Scroll to bottom to reveal submit button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Look for submit button
    const submitByTestId = await page.$('[data-testid="contact-form-submit"]');
    if (submitByTestId) {
      console.log('  Clicking submit button by test ID');
      await submitByTestId.click();
    } else {
      console.log('  Clicking first submit button');
      await page.click('button[type="submit"]');
    }
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/v5edit_06_saved.png', fullPage: true });
    
    const afterSaveUrl = page.url();
    console.log(`  After save URL: ${afterSaveUrl}`);
    console.log('  ✓ PASS - Save button clicked\n');
    results.push({ step: 'Step 6: Save Changes', status: 'PASS', screenshot: 'v5edit_06_saved.png' });

    // Step 7: Verify Changes Persisted
    console.log('Step 7: Verify Changes Persisted');
    
    // Navigate back to contacts list
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v5edit_07_verify.png', fullPage: true });
    
    // Check if EditTest Modified appears in the page
    const pageContent = await page.textContent('body');
    const foundEditTest = pageContent.includes('EditTest');
    const foundModified = pageContent.includes('Modified');
    
    if (foundEditTest && foundModified) {
      console.log('  ✓ PASS - Changes persisted! "EditTest Modified" found in contacts list\n');
      results.push({ step: 'Step 7: Verify Persistence', status: 'PASS', screenshot: 'v5edit_07_verify.png', note: 'Changes persisted' });
    } else {
      console.log('  ✗ FAIL - Changes NOT found in contacts list\n');
      results.push({ step: 'Step 7: Verify Persistence', status: 'FAIL', screenshot: 'v5edit_07_verify.png', note: 'Changes did NOT persist' });
    }

    // Print Results
    console.log('\n=== TEST 2: CONTACT EDIT - RESULTS ===\n');
    results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      console.log(`${icon} ${result.step}: ${result.status}`);
      console.log(`  Screenshot: screenshots/${result.screenshot}`);
      if (result.note) console.log(`  Note: ${result.note}`);
      console.log('');
    });
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const finalVerdict = failCount === 0 ? 'PASS' : 'FAIL';
    
    console.log(`=== SUMMARY: ${passCount} PASS, ${failCount} FAIL ===`);
    console.log(`=== FINAL VERDICT: ${finalVerdict} ===\n`);

  } catch (error) {
    console.error('\n✗✗✗ FATAL ERROR ✗✗✗');
    console.error(error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'screenshots/v5edit_error.png', fullPage: true });
    console.log('\n=== FINAL VERDICT: FAIL (ERROR) ===\n');
  } finally {
    await browser.close();
  }
})();
