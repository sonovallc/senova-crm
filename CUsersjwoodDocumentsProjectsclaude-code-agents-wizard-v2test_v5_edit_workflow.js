const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = [];
  let currentStep = '';

  try {
    // Step 1: Login
    currentStep = 'Step 1: Login';
    console.log(`\n${currentStep}`);
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.screenshot({ path: 'screenshots/test_v5_step1_login.png', fullPage: true });
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step1_login.png' });
    console.log('✓ Login successful');

    // Step 2: Navigate to Contacts
    currentStep = 'Step 2: Navigate to Contacts';
    console.log(`\n${currentStep}`);
    await page.click('a[href="/contacts"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test_v5_step2_contacts_list.png', fullPage: true });
    
    const contactCount = await page.locator('table tbody tr').count();
    console.log(`Found ${contactCount} contacts`);
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step2_contacts_list.png', note: `${contactCount} contacts found` });

    // Step 3: Click on Contact to View Details
    currentStep = 'Step 3: Click on Contact to View Details';
    console.log(`\n${currentStep}`);
    
    // Click the first contact row
    await page.click('table tbody tr:first-child td:first-child');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test_v5_step3_contact_detail.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step3_contact_detail.png', note: `URL: ${currentUrl}` });

    // Step 4: Open Edit Form
    currentStep = 'Step 4: Open Edit Form';
    console.log(`\n${currentStep}`);
    
    // Check if we're already in edit mode or need to click Edit button
    const editButton = await page.locator('button:has-text("Edit")').count();
    if (editButton > 0) {
      console.log('Edit button found, clicking...');
      await page.click('button:has-text("Edit")');
      await page.waitForTimeout(2000);
    } else {
      console.log('Already in edit form view');
    }
    
    await page.screenshot({ path: 'screenshots/test_v5_step4_edit_form.png', fullPage: true });
    
    // Get current values
    const currentFirstName = await page.inputValue('input[name="firstName"]');
    const currentLastName = await page.inputValue('input[name="lastName"]');
    const currentCompany = await page.inputValue('input[name="company"]');
    console.log(`Current values - First: ${currentFirstName}, Last: ${currentLastName}, Company: ${currentCompany}`);
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step4_edit_form.png', note: `Current: ${currentFirstName} ${currentLastName}` });

    // Step 5: Modify Contact Fields
    currentStep = 'Step 5: Modify Contact Fields';
    console.log(`\n${currentStep}`);
    
    await page.fill('input[name="firstName"]', 'EditTest');
    await page.fill('input[name="lastName"]', 'Modified');
    await page.fill('input[name="company"]', 'Updated Company Inc');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test_v5_step5_modified_fields.png', fullPage: true });
    
    console.log('✓ Fields modified to: EditTest Modified, Updated Company Inc');
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step5_modified_fields.png' });

    // Step 6: Save Changes
    currentStep = 'Step 6: Save Changes';
    console.log(`\n${currentStep}`);
    
    // Scroll to bottom to ensure submit button is visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Try to find and click the submit button
    const submitButton = await page.locator('[data-testid="contact-form-submit"]').count();
    if (submitButton > 0) {
      console.log('Found submit button by test ID');
      await page.click('[data-testid="contact-form-submit"]');
    } else {
      console.log('Looking for Save/Update button');
      await page.click('button[type="submit"]');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test_v5_step6_save_complete.png', fullPage: true });
    
    const afterSaveUrl = page.url();
    console.log(`After save URL: ${afterSaveUrl}`);
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step6_save_complete.png', note: `URL: ${afterSaveUrl}` });

    // Step 7: Verify Changes Persisted
    currentStep = 'Step 7: Verify Changes Persisted';
    console.log(`\n${currentStep}`);
    
    // Navigate back to contacts list
    await page.click('a[href="/contacts"]');
    await page.waitForTimeout(3000);
    
    // Look for the edited contact
    const pageContent = await page.content();
    const hasEditTest = pageContent.includes('EditTest');
    const hasModified = pageContent.includes('Modified');
    
    await page.screenshot({ path: 'screenshots/test_v5_step7_verify_persisted.png', fullPage: true });
    
    if (hasEditTest && hasModified) {
      console.log('✓ Changes verified - "EditTest Modified" found in contacts list');
      results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step7_verify_persisted.png', note: 'EditTest Modified found in list' });
    } else {
      console.log('✗ Changes NOT found in contacts list');
      results.push({ step: currentStep, status: 'FAIL', screenshot: 'test_v5_step7_verify_persisted.png', note: 'EditTest Modified NOT found' });
    }

    // Final Summary
    console.log('\n=== TEST 2: CONTACT EDIT - FINAL RESULTS ===');
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    
    results.forEach((result, index) => {
      console.log(`\n${result.step}: ${result.status}`);
      console.log(`  Screenshot: screenshots/${result.screenshot}`);
      if (result.note) console.log(`  Note: ${result.note}`);
    });
    
    console.log(`\n=== SUMMARY: ${passCount} PASS, ${failCount} FAIL ===`);
    const finalVerdict = failCount === 0 ? 'PASS' : 'FAIL';
    console.log(`\nFINAL VERDICT: ${finalVerdict}`);

  } catch (error) {
    console.error(`\n✗ ERROR in ${currentStep}:`, error.message);
    await page.screenshot({ path: `screenshots/test_v5_error_${Date.now()}.png`, fullPage: true });
    results.push({ step: currentStep, status: 'FAIL', error: error.message });
    console.log('\nFINAL VERDICT: FAIL');
  } finally {
    await browser.close();
  }
})();
