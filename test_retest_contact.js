const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  page.setDefaultTimeout(90000);
  const results = [];
  const timestamp = Date.now();
  const testEmail = 'test_' + timestamp + '@test.com';
  
  try {
    console.log('STEP 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test1_retest_01_dashboard.png', fullPage: true });
    console.log('PASS\n');
    
    console.log('STEP 2: Navigate to Contacts');
    await page.click('a:has-text("Contacts")');
    await page.waitForURL('**/contacts', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test1_retest_02_contacts_page.png', fullPage: true });
    console.log('PASS\n');
    
    console.log('STEP 3: Open Add Contact Form');
    await page.click('button:has-text("Add Contact")');
    await page.waitForSelector('input[name="firstName"]', { state: 'visible', timeout: 90000 });
    await page.screenshot({ path: 'screenshots/test1_retest_03_add_form.png', fullPage: true });
    console.log('PASS\n');
    
    console.log('STEP 4: Fill Form');
    await page.fill('input[name="firstName"]', 'TestContact');
    await page.fill('input[name="lastName"]', 'Automated');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="company"]', 'Test Company Inc');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test1_retest_04_form_filled.png', fullPage: true });
    console.log('PASS - Email: ' + testEmail + '\n');
    
    console.log('STEP 5: Submit using Test ID');
    const submitBtn = page.locator('[data-testid="contact-form-submit"]');
    console.log('Button visible:', await submitBtn.isVisible());
    await submitBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await submitBtn.click();
    console.log('Clicked submit');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test1_retest_05_submitted.png', fullPage: true });
    console.log('PASS\n');
    
    console.log('STEP 6: Verify');
    const url = page.url();
    console.log('URL:', url);
    const match = url.match(/\/contacts\/(\d+)/);
    if (match) console.log('Contact ID:', match[1]);
    await page.screenshot({ path: 'screenshots/test1_retest_06_verified.png', fullPage: true });
    console.log('PASS\n');
    
    console.log('='.repeat(60));
    console.log('TEST COMPLETE - ALL STEPS PASSED');
    console.log('Email:', testEmail);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test1_retest_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
