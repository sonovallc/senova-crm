const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const dir = path.join(process.cwd(), 'testing', 'production-fixes');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let testResults = {
    navigationWorked: false,
    formLoadedWithoutErrors: false,
    allFieldsInteractive: false,
    overallStatus: 'FAIL'
  };
  
  let pageErrors = [];
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
    pageErrors.push(error.message);
  });

  try {
    console.log('=== BUG-003 FINAL VERIFICATION ===\n');
    
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Logged in\n');

    console.log('Step 2: Navigate to autoresponders list');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, 'BUG003-verified-01-list.png'), fullPage: true });
