const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  page.setDefaultTimeout(90000);
  const timestamp = Date.now();
  const testEmail = 'test_' + timestamp + '@test.com';
  const results = [];
  
  try {
    console.log('STEP 1: Login');
    const s1 = Date.now();
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test1_retest_01_dashboard.png', fullPage: true });
    results.push({ step: 1, desc: 'Login', status: 'PASS', time: ((Date.now()-s1)/1000).toFixed(1) });
    console.log('PASS\n');
    
    console.log('STEP 2: Navigate to Contacts');
    const s2 = Date.now();
    await page.click('a:has-text("Contacts")');
    await page.waitForURL('**/contacts', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test1_retest_02_contacts_page.png', fullPage: true });
    results.push({ step: 2, desc: 'Navigate to Contacts', status: 'PASS', time: ((Date.now()-s2)/1000).toFixed(1) });
    console.log('PASS\n');
    
    console.log('STEP 3: Open Add Contact Form');
    const s3 = Date.now();
    await page.click('button:has-text("Add Contact")');
    await page.waitForTimeout(2000);
    await page.waitForSelector('input[name="first_name"]', { state: 'visible', timeout: 90000 });
    await page.screenshot({ path: 'screenshots/test1_retest_03_add_form.png', fullPage: true });
    results.push({ step: 3, desc: 'Open Add Form', status: 'PASS', time: ((Date.now()-s3)/1000).toFixed(1) });
    console.log('PASS\n');
    
    console.log('STEP 4: Fill Contact Form');
    const s4 = Date.now();
    await page.fill('input[name="first_name"]', 'TestContact');
    await page.fill('input[name="last_name"]', 'Automated');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="company"]', 'Test Company Inc');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test1_retest_04_form_filled.png', fullPage: true });
    results.push({ step: 4, desc: 'Fill Form', status: 'PASS', time: ((Date.now()-s4)/1000).toFixed(1) });
    console.log('PASS - Email: ' + testEmail + '\n');
    
    console.log('STEP 5: Scroll and find Submit button');
    const s5 = Date.now();
    
    const modal = await page.locator('[role="dialog"]');
    console.log('  Modal found');
    
    await modal.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    console.log('  Scrolled modal to bottom');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'screenshots/test1_retest_05a_scrolled.png', fullPage: true });
    console.log('  Screenshot taken after scroll');
    
    const submitBtn = page.locator('[data-testid="contact-form-submit"]');
    const isVisible = await submitBtn.isVisible();
    console.log('  Submit button visible:', isVisible);
    
    if (isVisible) {
      await submitBtn.click();
      console.log('  Clicked submit button');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/test1_retest_05_submitted.png', fullPage: true });
      results.push({ step: 5, desc: 'Submit', status: 'PASS', time: ((Date.now()-s5)/1000).toFixed(1) });
      console.log('PASS\n');
    } else {
      console.log('  ERROR: Submit button not visible!');
      await page.screenshot({ path: 'screenshots/test1_retest_05_button_not_found.png', fullPage: true });
      results.push({ step: 5, desc: 'Submit', status: 'FAIL', time: ((Date.now()-s5)/1000).toFixed(1) });
      console.log('FAIL\n');
    }
    
    console.log('STEP 6: Verify Contact Created');
    const s6 = Date.now();
    const url = page.url();
    console.log('  Current URL:', url);
    const match = url.match(/\/contacts\/(\d+)/);
    let contactId = null;
    if (match) {
      contactId = match[1];
      console.log('  Contact ID:', contactId);
    }
    await page.screenshot({ path: 'screenshots/test1_retest_06_verified.png', fullPage: true });
    const verified = contactId !== null || url.includes('/contacts/');
    results.push({ step: 6, desc: 'Verify Created', status: verified ? 'PASS' : 'FAIL', time: ((Date.now()-s6)/1000).toFixed(1) });
    console.log((verified ? 'PASS' : 'FAIL') + '\n');
    
    console.log('='.repeat(80));
    console.log('TEST 1: CONTACT CREATION (RETEST) - FINAL REPORT');
    console.log('='.repeat(80));
    const allPass = results.every(r => r.status === 'PASS');
    console.log('Status: ' + (allPass ? 'PASS' : 'FAIL'));
    console.log('Timestamp:', new Date().toISOString());
    console.log('\nSteps Completed:');
    console.log('| Step | Description | Status | Time | Screenshot |');
    console.log('|------|-------------|--------|------|------------|');
    results.forEach(r => {
      const screenshot = 'test1_retest_0' + r.step + '_*.png';
      console.log('| ' + r.step + ' | ' + r.desc + ' | ' + r.status + ' | ' + r.time + 's | ' + screenshot + ' |');
    });
    console.log('\nContact Created:');
    if (contactId) console.log('- Contact ID:', contactId);
    console.log('- Email:', testEmail);
    console.log('\nOverall Result:');
    if (allPass) {
      console.log('PASS: All 6 steps completed successfully');
      console.log('The sticky button fix is working correctly!');
    } else {
      const fail = results.find(r => r.status === 'FAIL');
      console.log('FAIL: Step ' + fail.step + ' failed - ' + fail.desc);
    }
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test1_retest_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
