const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = 'test_v4_' + timestamp + '@test.com';
  
  console.log('=== TEST 1: CONTACT CREATION (v4) ===');
  console.log('Test Email: ' + testEmail);
  console.log('');

  try {
    // Step 1: Login
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/test1_v4_01_login.png', fullPage: true });
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/test1_v4_01_dashboard.png', fullPage: true });
    console.log('✓ PASS - Login successful');

    // Step 2: Navigate to Contacts
    console.log('\nStep 2: Navigate to Contacts');
    await page.click('text=Contacts');
    await page.waitForURL('**/contacts', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test1_v4_02_contacts.png', fullPage: true });
    console.log('✓ PASS - Navigated to Contacts');

    // Step 3: Open Add Contact Form
    console.log('\nStep 3: Open Add Contact Form');
    await page.click('button:has-text("Add Contact")');
    await page.waitForSelector('[data-testid="contact-form-submit"]', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test1_v4_03_form.png', fullPage: true });
    console.log('✓ PASS - Form opened');

    // Step 4: Fill Form (using correct field names with underscores)
    console.log('\nStep 4: Fill Form');
    await page.fill('input[name="first_name"]', 'TestContactFinal');
    await page.fill('input[name="last_name"]', 'AutomatedV4');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="company"]', 'Test Company Final');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test1_v4_04_filled.png', fullPage: true });
    console.log('✓ PASS - Form filled');

    // Step 5: Submit Form
    console.log('\nStep 5: Submit Form');
    
    // Listen for network response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/contacts') && response.request().method() === 'POST',
      { timeout: 10000 }
    );
    
    await page.click('[data-testid="contact-form-submit"]');
    
    try {
      const response = await responsePromise;
      const status = response.status();
      console.log('API Response Status: ' + status);
      
      if (status === 201 || status === 200) {
        const responseBody = await response.json();
        console.log('API Response:', JSON.stringify(responseBody, null, 2));
      }
    } catch (e) {
      console.log('Could not capture API response: ' + e.message);
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test1_v4_05_submitted.png', fullPage: true });
    console.log('✓ PASS - Form submitted');

    // Step 6: Verify Contact Created
    console.log('\nStep 6: Verify Contact Created');
    
    // Check for success toast
    const successToast = await page.locator('text=Contact created successfully').count();
    const toastFound = successToast > 0;
    console.log('Success toast found: ' + (toastFound ? 'YES' : 'NO'));
    
    // Wait a bit for modal to close and list to refresh
    await page.waitForTimeout(2000);
    
    // Check if contact appears in list
    const contactInList = await page.locator('text=' + testEmail).count();
    const inListFound = contactInList > 0;
    console.log('Contact in list: ' + (inListFound ? 'YES' : 'NO'));
    
    await page.screenshot({ path: 'screenshots/test1_v4_06_verified.png', fullPage: true });
    
    if (toastFound || inListFound) {
      console.log('✓ PASS - Contact verified');
      console.log('\n=== TEST RESULT: PASS ===');
      console.log('Contact email: ' + testEmail);
    } else {
      console.log('✗ FAIL - Contact NOT verified');
      console.log('\n=== TEST RESULT: FAIL ===');
    }

  } catch (error) {
    console.error('\n✗ FAIL - ERROR: ' + error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'screenshots/test1_v4_error.png', fullPage: true });
    console.log('\n=== TEST RESULT: FAIL ===');
  } finally {
    await browser.close();
  }
})();
