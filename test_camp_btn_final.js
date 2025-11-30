const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testLogin() {
  console.log('LOGIN FLOW TEST
');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const dir = 'screenshots/login-test';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const results = { steps: [], errors: [], success: false };
  
  try {
    console.log('Step 1: Navigate to http://localhost:3004');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '01-initial.png'), fullPage: true });
    console.log('  URL:', page.url());
    results.steps.push('Navigate: SUCCESS');
    
    console.log('
Step 2: Fill email');
    await page.fill('input[type=email]', 'admin@evebeautyma.com');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '02-email-filled.png'), fullPage: true });
    console.log('  Email filled');
    results.steps.push('Fill email: SUCCESS');
    
    console.log('
Step 3: Fill password');
    await page.fill('input[type=password]', 'TestPass123!');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '03-password-filled.png'), fullPage: true });
    console.log('  Password filled');
    results.steps.push('Fill password: SUCCESS');
    
    console.log('
Step 4: Click submit');
    await page.screenshot({ path: path.join(dir, '04-before-submit.png'), fullPage: true });
    await page.click('button[type=submit]');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '05-after-submit.png'), fullPage: true });
    results.steps.push('Submit: SUCCESS');
    
    console.log('
Step 5: Check result');
