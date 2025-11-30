const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  page.setDefaultTimeout(90000);
  
  const results = {
    testName: 'TEST 1: CONTACT CREATION',
    timestamp: new Date().toISOString(),
    startTime: Date.now(),
    steps: [],
    contactEmail: '',
    contactId: null
  };

  const timestamp = Date.now();
  const testEmail = `test_automated_${timestamp}@test.com`;
  results.contactEmail = testEmail;

  try {
    console.log('Step 1: Navigate and Login...');
    const step1Start = Date.now();
    
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.screenshot({ path: 'screenshots/test1_01_dashboard.png', fullPage: true });
    
    results.steps.push({
      step: 1,
      description: 'Login',
      status: 'PASS',
      time: ((Date.now() - step1Start) / 1000).toFixed(1) + 's',
      screenshot: 'test1_01_dashboard.png'
    });
    console.log('Step 1: PASS');

    console.log('Step 2: Navigate to Contacts...');
    const step2Start = Date.now();
    
    await page.click('a:has-text("Contacts"), button:has-text("Contacts")');
    await page.waitForURL('**/contacts', { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForSelector('text=Contacts', { timeout: 90000 });
    await page.screenshot({ path: 'screenshots/test1_02_contacts_page.png', fullPage: true });
    
    results.steps.push({
      step: 2,
      description: 'Navigate to Contacts',
      status: 'PASS',
      time: ((Date.now() - step2Start) / 1000).toFixed(1) + 's',
      screenshot: 'test1_02_contacts_page.png'
    });
    console.log('Step 2: PASS');

    console.log('Step 3: Open Add Contact Form...');
    const step3Start = Date.now();
    
    const addButton = await page.waitForSelector('button:has-text("Add Contact"), a:has-text("Add Contact"), button:has-text("New Contact"), a:has-text("New Contact")', { timeout: 90000 });
    await addButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test1_03_add_form.png', fullPage: true });
    
    results.steps.push({
      step: 3,
      description: 'Open Add Form',
      status: 'PASS',
      time: ((Date.now() - step3Start) / 1000).toFixed(1) + 's',
      screenshot: 'test1_03_add_form.png'
    });
    console.log('Step 3: PASS');

    console.log('Step 4: Fill Contact Form...');
    const step4Start = Date.now();
    
    await page.fill('input[name="firstName"], input[placeholder*="First"], input[id*="first"]', 'TestContact');
    await page.fill('input[name="lastName"], input[placeholder*="Last"], input[id*="last"]', 'Automated');
    await page.fill('input[name="email"], input[type="email"], input[placeholder*="email"]', testEmail);
    await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone"]', '+1234567890');
    await page.fill('input[name="company"], input[placeholder*="Company"], input[id*="company"]', 'Test Company Inc');
    await page.screenshot({ path: 'screenshots/test1_04_form_filled.png', fullPage: true });
    
    results.steps.push({
      step: 4,
      description: 'Fill Form',
      status: 'PASS',
      time: ((Date.now() - step4Start) / 1000).toFixed(1) + 's',
      screenshot: 'test1_04_form_filled.png'
    });
    console.log('Step 4: PASS');

    console.log('Step 5: Submit Form...');
    const step5Start = Date.now();
    
    const saveButton = await page.waitForSelector('button:has-text("Save"), button:has-text("Create"), button:has-text("Add Contact"), button[type="submit"]', { timeout: 90000 });
    await saveButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test1_05_submitted.png', fullPage: true });
    
    results.steps.push({
      step: 5,
      description: 'Submit',
      status: 'PASS',
      time: ((Date.now() - step5Start) / 1000).toFixed(1) + 's',
      screenshot: 'test1_05_submitted.png'
    });
    console.log('Step 5: PASS');

    console.log('Step 6: Verify Contact Created...');
    const step6Start = Date.now();
    
    let verified = false;
    let verificationMethod = '';
    
    const successMessage = await page.locator('text=/success|created|saved/i').first();
    if (await successMessage.count() > 0) {
      verified = true;
      verificationMethod = 'Success message detected';
    }
    
    const currentUrl = page.url();
    if (currentUrl.includes('/contacts/') && currentUrl !== 'http://localhost:3004/contacts') {
      verified = true;
      verificationMethod = 'Redirected to contact detail page';
      const match = currentUrl.match(/\/contacts\/(\d+)/);
      if (match) {
        results.contactId = match[1];
      }
    }
    
    const contactInList = await page.locator(`text=${testEmail}`).first();
    if (await contactInList.count() > 0) {
      verified = true;
      verificationMethod = 'Contact appears in list';
    }
    
    await page.screenshot({ path: 'screenshots/test1_06_verified.png', fullPage: true });
    
    results.steps.push({
      step: 6,
      description: 'Verify Created',
      status: verified ? 'PASS' : 'FAIL',
      time: ((Date.now() - step6Start) / 1000).toFixed(1) + 's',
      screenshot: 'test1_06_verified.png',
      verificationMethod: verificationMethod
    });
    console.log('Step 6: ' + (verified ? 'PASS' : 'FAIL') + ' - ' + verificationMethod);

    results.overallStatus = verified ? 'PASS' : 'FAIL';
    results.duration = ((Date.now() - results.startTime) / 1000).toFixed(1) + 's';

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    results.overallStatus = 'FAIL';
    results.error = error.message;
    results.duration = ((Date.now() - results.startTime) / 1000).toFixed(1) + 's';
    
    try {
      await page.screenshot({ path: 'screenshots/test1_ERROR.png', fullPage: true });
    } catch (e) {
      console.error('Could not take error screenshot:', e.message);
    }
  } finally {
    await browser.close();
    console.log('\n=== TEST RESULTS JSON ===');
    console.log(JSON.stringify(results, null, 2));
  }
})();
