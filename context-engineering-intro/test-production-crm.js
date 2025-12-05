const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'production-verification');

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function testProductionDeployment() {
  console.log('Starting Production Deployment Test for crm.senovallc.com');
  console.log('============================================================\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleLogs.push(msg.text());
    }
  });
  
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  const results = {
    steps: [],
    success: true
  };

  try {
    // Step 1: Navigate to Production URL
    console.log('Step 1: Navigating to https://crm.senovallc.com...');
    await page.goto('https://crm.senovallc.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '01-homepage.png'),
      fullPage: true 
    });
    const title = await page.title();
    console.log('  ✓ Homepage loaded. Title: ' + title);
    results.steps.push({ step: 1, status: 'SUCCESS' });

    // Step 2: Navigate to Login Page
    console.log('\nStep 2: Navigating to login page...');
    await page.goto('https://crm.senovallc.com/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '02-login-page.png'),
      fullPage: true 
    });
    console.log('  ✓ Login page loaded');
    results.steps.push({ step: 2, status: 'SUCCESS' });

    // Step 3: Attempt Login
    console.log('\nStep 3: Attempting login with credentials...');
    const emailInput = await page.locator('input[type="email"]').first();
    await emailInput.fill('jwoodcapital@gmail.com');
    
    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill('D3n1w3n1!');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '03-login-attempt.png'),
      fullPage: true 
    });
    
    const submitButton = await page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    console.log('  ✓ Login credentials submitted');
    results.steps.push({ step: 3, status: 'SUCCESS' });
    
    // Wait for navigation
    await page.waitForTimeout(5000);

    // Step 4: Verify Successful Login
    console.log('\nStep 4: Verifying successful login...');
    const currentUrl = page.url();
    console.log('  Current URL: ' + currentUrl);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '04-dashboard.png'),
      fullPage: true 
    });
    
    if (currentUrl.includes('dashboard')) {
      console.log('  ✓ Successfully redirected to dashboard');
      results.steps.push({ step: 4, status: 'SUCCESS' });
    } else {
      console.log('  ✗ Not redirected to dashboard');
      results.steps.push({ step: 4, status: 'FAILED' });
      results.success = false;
    }

    // Step 5: Check Dashboard Functionality
    console.log('\nStep 5: Checking dashboard functionality...');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '05-dashboard-full.png'),
      fullPage: true 
    });
    console.log('  ✓ Dashboard screenshot captured');
    results.steps.push({ step: 5, status: 'SUCCESS' });

  } catch (error) {
    console.error('\nError occurred:', error.message);
    results.success = false;
  } finally {
    // Print summary
    console.log('\n============================================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('============================================================');
    
    results.steps.forEach(s => {
      const icon = s.status === 'SUCCESS' ? '✓' : '✗';
      console.log(icon + ' Step ' + s.step + ': ' + s.status);
    });
    
    if (consoleLogs.length > 0) {
      console.log('\nConsole Errors:');
      consoleLogs.forEach(log => console.log('  - ' + log));
    }
    
    if (pageErrors.length > 0) {
      console.log('\nPage Errors:');
      pageErrors.forEach(err => console.log('  - ' + err));
    }
    
    console.log('\nOverall Status: ' + (results.success ? 'PASSED' : 'FAILED'));
    console.log('Screenshots saved to: ' + SCREENSHOTS_DIR);
    console.log('============================================================');
    
    await browser.close();
  }
}

testProductionDeployment().catch(console.error);
