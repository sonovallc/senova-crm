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
    console.log(`\n=== ${currentStep} ===`);
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test_v5_step1_login.png', fullPage: true });
    console.log('✓ Login successful');
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step1_login.png' });

    // Step 2: Navigate to Contacts
    currentStep = 'Step 2: Navigate to Contacts';
    console.log(`\n=== ${currentStep} ===`);
    await page.click('a[href="/contacts"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test_v5_step2_contacts_list.png', fullPage: true });
    
    const contactRows = await page.locator('table tbody tr').count();
    console.log(`Found ${contactRows} contact rows`);
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step2_contacts_list.png', note: `${contactRows} contacts` });

    // Step 3: Click on Contact Name to View Details
    currentStep = 'Step 3: Click on Contact to View Details';
    console.log(`\n=== ${currentStep} ===`);
    
    const firstContactCell = page.locator('table tbody tr:first-child td:nth-child(2)');
    const contactName = await firstContactCell.textContent();
    console.log(`Clicking on contact: ${contactName}`);
    
    await firstContactCell.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/test_v5_step3_contact_detail.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step3_contact_detail.png', note: `Opened: ${contactName}` });

    // Step 4: Verify Edit Form is Open
    currentStep = 'Step 4: Open Edit Form';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.waitForSelector('input[name="firstName"]', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test_v5_step4_edit_form.png', fullPage: true });
    
    const firstName = await page.inputValue('input[name="firstName"]');
    const lastName = await page.inputValue('input[name="lastName"]');
    const company = await page.inputValue('input[name="company"]');
    console.log(`Current values - First: "${firstName}", Last: "${lastName}", Company: "${company}"`);
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step4_edit_form.png', note: `${firstName} ${lastName}` });

    // Step 5: Modify Contact Fields
    currentStep = 'Step 5: Modify Contact Fields';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.fill('input[name="firstName"]', 'EditTest');
    await page.fill('input[name="lastName"]', 'Modified');
    await page.fill('input[name="company"]', 'Updated Company Inc');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test_v5_step5_modified_fields.png', fullPage: true });
    
    console.log('✓ Fields modified: EditTest Modified @ Updated Company Inc');
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step5_modified_fields.png' });

    // Step 6: Save Changes
    currentStep = 'Step 6: Save Changes';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    const submitBtn = page.locator('[data-testid="contact-form-submit"]');
    const submitExists = await submitBtn.count();
    
    if (submitExists > 0) {
      console.log('Clicking submit button by test ID...');
      await submitBtn.click();
    } else {
      console.log('Clicking first submit button found...');
      await page.click('button[type="submit"]');
    }
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/test_v5_step6_save_complete.png', fullPage: true });
    
    const afterUrl = page.url();
    console.log(`After save URL: ${afterUrl}`);
    results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step6_save_complete.png' });

    // Step 7: Verify Changes Persisted
    currentStep = 'Step 7: Verify Changes Persisted';
    console.log(`\n=== ${currentStep} ===`);
    
    await page.click('a[href="/contacts"]');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/test_v5_step7_verify_persisted.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    const foundEditTest = pageText.includes('EditTest');
    const foundModified = pageText.includes('Modified');
    
    if (foundEditTest && foundModified) {
      console.log('✓ SUCCESS: EditTest Modified found in contacts list');
      results.push({ step: currentStep, status: 'PASS', screenshot: 'test_v5_step7_verify_persisted.png', note: 'Changes persisted!' });
    } else {
      console.log('✗ FAIL: EditTest Modified NOT found in contacts list');
      results.push({ step: currentStep, status: 'FAIL', screenshot: 'test_v5_step7_verify_persisted.png', note: 'Changes did NOT persist' });
    }

    // Print Final Results
    console.log('\n\n--- TEST 2: CONTACT EDIT - FINAL RESULTS ---\n');
    
    results.forEach((result) => {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      console.log(`${icon} ${result.step}: ${result.status}`);
      console.log(`  Screenshot: screenshots/${result.screenshot}`);
      if (result.note) console.log(`  Note: ${result.note}`);
      if (result.error) console.log(`  Error: ${result.error}`);
      console.log('');
    });
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const finalVerdict = failCount === 0 ? 'PASS' : 'FAIL';
    
    console.log(`--- SUMMARY: ${passCount} PASS, ${failCount} FAIL ---`);
    console.log(`--- FINAL VERDICT: ${finalVerdict} ---\n`);

  } catch (error) {
    console.error(`\n✗✗✗ CRITICAL ERROR in ${currentStep} ✗✗✗`);
    console.error(error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'screenshots/test_v5_error.png', fullPage: true });
    results.push({ step: currentStep, status: 'FAIL', error: error.message });
    
    console.log(`\n--- FINAL VERDICT: FAIL (ERROR) ---\n`);
  } finally {
    await browser.close();
  }
})();
