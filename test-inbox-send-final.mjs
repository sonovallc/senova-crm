import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PRODUCTION_URL = 'https://crm.senovallc.com';
const CREDENTIALS = {
  email: 'jwoodcapital@gmail.com',
  password: 'D3n1w3n1!'
};
const SCREENSHOT_DIR = 'screenshots/inbox-email-verification-autonomous';
const TEST_MESSAGE = `Autonomous test - verifying profile_id fix - ${new Date().toISOString()}`;
const TEST_RECIPIENT = 'john.test@example.com';
const TEST_SUBJECT = 'Autonomous Test - Profile ID Verification';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  phase2: {
    loginSuccessful: false,
    inboxLoaded: false,
    profileFetchDetected: false,
    profileFetchUrl: null,
    networkRequests: []
  },
  phase3: {
    composeButtonClicked: false,
    composeModalOpened: false,
    fromFieldVisible: false,
    fromFieldValue: null,
    toFieldFilled: false,
    subjectFilled: false,
    messageFilled: false
  },
  phase4: {
    sendRequestCaptured: false,
    requestUrl: null,
    requestMethod: null,
    profileIdInPayload: false,
    profileIdValue: null,
    responseStatus: null,
    responseBody: null,
    errorToastDetected: false,
    requestDetails: {},
    responseDetails: {}
  },
  screenshots: [],
  errors: [],
  summary: {}
};

