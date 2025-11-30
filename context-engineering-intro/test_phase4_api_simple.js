const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhase4API() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'phase4-api-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Phase 4 Backend API Integration Test ===');
  console.log('');

  const networkRequests = [];
  const apiResponses = [];
  
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      postData: request.postData()
    });
    
    if (request.url().includes('/api/v1/inbox/send-email')) {
      console.log('REQUEST DETECTED to /api/v1/inbox/send-email');
      console.log('Method:', request.method());
      console.log('Payload:', request.postData());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/v1/inbox/send-email')) {
      console.log('RESPONSE from /api/v1/inbox/send-email');
      console.log('Status:', response.status());
      try {
        const body = await response.text();
        console.log('Body:', body);
        apiResponses.push({ status: response.status(), body });
      } catch (e) {
        console.error('Error:', e.message);
      }
    }
  });

  try {
    console.log('Step 1: Login');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, '01-login.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('Login OK');
    
    console.log('Step 2: Navigate to inbox');
    await page.goto('http://localhost:3000/dashboard/inbox', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, '02-inbox.png'), fullPage: true });
    
    console.log('Step 3: Open compose dialog');
    await page.click('button:has-text("Compose Email")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '03-compose-dialog.png'), fullPage: true });
    
    console.log('Step 4: Fill form');
    await page.fill('input[name="to"]', 'test@example.com');
    await page.fill('input[name="subject"]', 'API Integration Test');
    const bodyField = page.locator('textarea, [contenteditable="true"]').first();
    await bodyField.fill('Testing the backend API call');
    await page.screenshot({ path: path.join(screenshotDir, '04-form-filled.png'), fullPage: true });
    
    console.log('Step 5: Send email - watching for API call...');
    networkRequests.length = 0;
    
    await page.click('button:has-text("Send Email")');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotDir, '05-after-send.png'), fullPage: true });
    
    console.log('');
    console.log('Step 6: Analyzing requests...');
    const apiReq = networkRequests.find(r => r.url.includes('/api/v1/inbox/send-email'));
    
    if (apiReq) {
      console.log('');
      console.log('SUCCESS: API CALL FOUND!');
      console.log('URL:', apiReq.url);
      console.log('Method:', apiReq.method);
      console.log('Payload:', apiReq.postData);
      if (apiResponses.length > 0) {
        console.log('Response:', apiResponses[0]);
      }
      fs.writeFileSync(
        path.join(screenshotDir, 'api-details.json'),
        JSON.stringify({ request: apiReq, response: apiResponses[0] }, null, 2)
      );
      console.log('');
      console.log('VERDICT: PASS - API integration working!');
    } else {
      console.log('');
      console.log('FAILURE: No API call detected');
      console.log('Requests:', networkRequests.map(r => r.method + ' ' + r.url));
      console.log('');
      console.log('VERDICT: FAIL - Still using placeholder');
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testPhase4API().catch(console.error);
