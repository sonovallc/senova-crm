const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 9: CAMPAIGN WIZARD DEBUG ===\n');

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('filter-contacts') || request.url().includes('campaign')) {
      console.log(`>> REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('filter-contacts')) {
      console.log(`<< RESPONSE: ${response.status()} ${response.url()}`);
      try {
        const body = await response.json();
        console.log(`   Response body: ${JSON.stringify(body)}`);
      } catch (e) {
        console.log(`   Response body: (not JSON)`);
      }
    }
  });

  try {
    // Step 1: Login
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Step 1: PASS - Logged in\n');

    // Step 2: Navigate to Campaigns
    console.log('Step 2: Navigate to Campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 90000 });
    await page.waitForTimeout(3000);
    console.log('Step 2: PASS\n');

    // Step 3: Click Create Campaign
    console.log('Step 3: Click Create Campaign...');
    const createBtn = await page.$('button:has-text("Create Campaign")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(3000);
    }
    console.log('Step 3: PASS - On create page\n');

    // Step 4: Fill Step 1
    console.log('Step 4: Fill Step 1 details...');
    const timestamp = Date.now();

    const nameInput = await page.$('input[id="name"], input[name="name"]');
    if (nameInput) {
      await nameInput.fill(`TestCampaign_${timestamp}`);
    }

    const subjectInput = await page.$('input[id="subject"], input[name="subject"]');
    if (subjectInput) {
      await subjectInput.fill(`Test Subject ${timestamp}`);
    }

    const editor = await page.$('.tiptap, [contenteditable="true"]');
    if (editor) {
      await editor.click();
      await page.keyboard.type('This is test campaign content.');
    }

    await page.screenshot({ path: 'screenshots/test9_debug_step1.png' });
    console.log('Step 4: PASS\n');

    // Step 5: Click Next
    console.log('Step 5: Click Next to go to Step 2 (Recipients)...');
    const nextBtn = await page.$('button:has-text("Next")');
    if (nextBtn) {
      await nextBtn.click();
    }

    // Wait and monitor for the filter-contacts API call
    console.log('Waiting for filter-contacts API response...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'screenshots/test9_debug_step2.png' });

    // Check what the page shows
    const scheduleBtn = await page.$('button:has-text("Schedule"), button:has-text("Next: Schedule")');
    if (scheduleBtn) {
      const isDisabled = await scheduleBtn.isDisabled();
      const btnText = await scheduleBtn.textContent();
      console.log(`\nSchedule button: "${btnText}" - Disabled: ${isDisabled}`);
    }

    // Look for recipient count text
    const recipientText = await page.$('text=/\\d+ recipient/i');
    if (recipientText) {
      const text = await recipientText.textContent();
      console.log(`Recipient text: ${text}`);
    } else {
      console.log('No recipient count text found');
    }

    // Check for any error messages
    const errorText = await page.$('[role="alert"], .error, text=error');
    if (errorText) {
      const error = await errorText.textContent();
      console.log(`Error message: ${error}`);
    }

    // Wait more to see if data loads
    console.log('\nWaiting 10 more seconds for data to load...');
    await page.waitForTimeout(10000);

    await page.screenshot({ path: 'screenshots/test9_debug_step2_after_wait.png' });

    // Recheck button state
    const scheduleBtnAfter = await page.$('button:has-text("Schedule"), button:has-text("Next: Schedule")');
    if (scheduleBtnAfter) {
      const isDisabled = await scheduleBtnAfter.isDisabled();
      const btnText = await scheduleBtnAfter.textContent();
      console.log(`\nAfter wait - Schedule button: "${btnText}" - Disabled: ${isDisabled}`);
    }

    console.log('\n=== DEBUG COMPLETE ===');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test9_debug_error.png' });
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