async function runTest() {
  console.log('🚀 FINAL Autonomous Playwright Verification - Inbox Email Sending\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const requestMap = new Map();

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      results.phase2.networkRequests.push({
        url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
    requestMap.set(request, {
      url,
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
  });

  page.on('response', async response => {
    const url = response.url();
    const request = response.request();
    const requestData = requestMap.get(request);

    if (url.includes('/email-profiles') || url.includes('/my-profiles')) {
      results.phase2.profileFetchDetected = true;
      results.phase2.profileFetchUrl = url;
      console.log('✅ Email profile fetch detected:', url);
    }

    if (url.includes('/send-email')) {
      console.log('\n🎯 CRITICAL: Send-email request captured!');
      console.log('Full URL:', url);
      results.phase4.sendRequestCaptured = true;
      results.phase4.requestUrl = url;
      results.phase4.requestMethod = requestData?.method || 'UNKNOWN';

      console.log('Request headers:', JSON.stringify(requestData?.headers, null, 2));

      if (requestData?.postData) {
        console.log('Request postData (raw):', requestData.postData);
        results.phase4.requestDetails.postData = requestData.postData;

        if (requestData.postData.includes('profile_id')) {
          results.phase4.profileIdInPayload = true;

          const patterns = [
            /profile_id["\s]*[:=]["\s]*([a-f0-9-]+)/i,
            /"profile_id":\s*"([a-f0-9-]+)"/,
            /profile_id=([a-f0-9-]+)/,
            /name="profile_id"[^>]*>([a-f0-9-]+)/,
            /Content-Disposition: form-data; name="profile_id"[^]*?([a-f0-9-]{36})/
          ];

          for (const pattern of patterns) {
            const match = requestData.postData.match(pattern);
            if (match) {
              results.phase4.profileIdValue = match[1];
              console.log('✅✅✅ profile_id FOUND:', results.phase4.profileIdValue);
              break;
            }
          }

          if (!results.phase4.profileIdValue) {
            console.log('⚠ profile_id field present but value not extracted');
          }
        } else {
          console.log('❌❌❌ WARNING: profile_id NOT found in request payload');
        }
      }

      results.phase4.responseStatus = response.status();
      console.log('Response status:', response.status());

      try {
        const responseBody = await response.json();
        results.phase4.responseBody = responseBody;
        results.phase4.responseDetails = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          body: responseBody
        };
        console.log('Response body:', JSON.stringify(responseBody, null, 2));
      } catch (e) {
        const responseText = await response.text();
        results.phase4.responseBody = responseText;
        results.phase4.responseDetails = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          bodyText: responseText
        };
        console.log('Response text:', responseText);
      }
    }
  });

  try {
    // PHASE 2
    console.log('\n=== PHASE 2: Login & Navigate ===\n');

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-page.png'), fullPage: true });
    results.screenshots.push('02-login-page.png');

    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    results.phase2.loginSuccessful = true;
    console.log('✅ Login successful');

    await page.goto(`${PRODUCTION_URL}/dashboard/inbox`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    results.phase2.inboxLoaded = true;
    console.log('✅ Inbox loaded');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-inbox-loaded.png'), fullPage: true });
    results.screenshots.push('03-inbox-loaded.png');

    // PHASE 3
    console.log('\n=== PHASE 3: Compose Email ===\n');

    const composeButton = await page.$('button:has-text("Compose Email")');
    if (!composeButton) throw new Error('Compose Email button not found');

    await composeButton.click();
    results.phase3.composeButtonClicked = true;
    console.log('✅ Compose button clicked');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-compose-modal.png'), fullPage: true });
    results.screenshots.push('05-compose-modal.png');

    const modal = await page.$('[role="dialog"]');
    if (modal) {
      results.phase3.composeModalOpened = true;
      console.log('✅ Compose modal opened');
    }

    const fromSelect = await page.$('select, [role="combobox"]');
    if (fromSelect) {
      results.phase3.fromFieldVisible = true;
      const fromText = await page.textContent('text=/admin@mg/');
      results.phase3.fromFieldValue = fromText;
      console.log('✅ From field:', fromText);
    }

    const toInput = await page.$('input[placeholder*="Search contacts"]');
    if (!toInput) throw new Error('To field not found');
    await toInput.click();
    await toInput.fill(TEST_RECIPIENT);
    await toInput.press('Enter');
    results.phase3.toFieldFilled = true;
    console.log('✅ To field filled');

    await page.waitForTimeout(1000);

    const subjectArea = await page.$('[contenteditable="true"]');
    if (!subjectArea) throw new Error('Content editable area not found');
    await subjectArea.click();
    await page.keyboard.type(TEST_SUBJECT);
    results.phase3.subjectFilled = true;
    console.log('✅ Subject typed');

    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type(TEST_MESSAGE);
    results.phase3.messageFilled = true;
    console.log('✅ Message typed');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-ready-to-send.png'), fullPage: true });
    results.screenshots.push('08-ready-to-send.png');

    // PHASE 4
    console.log('\n=== PHASE 4: CRITICAL - Send Email ===\n');

    const sendButton = await page.$('button:has-text("Send Email")');
    if (!sendButton) throw new Error('Send Email button not found');
    console.log('✅ Send button found');

    // Wait for button to be fully enabled
    await page.waitForTimeout(2000);

    // Setup network listener
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/send-email'),
      { timeout: 15000 }
    ).catch(() => null);

    console.log('Clicking Send button (with force if needed)...');
    try {
      await sendButton.click({ timeout: 5000 });
    } catch (clickError) {
      console.log('Regular click timed out, trying force click...');
      await sendButton.click({ force: true });
    }
    console.log('✅ Send button clicked');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-send-clicked.png'), fullPage: true });
    results.screenshots.push('10-send-clicked.png');

    console.log('Waiting for send-email response...');
    await responsePromise;

    await page.waitForTimeout(3000);

    const errorToast = await page.$('[role="alert"]');
    if (errorToast) {
      const errorText = await errorToast.textContent();
      if (errorText.toLowerCase().includes('error') || errorText.toLowerCase().includes('failed')) {
        console.log('❌ ERROR TOAST:', errorText);
        results.phase4.errorToastDetected = true;
        results.errors.push(`Error toast: ${errorText}`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-error-toast.png'), fullPage: true });
        results.screenshots.push('11-error-toast.png');
      }
    } else {
      console.log('✅ No error toast');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-final.png'), fullPage: true });
    results.screenshots.push('12-final.png');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    results.errors.push(`Test exception: ${error.message}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error.png'), fullPage: true });
    results.screenshots.push('error.png');
  } finally {
    await context.close();
    await browser.close();
  }

  // Summary
  results.summary = {
    phase2_success: results.phase2.loginSuccessful && results.phase2.inboxLoaded,
    phase3_success: results.phase3.composeButtonClicked && results.phase3.toFieldFilled && results.phase3.messageFilled,
    phase4_success: results.phase4.sendRequestCaptured &&
                   results.phase4.profileIdInPayload &&
                   results.phase4.responseStatus === 200 &&
                   !results.phase4.errorToastDetected
  };

  results.summary.overall_pass = results.summary.phase2_success && results.summary.phase3_success && results.summary.phase4_success;

  const resultsPath = 'inbox-send-final-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Report
  console.log('\n' + '='.repeat(80));
  console.log('AUTONOMOUS PLAYWRIGHT VERIFICATION - FINAL REPORT');
  console.log('='.repeat(80));
  console.log(`\nTimestamp: ${results.timestamp}`);

  console.log('\n--- PHASE 2: Login & Navigate ---');
  console.log(`Login: ${results.phase2.loginSuccessful ? '✅' : '❌'}`);
  console.log(`Inbox Loaded: ${results.phase2.inboxLoaded ? '✅' : '❌'}`);
  console.log(`Profile Fetch: ${results.phase2.profileFetchDetected ? '✅' : '❌'}`);

  console.log('\n--- PHASE 3: Compose Email ---');
  console.log(`Compose Modal: ${results.phase3.composeModalOpened ? '✅' : '❌'}`);
  console.log(`From Field: ${results.phase3.fromFieldVisible ? `✅ (${results.phase3.fromFieldValue})` : '⚠'}`);
  console.log(`To Field: ${results.phase3.toFieldFilled ? '✅' : '❌'}`);
  console.log(`Subject: ${results.phase3.subjectFilled ? '✅' : '❌'}`);
  console.log(`Message: ${results.phase3.messageFilled ? '✅' : '❌'}`);

  console.log('\n--- PHASE 4: CRITICAL - Send Email ---');
  console.log(`Send Request Captured: ${results.phase4.sendRequestCaptured ? '✅' : '❌'}`);
  console.log(`Request URL: ${results.phase4.requestUrl || 'NOT CAPTURED'}`);
  console.log(`profile_id in Payload: ${results.phase4.profileIdInPayload ? '✅✅✅' : '❌❌❌'}`);
  console.log(`profile_id Value: ${results.phase4.profileIdValue || 'NOT FOUND'}`);
  console.log(`Response Status: ${results.phase4.responseStatus || 'NOT CAPTURED'}`);
  console.log(`Error Toast: ${results.phase4.errorToastDetected ? '❌' : '✅'}`);

  if (results.phase4.requestDetails.postData) {
    console.log('\n--- Request Payload (first 1000 chars) ---');
    console.log(results.phase4.requestDetails.postData.substring(0, 1000));
  }

  if (results.phase4.responseBody) {
    console.log('\n--- Response Body ---');
    console.log(JSON.stringify(results.phase4.responseBody, null, 2));
  }

  console.log('\n--- VERIFICATION CHECKPOINTS ---');
  console.log(`✅ Login: ${results.phase2.loginSuccessful}`);
  console.log(`✅ Inbox loads: ${results.phase2.inboxLoaded}`);
  console.log(`✅ Compose works: ${results.phase3.composeModalOpened}`);
  console.log(`✅ Form filled: ${results.phase3.toFieldFilled && results.phase3.messageFilled}`);
  console.log(`✅ Send request: ${results.phase4.sendRequestCaptured}`);
  console.log(`✅ profile_id in payload: ${results.phase4.profileIdInPayload}`);
  console.log(`✅ Response 200: ${results.phase4.responseStatus === 200}`);
  console.log(`✅ No error: ${!results.phase4.errorToastDetected}`);

  console.log('\n--- SCREENSHOTS ---');
  results.screenshots.forEach(s => console.log(`- ${SCREENSHOT_DIR}/${s}`));

  if (results.errors.length > 0) {
    console.log('\n--- ERRORS ---');
    results.errors.forEach(e => console.log(`❌ ${e}`));
  }

  console.log('\n--- FINAL VERDICT ---');
  if (results.summary.overall_pass) {
    console.log('🎉🎉🎉 ALL TESTS PASSED - profile_id FIX VERIFIED! 🎉🎉🎉');
    console.log('\nNext Steps:');
    console.log('1. SSH to production server');
    console.log('2. Check backend logs for email send confirmation');
    console.log('3. Verify Mailgun API call');
    console.log('4. Confirm email delivery');
  } else {
    console.log('⚠ TESTS FAILED');
    console.log(`Phase 2: ${results.summary.phase2_success ? '✅' : '❌'}`);
    console.log(`Phase 3: ${results.summary.phase3_success ? '✅' : '❌'}`);
    console.log(`Phase 4: ${results.summary.phase4_success ? '❌' : '✅'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Results: ${resultsPath}`);
  console.log('='.repeat(80) + '\n');
}

runTest().catch(console.error);
