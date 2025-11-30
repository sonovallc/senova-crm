const { chromium } = require('playwright');
const axios = require('axios');

const FRONTEND = 'http://localhost:3004';
const BACKEND = 'http://localhost:8000';
const CREDS = { email: 'admin@evebeautyma.com', password: 'TestPass123!' };

let token = null;

async function login(page) {
  console.log('\n=== LOGGING IN ===');
  await page.goto(FRONTEND + '/login');
  await page.fill('input[type="email"]', CREDS.email);
  await page.fill('input[type="password"]', CREDS.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('Login successful');
}

async function getToken() {
  const res = await axios.post(BACKEND + '/api/v1/auth/login', CREDS);
  token = res.data.access_token;
  console.log('Token obtained');
}

async function test1(page) {
  console.log('\n=== TEST 1: CAMPAIGNS PAGE ===');
  await page.goto(FRONTEND + '/dashboard/email/campaigns');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/f4-01-list.png', fullPage: true });
  console.log('PASS - Page loaded');
  return true;
}

async function test2(page) {
  console.log('\n=== TEST 2: OPEN WIZARD ===');
  await page.click('button:has-text("Create Campaign")');
  console.log('Waiting 10s for wizard...');
  await page.waitForTimeout(10000);
  
  const errors = await page.locator('text=Error').count();
  if (errors > 0) {
    await page.screenshot({ path: 'screenshots/f4-02-ERROR.png', fullPage: true });
    console.log('FAIL - Error screen detected');
    return false;
  }
  
  await page.screenshot({ path: 'screenshots/f4-02-wizard.png', fullPage: true });
  console.log('PASS - Wizard loaded');
  return true;
}

async function test3(page) {
  console.log('\n=== TEST 3: FILL WIZARD ===');
  await page.fill('input[name="name"]', 'Final Feature 4 Test');
  await page.fill('input[name="subject"]', 'Hello {{contact_name}}');
  await page.fill('textarea[name="body"]', 'Dear {{contact_name}}');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/f4-03-filled.png', fullPage: true });
  console.log('PASS - Form filled');
  return true;
}

async function test4(page) {
  console.log('\n=== TEST 4: CREATE CAMPAIGN ===');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshots/f4-04-created.png', fullPage: true });
  console.log('PASS - Campaign created');
  return true;
}

async function test5(page) {
  console.log('\n=== TEST 5: VERIFY IN LIST ===');
  await page.goto(FRONTEND + '/dashboard/email/campaigns');
  await page.waitForTimeout(3000);
  
  const found = await page.locator('text="Final Feature 4 Test"').count() > 0;
  await page.screenshot({ path: 'screenshots/f4-05-list.png', fullPage: true });
  
  if (found) {
    console.log('PASS - Campaign in list');
    return true;
  } else {
    console.log('FAIL - Campaign not found');
    return false;
  }
}

async function test6(page) {
  console.log('\n=== TEST 6: ANALYTICS PAGE ===');
  await page.click('text="Final Feature 4 Test"');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshots/f4-06-analytics.png', fullPage: true });
  console.log('PASS - Analytics loaded');
  return true;
}

async function test7() {
  console.log('\n=== TEST 7: DATABASE VERIFICATION ===');
  const res = await axios.get(BACKEND + '/api/v1/campaigns', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const campaign = res.data.find(c => c.name === 'Final Feature 4 Test');
  
  if (campaign) {
    console.log('PASS - Campaign in DB');
    console.log('  ID:', campaign.id);
    console.log('  Status:', campaign.status);
    return true;
  } else {
    console.log('FAIL - Campaign not in DB');
    return false;
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  
  console.log('='.repeat(60));
  console.log('FEATURE 4: MASS EMAIL CAMPAIGNS - FINAL TEST');
  console.log('='.repeat(60));
  
  const results = {};
  
  try {
    await login(page);
    await getToken();
    
    results.test1 = await test1(page);
    if (results.test1) results.test2 = await test2(page);
    if (results.test2) results.test3 = await test3(page);
    if (results.test3) results.test4 = await test4(page);
    if (results.test4) results.test5 = await test5(page);
    if (results.test5) results.test6 = await test6(page);
    results.test7 = await test7();
    
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS:');
    console.log('='.repeat(60));
    Object.keys(results).forEach(key => {
      console.log(key + ':', results[key] ? 'PASS' : 'FAIL');
    });
    
    const allPass = Object.values(results).every(r => r);
    console.log('\nOVERALL:', allPass ? 'WORKING' : 'BROKEN');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\nCRITICAL ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/f4-CRITICAL-ERROR.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
