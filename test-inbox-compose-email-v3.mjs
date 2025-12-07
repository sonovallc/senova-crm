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
    toFieldFilled: false,
    subjectFilled: false,
    messageFilled: false,
    fromFieldStatus: 'not_checked'
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
  console.log('Starting autonomous Playwright verification (v3 - Compose Email)...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Network request listener
  const requestMap = new Map();

  page.on('request', request => {
    const url = request.url();

    // Track all API requests
    if (url.includes('/api/')) {
      results.phase2.networkRequests.push({
        url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }

    // Store request details
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

    // Check for email profile fetch
    if (url.includes('/email-profiles') || url.includes('/my-profiles')) {
      results.phase2.profileFetchDetected = true;
      results.phase2.profileFetchUrl = url;
      console.log('✓ Email profile fetch detected:', url);
    }

    // CRITICAL: Capture send-email request
    if (url.includes('/send-email')) {
      console.log('\n🎯 CRITICAL: Send-email request captured!');
      console.log('Full URL:', url);
      results.phase4.sendRequestCaptured = true;
      results.phase4.requestUrl = url;
      results.phase4.requestMethod = requestData?.method || 'UNKNOWN';

      console.log('Request headers:', JSON.stringify(requestData?.headers, null, 2));

      // Extract request payload
      if (requestData?.postData) {
        console.log('Request postData (raw):', requestData.postData);
        results.phase4.requestDetails.postData = requestData.postData;

        // Check for profile_id
        if (requestData.postData.includes('profile_id')) {
          results.phase4.profileIdInPayload = true;

          // Extract profile_id value
          const patterns = [
            /profile_id["\s]*[:=]["\s]*([a-f0-9-]+)/i,
            /"profile_id":\s*"([a-f0-9-]+)"/,
            /profile_id=([a-f0-9-]+)/,
            /name="profile_id"[^>]*>([a-f0-9-]+)/
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

      // Capture response
      results.phase4.responseStatus = response.status();
      console.log('Response status:', response.status());
      console.log('Response headers:', JSON.stringify(response.headers(), null, 2));

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
    // ========================================
    // PHASE 2: Frontend Email Profile Fetching
    // ========================================
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

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02c-after-login.png'), fullPage: true });
    results.screenshots.push('02c-after-login.png');

    console.log('Navigating to inbox...');
    await page.goto(`${PRODUCTION_URL}/dashboard/inbox`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    results.phase2.inboxLoaded = true;
    console.log('✅ Inbox loaded');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-inbox-loaded.png'), fullPage: true });
    results.screenshots.push('03-inbox-loaded.png');

    if (results.phase2.profileFetchDetected) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-network-profile-fetch.png'), fullPage: true });
      results.screenshots.push('04-network-profile-fetch.png');
    }

    console.log(`Network requests captured: ${results.phase2.networkRequests.length}`);

    // ========================================
    // PHASE 3: Compose Email UI
    // ========================================
    console.log('\n=== PHASE 3: Compose Email UI ===\n');

    console.log('Looking for Compose Email button...');
    await page.waitForTimeout(1000);

    // Click "Compose Email" button (visible in screenshot)
    const composeButton = await page.$('button:has-text("Compose Email")');
    if (!composeButton) {
      console.log('❌ Compose Email button not found');
      results.errors.push('Compose Email button not found');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-compose-button-not-found.png'), fullPage: true });
      results.screenshots.push('05-compose-button-not-found.png');
    } else {
      console.log('✅ Compose Email button found');
      await composeButton.click();
      results.phase3.composeButtonClicked = true;
      console.log('✅ Compose button clicked');

      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-compose-modal-opened.png'), fullPage: true });
      results.screenshots.push('05-compose-modal-opened.png');

      // Check if modal/form opened
      const modalVisible = await page.$('[role="dialog"], .modal, form');
      if (modalVisible) {
        results.phase3.composeModalOpened = true;
        console.log('✅ Compose modal opened');
      } else {
        console.log('⚠ Modal may not be visible');
      }

      // Fill To field
      console.log('Filling To field...');
      const toField = await page.$('input[name="to"], input[placeholder*="To"], input[placeholder*="recipient"]');
      if (toField) {
        await toField.fill(TEST_RECIPIENT);
        results.phase3.toFieldFilled = true;
        console.log('✅ To field filled:', TEST_RECIPIENT);
      } else {
        console.log('⚠ To field not found');
        results.errors.push('To field not found');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-to-field-filled.png'), fullPage: true });
      results.screenshots.push('06-to-field-filled.png');

      // Fill Subject field
      console.log('Filling Subject field...');
      const subjectField = await page.$('input[name="subject"], input[placeholder*="Subject"]');
      if (subjectField) {
        await subjectField.fill('Autonomous Test - Profile ID Verification');
        results.phase3.subjectFilled = true;
        console.log('✅ Subject filled');
      } else {
        console.log('⚠ Subject field not found');
        results.errors.push('Subject field not found');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-subject-filled.png'), fullPage: true });
      results.screenshots.push('07-subject-filled.png');

      // Check for From field
      const fromField = await page.$('select[name="from"], select[name="profile_id"], input[name="from"]');
      if (fromField) {
        results.phase3.fromFieldStatus = 'visible';
        console.log('✅ From field found (profile selector)');
      } else {
        results.phase3.fromFieldStatus = 'not_visible (using default profile)';
        console.log('✅ No From field (will use default profile)');
      }

      // Fill message
      console.log('Filling message...');
      const messageField = await page.$('textarea[name="message"], textarea[name="body"], textarea[placeholder*="message"]');
      if (messageField) {
        await messageField.fill(TEST_MESSAGE);
        results.phase3.messageFilled = true;
        console.log('✅ Message filled');
      } else {
        console.log('⚠ Message field not found');
        results.errors.push('Message field not found');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-message-filled.png'), fullPage: true });
      results.screenshots.push('08-message-filled.png');
    }

    // ========================================
    // PHASE 4: CRITICAL - Send Email
    // ========================================
    console.log('\n=== PHASE 4: CRITICAL - Send Email with Network Monitoring ===\n');

    if (!results.phase3.composeButtonClicked) {
      console.log('⚠ Skipping Phase 4 - compose modal not opened');
      results.errors.push('Phase 4 skipped - compose modal not opened');
    } else {
      console.log('Looking for Send button...');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-before-send.png'), fullPage: true });
      results.screenshots.push('09-before-send.png');

      const sendButton = await page.$('button:has-text("Send"), button[type="submit"]');
      if (!sendButton) {
        console.log('❌ Send button not found');
        results.errors.push('Send button not found');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-send-button-not-found.png'), fullPage: true });
        results.screenshots.push('10-send-button-not-found.png');
      } else {
        console.log('✅ Send button found');
        console.log('Clicking Send button...');

        // Wait for response
        const responsePromise = page.waitForResponse(
          response => response.url().includes('/send-email'),
          { timeout: 15000 }
        ).catch(() => null);

        await sendButton.click();
        console.log('✅ Send button clicked');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-send-clicked.png'), fullPage: true });
        results.screenshots.push('10-send-clicked.png');

        console.log('Waiting for send-email request...');
        const sendResponse = await responsePromise;

        if (!sendResponse) {
          console.log('⚠ Send-email response not detected within timeout');
          results.errors.push('Send-email response not detected');
        }

        await page.waitForTimeout(3000);

        // Check for error toast
        const errorToast = await page.$('[role="alert"]');
        if (errorToast) {
          const errorText = await errorToast.textContent();
          console.log('❌ ERROR TOAST DETECTED:', errorText);
          results.phase4.errorToastDetected = true;
          results.errors.push(`Error toast: ${errorText}`);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-error-toast.png'), fullPage: true });
          results.screenshots.push('11-error-toast.png');
        } else {
          console.log('✅ No error toast detected');
        }

        // Check for success indication
        const successToast = await page.$('[role="status"], .success, .toast-success');
        if (successToast) {
          results.phase4.successIndication = true;
          console.log('✅ Success indication found');
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-final-state.png'), fullPage: true });
        results.screenshots.push('12-final-state.png');
      }
    }

  } catch (error) {
    console.error('Test error:', error);
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
  const resultsPath = 'inbox-email-verification-v3-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Print Summary Report
  console.log('\n' + '='.repeat(80));
  console.log('AUTONOMOUS PLAYWRIGHT VERIFICATION - FINAL REPORT (V3)');
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
  console.log(`To Field Filled: ${results.phase3.toFieldFilled ? '✅' : '❌'}`);
  console.log(`Subject Filled: ${results.phase3.subjectFilled ? '✅' : '❌'}`);
  console.log(`Message Filled: ${results.phase3.messageFilled ? '✅' : '❌'}`);
  console.log(`From Field Status: ${results.phase3.fromFieldStatus}`);

  console.log('\n--- PHASE 4: CRITICAL - Send Email Network Monitoring ---');
  console.log(`Send Request Captured: ${results.phase4.sendRequestCaptured ? '✅' : '❌'}`);
  console.log(`Request URL: ${results.phase4.requestUrl || 'NOT CAPTURED'}`);
  console.log(`Request Method: ${results.phase4.requestMethod || 'NOT CAPTURED'}`);
  console.log(`profile_id in Payload: ${results.phase4.profileIdInPayload ? '✅' : '❌'}`);
  console.log(`profile_id Value: ${results.phase4.profileIdValue || 'NOT FOUND'}`);
  console.log(`Response Status: ${results.phase4.responseStatus || 'NOT CAPTURED'}`);
  console.log(`Error Toast: ${results.phase4.errorToastDetected ? '❌ DETECTED' : '✅ NONE'}`);
  console.log(`Success Indication: ${results.phase4.successIndication ? '✅' : '⚠'}`);

  if (results.phase4.responseBody) {
    console.log('\n--- Response Body ---');
    console.log(JSON.stringify(results.phase4.responseBody, null, 2));
  }

  if (results.phase4.requestDetails.postData) {
    console.log('\n--- Request Payload ---');
    console.log(results.phase4.requestDetails.postData.substring(0, 500));
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
  } else {
    console.log('⚠ SOME TESTS FAILED');
    console.log(`Phase 2: ${results.summary.phase2_success ? '✅' : '❌'}`);
    console.log(`Phase 3: ${results.summary.phase3_success ? '✅' : '❌'}`);
    console.log(`Phase 4: ${results.summary.phase4_success ? '✅' : '❌'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Results: ${resultsPath}`);
  console.log('='.repeat(80) + '\n');
}

runTest().catch(console.error);
