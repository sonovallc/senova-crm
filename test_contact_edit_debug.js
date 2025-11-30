const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/contacts/') && request.method() === 'PUT') {
      console.log('\n=== PUT REQUEST ===');
      console.log('URL:', request.url());
      console.log('Payload:', JSON.stringify(request.postDataJSON(), null, 2));
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/contacts/') && response.request().method() === 'PUT') {
      console.log('\n=== PUT RESPONSE ===');
      console.log('Status:', response.status());
      try {
        const body = await response.json();
        console.log('Response body:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('Response body: (could not parse)');
      }
    }
  });

  console.log('=== TEST: CONTACT EDIT DEBUG ===\n');

  try {
    // Login
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Logged in\n');

    // Navigate to contacts
    console.log('Step 2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);
    console.log('On contacts page\n');

    // Click on the test contact
    console.log('Step 3: Click on contact...');
    const contactLink = await page.$('main a[href^="/dashboard/contacts/"]:not([href*="deleted"])');
    if (contactLink) {
      const href = await contactLink.getAttribute('href');
      console.log('Found contact link:', href);
      await contactLink.click();
    }
    await page.waitForTimeout(3000);
    console.log('Current URL:', page.url());

    // Click Edit button
    console.log('\nStep 4: Click Edit button...');
    const editButton = await page.$('button:has-text("Edit")');
    if (editButton) {
      await editButton.click();
      console.log('Clicked Edit button');
    }
    await page.waitForTimeout(2000);

    // Check current field values
    const firstName = await page.$eval('input[name="first_name"]', el => el.value).catch(() => 'N/A');
    const lastName = await page.$eval('input[name="last_name"]', el => el.value).catch(() => 'N/A');
    const company = await page.$eval('input[name="company"]', el => el.value).catch(() => 'N/A');
    console.log('\nCurrent values:');
    console.log('  first_name:', firstName);
    console.log('  last_name:', lastName);
    console.log('  company:', company);

    // Modify fields
    console.log('\nStep 5: Modify fields...');
    const timestamp = Date.now();
    const newFirstName = `DebugEdit_${timestamp}`;
    const newLastName = `TestLast_${timestamp}`;
    const newCompany = `DebugCompany_${timestamp}`;

    const firstNameInput = await page.$('input[name="first_name"]');
    if (firstNameInput) {
      await firstNameInput.click({ clickCount: 3 }); // Select all
      await firstNameInput.type(newFirstName);
    }

    const lastNameInput = await page.$('input[name="last_name"]');
    if (lastNameInput) {
      await lastNameInput.click({ clickCount: 3 }); // Select all
      await lastNameInput.type(newLastName);
    }

    const companyInput = await page.$('input[name="company"]');
    if (companyInput) {
      await companyInput.click({ clickCount: 3 }); // Select all
      await companyInput.type(newCompany);
    }

    console.log('New values set:');
    console.log('  first_name:', newFirstName);
    console.log('  last_name:', newLastName);
    console.log('  company:', newCompany);

    await page.screenshot({ path: 'screenshots/debug_before_save.png' });

    // Click Update button
    console.log('\nStep 6: Click Update button...');
    const submitBtn = await page.$('[data-testid="contact-form-submit"]');
    if (submitBtn) {
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click();
      console.log('Clicked Update button');
    }

    // Wait for API response
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'screenshots/debug_after_save.png' });

    console.log('\n=== DEBUG TEST COMPLETE ===');
    console.log('Check the PUT REQUEST and PUT RESPONSE above.');
    console.log('Look for the payload and response to see if data is being sent/received correctly.');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/debug_error.png' });
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
