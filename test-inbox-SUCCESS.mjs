import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://crm.senovallc.com';
const CREDS = { email: 'jwoodcapital@gmail.com', password: 'D3n1w3n1!' };
const DIR = 'screenshots/inbox-verification-success';
const TO = 'john.test@example.com';
const MSG = 'VERIFICATION TEST - profile_id fix - ' + new Date().toISOString();

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const results = {
  timestamp: new Date().toISOString(),
  login: false,
  compose: false,
  filled: false,
  sendCaptured: false,
  profileIdFound: false,
  profileIdValue: null,
  status: null,
  error: null,
  allRequests: []
};

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();

  const reqMap = new Map();

  page.on('request', r => {
    const u = r.url();
    if (u.includes('/api/')) results.allRequests.push({ url: u, method: r.method() });
    reqMap.set(r, { url: u, method: r.method(), post: r.postData() });
  });

  page.on('response', async r => {
    const u = r.url();
    const req = reqMap.get(r.request());

    if (u.includes('/send-email') || (u.includes('/communications') && r.request().method() === 'POST')) {
      console.log('\n🎯 SEND REQUEST:', u);
      results.sendCaptured = true;
      results.status = r.status();

      if (req?.post) {
        console.log('Payload:', req.post.substring(0, 500));
        if (req.post.includes('profile_id')) {
          results.profileIdFound = true;
          const m = req.post.match(/Content-Disposition: form-data; name="profile_id"[^]*?([a-f0-9-]{36})/);
          if (m) {
            results.profileIdValue = m[1];
            console.log('✅✅✅ profile_id:', m[1]);
          }
        }
      }

      try {
        const body = await r.json();
        console.log('Response:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('Response text:', await r.text());
      }
    }
  });

  try {
    // Login
    await page.goto(URL);
    await page.fill('input[type="email"]', CREDS.email);
    await page.fill('input[type="password"]', CREDS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    results.login = true;
    console.log('✅ Logged in');
    await page.screenshot({ path: DIR + '/01-login.png', fullPage: true });

    // Navigate to inbox
    await page.goto(URL + '/dashboard/inbox');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: DIR + '/02-inbox.png', fullPage: true });

    // Compose
    await (await page.$('button:has-text("Compose Email")')).click();
    await page.waitForTimeout(2000);
    results.compose = true;
    console.log('✅ Compose opened');
    await page.screenshot({ path: DIR + '/03-modal.png', fullPage: true });

    // Fill To
    const toField = await page.$('input[placeholder*="Search contacts"]');
    await toField.click();
    await toField.fill(TO);
    await toField.press('Enter');
    await page.waitForTimeout(1000);
    console.log('✅ To:', TO);

    // Fill message in rich text editor
    const editor = await page.$('[contenteditable="true"]');
    await editor.click();
    await page.keyboard.type(MSG);
    results.filled = true;
    console.log('✅ Message filled');
    await page.screenshot({ path: DIR + '/04-filled.png', fullPage: true });

    // Send
    await page.waitForTimeout(2000);
    const sendBtn = await page.$('button:has-text("Send Email")');

    const respPromise = page.waitForResponse(
      r => r.url().includes('/send') || r.url().includes('/communications'),
      { timeout: 15000 }
    ).catch(() => null);

    console.log('Clicking Send...');
    try {
      await sendBtn.click({ timeout: 5000 });
    } catch (e) {
      await sendBtn.click({ force: true });
    }
    console.log('✅ Clicked Send');

    await page.screenshot({ path: DIR + '/05-sent.png', fullPage: true });

    await respPromise;
    await page.waitForTimeout(3000);

    const toast = await page.$('[role="alert"]');
    if (toast) {
      const text = await toast.textContent();
      if (text.includes('error') || text.includes('Error')) {
        results.error = text;
        console.log('❌ Error:', text);
      }
    }

    await page.screenshot({ path: DIR + '/06-final.png', fullPage: true });

  } catch (e) {
    results.error = e.message;
    console.error('❌', e.message);
    await page.screenshot({ path: DIR + '/error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  fs.writeFileSync('inbox-verification-success.json', JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('INBOX EMAIL SEND - PROFILE_ID VERIFICATION');
  console.log('='.repeat(80));
  console.log('Login: ' + (results.login ? '✅' : '❌'));
  console.log('Compose: ' + (results.compose ? '✅' : '❌'));
  console.log('Filled: ' + (results.filled ? '✅' : '❌'));
  console.log('Send Request: ' + (results.sendCaptured ? '✅' : '❌'));
  console.log('profile_id: ' + (results.profileIdFound ? '✅✅✅' : '❌❌❌'));
  console.log('profile_id Value: ' + (results.profileIdValue || 'NOT FOUND'));
  console.log('Status: ' + (results.status || 'N/A'));
  console.log('Error: ' + (results.error || 'None'));
  console.log('\n--- All POST Requests ---');
  results.allRequests.filter(r => r.method === 'POST').forEach(r => console.log('- ' + r.url));

  const pass = results.login && results.compose && results.filled && results.sendCaptured && results.profileIdFound && results.status === 200 && !results.error;

  console.log('\n' + '='.repeat(80));
  console.log(pass ? '🎉 SUCCESS! profile_id FIX VERIFIED!' : '⚠ FAILED');
  console.log('='.repeat(80));
})();
