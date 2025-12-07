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

// Ensure screenshot directory exists
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
    successIndication: false,
    requestDetails: {},
    responseDetails: {}
  },
  screenshots: [],
  errors: [],
  summary: {}
};

async function runTest() {
  console.log('🚀 Starting FINAL autonomous Playwright verification...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Network request listener
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
            /Content-Disposition: form-data; name="profile_id"\s+([a-f0-9-]+)/
          ];

          for (const pattern of patterns) {
            const match = requestData.postData.match(pattern);
            if (match) {
              results.phase4.profileIdValue = match[1];
              console.log('✅ profile_id found:', results.phase4.profileIdValue);
              break;
            }
          }
        } else {
          console.log('❌ WARNING: profile_id NOT found in request payload');
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
    // PHASE 2: Login & Navigate
    console.log('\n=== PHASE 2: Frontend Email Profile Fetching ===\n');

    console.log('Navigating to production login page...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-page.png'), fullPage: true });
    results.screenshots.push('02-login-page.png');

    console.log('Logging in...');
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02b-login-filled.png'), fullPage: true });
    results.screenshots.push('02b-login-filled.png');

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    results.phase2.loginSuccessful = true;
    console.log('✅ Login successful');

    console.log('Navigating to inbox...');
    await page.goto(`${PRODUCTION_URL}/dashboard/inbox`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    results.phase2.inboxLoaded = true;
    console.log('✅ Inbox loaded');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-inbox-loaded.png'), fullPage: true });
    results.screenshots.push('03-inbox-loaded.png');

    console.log(`Network requests captured: ${results.phase2.networkRequests.length}`);

    // PHASE 3: Compose Email
    console.log('\n=== PHASE 3: Compose Email UI ===\n');

    console.log('Clicking Compose Email button...');
    const composeButton = await page.$('button:has-text("Compose Email")');
    if (!composeButton) {
      throw new Error('Compose Email button not found');
    }

    await composeButton.click();
    results.phase3.composeButtonClicked = true;
    console.log('✅ Compose button clicked');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-compose-modal-opened.png'), fullPage: true });
    results.screenshots.push('05-compose-modal-opened.png');

    // Check modal opened
    const modal = await page.$('[role="dialog"]');
    if (modal) {
      results.phase3.composeModalOpened = true;
      console.log('✅ Compose modal opened');
    }

    // Check From field (profile selector dropdown)
    const fromSelect = await page.$('select, [role="combobox"]');
    if (fromSelect) {
      results.phase3.fromFieldVisible = true;
      const fromText = await page.textContent('text=/admin@mg/');
      results.phase3.fromFieldValue = fromText;
      console.log('✅ From field visible:', fromText);
    } else {
      console.log('✅ From field using default profile');
    }

    // Fill To field - it's a searchable input
    console.log('Filling To field...');
    const toInput = await page.$('input[placeholder*="Search contacts"]');
    if (!toInput) {
      throw new Error('To field not found');
    }

    await toInput.click();
    await toInput.fill(TEST_RECIPIENT);
    await toInput.press('Enter'); // Add the email
    results.phase3.toFieldFilled = true;
    console.log('✅ To field filled:', TEST_RECIPIENT);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-to-field-filled.png'), fullPage: true });
    results.screenshots.push('06-to-field-filled.png');

    // Fill Subject - need to click in the editor area first
    console.log('Filling Subject field...');
    // Subject appears after "Select Template (Optional)" dropdown
    const subjectArea = await page.$('[contenteditable="true"]');
    if (!subjectArea) {
      throw new Error('Content editable area not found');
    }

    // Type subject (the editor might handle both subject and body)
    await subjectArea.click();
    await page.keyboard.type(TEST_SUBJECT);
    results.phase3.subjectFilled = true;
    console.log('✅ Subject typed');

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-subject-filled.png'), fullPage: true });
    results.screenshots.push('07-subject-filled.png');

    // Type message
    console.log('Typing message...');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type(TEST_MESSAGE);
    results.phase3.messageFilled = true;
    console.log('✅ Message typed');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-message-filled.png'), fullPage: true });
    results.screenshots.push('08-message-filled.png');

    // PHASE 4: Send Email
    console.log('\n=== PHASE 4: CRITICAL - Send Email with Network Monitoring ===\n');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-before-send.png'), fullPage: true });
    results.screenshots.push('09-before-send.png');

    console.log('Looking for Send Email button...');
    const sendButton = await page.$('button:has-text("Send Email")');
    if (!sendButton) {
      throw new Error('Send Email button not found');
    }

    console.log('✅ Send button found');
    console.log('Setting up network listener and clicking Send...');

    // Wait for the send-email request
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/send-email'),
      { timeout: 15000 }
    ).catch(() => null);

    await sendButton.click();
    // Wait a moment for button to be fully enabled
    await page.waitForTimeout(2000);
    console.log('Attempting to click Send button...');
    
    // Try force click if regular click fails
    try {
      await sendButton.click({ timeout: 5000 });
    } catch (e) {
      console.log('Regular click failed, trying force click...');
      await sendButton.click({ force: true });
    }
    console.log('✅ Send button clicked');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-send-clicked.png'), fullPage: true });
    results.screenshots.push('10-send-clicked.png');

    console.log('Waiting for send-email response...');
    const sendResponse = await responsePromise;

    if (!sendResponse) {
      console.log('⚠ Send-email response not detected within timeout');
    }

    await page.waitForTimeout(3000);

    // Check for error toast
    const errorToast = await page.$('[role="alert"]');
    if (errorToast) {
      const errorText = await errorToast.textContent();
      if (errorText.toLowerCase().includes('error') || errorText.toLowerCase().includes('failed')) {
        console.log('❌ ERROR TOAST DETECTED:', errorText);
        results.phase4.errorToastDetected = true;
        results.errors.push(`Error toast: ${errorText}`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-error-toast.png'), fullPage: true });
        results.screenshots.push('11-error-toast.png');
      }
    } else {
      console.log('✅ No error toast detected');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-final-state.png'), fullPage: true });
    results.screenshots.push('12-final-state.png');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    results.errors.push(`Test exception: ${error.message}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-screenshot.png'), fullPage: true });
    results.screenshots.push('error-screenshot.png');
  } finally {
    await context.close();
    await browser.close();
  }

  // Generate Summary
  results.summary = {
    phase2_success: results.phase2.loginSuccessful && results.phase2.inboxLoaded,
    phase3_success: results.phase3.composeButtonClicked &&
                   results.phase3.toFieldFilled &&
                   results.phase3.subjectFilled &&
                   results.phase3.messageFilled,
    phase4_success: results.phase4.sendRequestCaptured &&
                   results.phase4.requestUrl?.includes('/send-email') &&
                   results.phase4.profileIdInPayload &&
                   results.phase4.responseStatus === 200 &&
                   !results.phase4.errorToastDetected,
    overall_pass: false
  };

  results.summary.overall_pass =
    results.summary.phase2_success &&
    results.summary.phase3_success &&
    results.summary.phase4_success;

  // Save Results
  const resultsPath = 'inbox-email-verification-final-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Print Summary Report
  console.log('\n' + '='.repeat(80));
  console.log('AUTONOMOUS PLAYWRIGHT VERIFICATION - FINAL REPORT');
  console.log('='.repeat(80));
  console.log(`\nTimestamp: ${results.timestamp}`);
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Screenshot Directory: ${SCREENSHOT_DIR}/`);

  console.log('\n--- PHASE 2: Frontend Email Profile Fetching ---');
  console.log(`Login Successful: ${results.phase2.loginSuccessful ? '✅' : '❌'}`);
  console.log(`Inbox Loaded: ${results.phase2.inboxLoaded ? '✅' : '❌'}`);
  console.log(`Profile Fetch Detected: ${results.phase2.profileFetchDetected ? '✅' : '❌'}`);
  if (results.phase2.profileFetchUrl) {
    console.log(`Profile Fetch URL: ${results.phase2.profileFetchUrl}`);
  }

  console.log('\n--- PHASE 3: Compose Email UI ---');
  console.log(`Compose Button Clicked: ${results.phase3.composeButtonClicked ? '✅' : '❌'}`);
  console.log(`Compose Modal Opened: ${results.phase3.composeModalOpened ? '✅' : '❌'}`);
  console.log(`From Field Visible: ${results.phase3.fromFieldVisible ? '✅' : '⚠ (using default)'}`);
  if (results.phase3.fromFieldValue) {
    console.log(`From Field Value: ${results.phase3.fromFieldValue}`);
  }
  console.log(`To Field Filled: ${results.phase3.toFieldFilled ? '✅' : '❌'}`);
  console.log(`Subject Filled: ${results.phase3.subjectFilled ? '✅' : '❌'}`);
  console.log(`Message Filled: ${results.phase3.messageFilled ? '✅' : '❌'}`);

  console.log('\n--- PHASE 4: CRITICAL - Send Email Network Monitoring ---');
  console.log(`Send Request Captured: ${results.phase4.sendRequestCaptured ? '✅' : '❌'}`);
  console.log(`Request URL: ${results.phase4.requestUrl || 'NOT CAPTURED'}`);
  console.log(`Request Method: ${results.phase4.requestMethod || 'NOT CAPTURED'}`);
  console.log(`profile_id in Payload: ${results.phase4.profileIdInPayload ? '✅' : '❌'}`);
  console.log(`profile_id Value: ${results.phase4.profileIdValue || 'NOT FOUND'}`);
  console.log(`Response Status: ${results.phase4.responseStatus || 'NOT CAPTURED'}`);
  console.log(`Error Toast: ${results.phase4.errorToastDetected ? '❌ DETECTED' : '✅ NONE'}`);

  if (results.phase4.responseBody) {
    console.log('\n--- Response Body ---');
    console.log(JSON.stringify(results.phase4.responseBody, null, 2));
  }

  if (results.phase4.requestDetails.postData) {
    console.log('\n--- Request Payload (first 1000 chars) ---');
    console.log(results.phase4.requestDetails.postData.substring(0, 1000));
  }

  console.log('\n--- VERIFICATION CHECKPOINTS ---');
  console.log(`✅ Login successful: ${results.phase2.loginSuccessful}`);
  console.log(`✅ Inbox loads: ${results.phase2.inboxLoaded}`);
  console.log(`✅ Compose modal opens: ${results.phase3.composeModalOpened}`);
  console.log(`✅ Form fields filled: ${results.phase3.toFieldFilled && results.phase3.subjectFilled && results.phase3.messageFilled}`);
  console.log(`✅ Send to /send-email: ${results.phase4.requestUrl?.includes('/send-email') || false}`);
  console.log(`✅ profile_id in payload: ${results.phase4.profileIdInPayload}`);
  console.log(`✅ Response 200 OK: ${results.phase4.responseStatus === 200}`);
  console.log(`✅ No error toast: ${!results.phase4.errorToastDetected}`);

  console.log('\n--- SCREENSHOTS ---');
  results.screenshots.forEach(s => console.log(`- ${SCREENSHOT_DIR}/${s}`));

  if (results.errors.length > 0) {
    console.log('\n--- ERRORS ---');
    results.errors.forEach(e => console.log(`❌ ${e}`));
  }

  console.log('\n--- FINAL VERDICT ---');
  if (results.summary.overall_pass) {
    console.log('🎉 ALL TESTS PASSED - READY FOR PHASE 5 BACKEND LOG VERIFICATION');
    console.log('\nNext Steps:');
    console.log('1. SSH to production server');
    console.log('2. Check backend logs for email send confirmation');
    console.log('3. Verify Mailgun API call was made');
    console.log('4. Confirm email was delivered');
  } else {
    console.log('⚠ SOME TESTS FAILED - Review results');
    console.log(`Phase 2: ${results.summary.phase2_success ? '✅' : '❌'}`);
    console.log(`Phase 3: ${results.summary.phase3_success ? '✅' : '❌'}`);
    console.log(`Phase 4: ${results.summary.phase4_success ? '✅' : '❌'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Results saved to: ${resultsPath}`);
  console.log('='.repeat(80) + '\n');
}

runTest().catch(console.error);
