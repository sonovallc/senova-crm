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
  phase2: { loginSuccessful: false, inboxLoaded: false, profileFetchDetected: false, profileFetchUrl: null, networkRequests: [] },
  phase3: { composeButtonClicked: false, composeModalOpened: false, fromFieldVisible: false, fromFieldValue: null, toFieldFilled: false, subjectFilled: false, messageFilled: false },
  phase4: { sendRequestCaptured: false, requestUrl: null, requestMethod: null, profileIdInPayload: false, profileIdValue: null, responseStatus: null, responseBody: null, errorToastDetected: false, requestDetails: {}, responseDetails: {} },
  screenshots: [],
  errors: [],
  summary: {}
};

async function runTest() {
  console.log('🚀 FINAL Autonomous Playwright Verification - Correct Subject Field\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const requestMap = new Map();

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      results.phase2.networkRequests.push({ url, method: request.method(), timestamp: new Date().toISOString() });
    }
    requestMap.set(request, { url, method: request.method(), headers: request.headers(), postData: request.postData() });
  });

  page.on('response', async response => {
    const url = response.url();
    const request = response.request();
    const requestData = requestMap.get(request);

    if (url.includes('/email-profiles') || url.includes('/my-profiles')) {
      results.phase2.profileFetchDetected = true;
      results.phase2.profileFetchUrl = url;
      console.log('✅ Profile fetch:', url);
    }

    if (url.includes('/send-email')) {
      console.log('\n🎯 CRITICAL: Send-email request captured!');
      console.log('URL:', url);
      results.phase4.sendRequestCaptured = true;
      results.phase4.requestUrl = url;
      results.phase4.requestMethod = requestData?.method || 'UNKNOWN';

      if (requestData?.postData) {
        console.log('PostData:', requestData.postData.substring(0, 1000));
        results.phase4.requestDetails.postData = requestData.postData;

        if (requestData.postData.includes('profile_id')) {
          results.phase4.profileIdInPayload = true;
          const patterns = [
            /Content-Disposition: form-data; name="profile_id"[^]*?([a-f0-9-]{36})/,
            /"profile_id":\s*"([a-f0-9-]+)"/,
            /profile_id[=:]([a-f0-9-]+)/
          ];
          for (const pattern of patterns) {
            const match = requestData.postData.match(pattern);
            if (match) {
              results.phase4.profileIdValue = match[1];
              console.log('✅✅✅ profile_id:', match[1]);
              break;
            }
          }
        } else {
          console.log('❌❌❌ profile_id NOT in payload');
        }
      }

      results.phase4.responseStatus = response.status();
      console.log('Response status:', response.status());

      try {
        const body = await response.json();
        results.phase4.responseBody = body;
        results.phase4.responseDetails = { status: response.status(), body };
        console.log('Response:', JSON.stringify(body, null, 2));
      } catch (e) {
        const text = await response.text();
        results.phase4.responseBody = text;
        results.phase4.responseDetails = { status: response.status(), bodyText: text };
        console.log('Response text:', text);
      }
    }
  });

  try {
    // PHASE 2
    console.log('\n=== PHASE 2: Login ===\n');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login.png'), fullPage: true });
    results.screenshots.push('02-login.png');

    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    results.phase2.loginSuccessful = true;
    console.log('✅ Login OK');

    await page.goto(`${PRODUCTION_URL}/dashboard/inbox`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    results.phase2.inboxLoaded = true;
    console.log('✅ Inbox loaded');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-inbox.png'), fullPage: true });
    results.screenshots.push('03-inbox.png');

    // PHASE 3
    console.log('\n=== PHASE 3: Compose ===\n');

    const composeBtn = await page.$('button:has-text("Compose Email")');
    if (!composeBtn) throw new Error('Compose button not found');
    await composeBtn.click();
    results.phase3.composeButtonClicked = true;
    console.log('✅ Compose clicked');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-modal.png'), fullPage: true });
    results.screenshots.push('05-modal.png');

    const modal = await page.$('[role="dialog"]');
    if (modal) {
      results.phase3.composeModalOpened = true;
      console.log('✅ Modal opened');
    }

    // From field
    const fromText = await page.textContent('text=/admin@mg/').catch(() => null);
    if (fromText) {
      results.phase3.fromFieldVisible = true;
      results.phase3.fromFieldValue = fromText;
      console.log('✅ From:', fromText);
    }

    // To field
    const toInput = await page.$('input[placeholder*="Search contacts"]');
    if (!toInput) throw new Error('To field not found');
    await toInput.click();
    await toInput.fill(TEST_RECIPIENT);
    await toInput.press('Enter');
    results.phase3.toFieldFilled = true;
    console.log('✅ To:', TEST_RECIPIENT);
    await page.waitForTimeout(1000);

    // Subject field - look for input AFTER "Subject" label
    console.log('Looking for Subject input field...');
    const subjectInput = await page.$('input[placeholder*="Subject"], input[name="subject"], input[type="text"]');
    if (subjectInput) {
      await subjectInput.click();
      await subjectInput.fill(TEST_SUBJECT);
      results.phase3.subjectFilled = true;
      console.log('✅ Subject filled');
    } else {
      console.log('⚠ Subject input not found, trying contenteditable...');
      // Fallback: type in contenteditable but don't press Enter
      const editor = await page.$('[contenteditable="true"]');
      if (editor) {
        await editor.click();
        await page.keyboard.type(TEST_SUBJECT);
        results.phase3.subjectFilled = true;
        console.log('✅ Subject typed in editor');
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-subject.png'), fullPage: true });
    results.screenshots.push('07-subject.png');

    // Message body
    console.log('Filling message body...');
    const editor = await page.$('[contenteditable="true"]');
    if (!editor) throw new Error('Editor not found');

    await editor.click();
    // Clear any existing content first
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');

    // If we filled subject in editor, add it back then message
    if (!subjectInput) {
      await page.keyboard.type(TEST_SUBJECT);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
    }

    await page.keyboard.type(TEST_MESSAGE);
    results.phase3.messageFilled = true;
    console.log('✅ Message filled');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-ready.png'), fullPage: true });
    results.screenshots.push('08-ready.png');

    // PHASE 4
    console.log('\n=== PHASE 4: Send ===\n');

    const sendBtn = await page.$('button:has-text("Send Email")');
    if (!sendBtn) throw new Error('Send button not found');
    console.log('✅ Send button found');

    await page.waitForTimeout(2000);

    const responsePromise = page.waitForResponse(
      res => res.url().includes('/send-email'),
      { timeout: 15000 }
    ).catch(() => null);

    console.log('Clicking Send...');
    try {
      await sendBtn.click({ timeout: 5000 });
    } catch (e) {
      console.log('Force clicking...');
      await sendBtn.click({ force: true });
    }
    console.log('✅ Clicked');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-sent.png'), fullPage: true });
    results.screenshots.push('10-sent.png');

    console.log('Waiting for response...');
    await responsePromise;
    await page.waitForTimeout(3000);

    const errorToast = await page.$('[role="alert"]');
    if (errorToast) {
      const text = await errorToast.textContent();
      if (text.toLowerCase().includes('error')) {
        console.log('❌ Error:', text);
        results.phase4.errorToastDetected = true;
        results.errors.push(`Error: ${text}`);
      }
    } else {
      console.log('✅ No error toast');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-final.png'), fullPage: true });
    results.screenshots.push('12-final.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
    results.errors.push(`Exception: ${error.message}`);
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
    phase4_success: results.phase4.sendRequestCaptured && results.phase4.profileIdInPayload && results.phase4.responseStatus === 200 && !results.phase4.errorToastDetected
  };
  results.summary.overall_pass = results.summary.phase2_success && results.summary.phase3_success && results.summary.phase4_success;

  const resultsPath = 'inbox-send-correct-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Report
  console.log('\n' + '='.repeat(80));
  console.log('FINAL REPORT - INBOX EMAIL SEND VERIFICATION');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`\n--- PHASE 2 ---`);
  console.log(`Login: ${results.phase2.loginSuccessful ? '✅' : '❌'}`);
  console.log(`Inbox: ${results.phase2.inboxLoaded ? '✅' : '❌'}`);
  console.log(`Profile Fetch: ${results.phase2.profileFetchDetected ? '✅' : '❌'}`);

  console.log(`\n--- PHASE 3 ---`);
  console.log(`Modal: ${results.phase3.composeModalOpened ? '✅' : '❌'}`);
  console.log(`From: ${results.phase3.fromFieldVisible ? `✅ ${results.phase3.fromFieldValue}` : '⚠'}`);
  console.log(`To: ${results.phase3.toFieldFilled ? '✅' : '❌'}`);
  console.log(`Subject: ${results.phase3.subjectFilled ? '✅' : '❌'}`);
  console.log(`Message: ${results.phase3.messageFilled ? '✅' : '❌'}`);

  console.log(`\n--- PHASE 4: CRITICAL ---`);
  console.log(`Request Captured: ${results.phase4.sendRequestCaptured ? '✅' : '❌'}`);
  console.log(`URL: ${results.phase4.requestUrl || 'NOT CAPTURED'}`);
  console.log(`profile_id in Payload: ${results.phase4.profileIdInPayload ? '✅✅✅' : '❌❌❌'}`);
  console.log(`profile_id Value: ${results.phase4.profileIdValue || 'NOT FOUND'}`);
  console.log(`Response: ${results.phase4.responseStatus || 'NOT CAPTURED'}`);
  console.log(`Error Toast: ${results.phase4.errorToastDetected ? '❌' : '✅'}`);

  if (results.phase4.requestDetails.postData) {
    console.log('\n--- Request Payload (1000 chars) ---');
    console.log(results.phase4.requestDetails.postData.substring(0, 1000));
  }

  console.log('\n--- VERDICT ---');
  if (results.summary.overall_pass) {
    console.log('🎉🎉🎉 ALL TESTS PASSED! profile_id FIX VERIFIED! 🎉🎉🎉');
  } else {
    console.log('⚠ FAILED');
    console.log(`Phase 2: ${results.summary.phase2_success ? '✅' : '❌'}`);
    console.log(`Phase 3: ${results.summary.phase3_success ? '✅' : '❌'}`);
    console.log(`Phase 4: ${results.summary.phase4_success ? '✅' : '❌'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Results: ${resultsPath}`);
  console.log('Screenshots:', SCREENSHOT_DIR);
  console.log('='.repeat(80) + '\n');
}

runTest().catch(console.error);
