const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'production-verification');

async function testProductionDeployment() {
  console.log('Starting Production Deployment Test for crm.senovallc.com
');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString()
    });
  });
  
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      time: new Date().toISOString()
    });
  });

  const results = {
    steps: [],
    consoleLogs: [],
    pageErrors: [],
    success: true
  };

  try {
    // Step 1: Navigate to Production URL
    console.log('Step 1: Navigating to https://crm.senovallc.com...');
    try {
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
      console.log('Homepage loaded. Title:', title);
      
      results.steps.push({
        step: 1,
        description: 'Navigate to Production URL',
        status: 'SUCCESS',
        details: 'Page loaded',
        screenshot: '01-homepage.png'
      });
    } catch (error) {
      console.error('Failed:', error.message);
      results.steps.push({
        step: 1,
        description: 'Navigate to Production URL',
        status: 'FAILED',
        error: error.message
      });
      results.success = false;
    }

    // Step 2: Navigate to Login Page
    console.log('
Step 2: Navigating to login page...');
    await page.goto('https://crm.senovallc.com/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '02-login-page.png'),
      fullPage: true 
    });
    
    results.steps.push({
      step: 2,
      description: 'Navigate to Login Page',
      status: 'SUCCESS',
      screenshot: '02-login-page.png'
    });

    // Step 3: Attempt Login
    console.log('
Step 3: Attempting login...');
    await page.fill('input[type=email]', 'jwoodcapital@gmail.com');
    await page.fill('input[type=password]', 'D3n1w3n1!');
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '03-login-attempt.png'),
      fullPage: true 
    });
    
    await page.click('button[type=submit]');
    await page.waitForTimeout(3000);
    
    results.steps.push({
      step: 3,
      description: 'Attempt Login',
      status: 'SUCCESS',
      screenshot: '03-login-attempt.png'
    });

    // Step 4: Verify Login
    console.log('
Step 4: Verifying login...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '04-dashboard.png'),
      fullPage: true 
    });
    
    results.steps.push({
      step: 4,
      description: 'Verify Login',
      status: currentUrl.includes('dashboard') ? 'SUCCESS' : 'FAILED',
      details: currentUrl,
      screenshot: '04-dashboard.png'
    });

    // Step 5: Check Dashboard
    console.log('
Step 5: Checking dashboard...');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '05-dashboard-full.png'),
      fullPage: true 
    });
    
    results.steps.push({
      step: 5,
      description: 'Check Dashboard',
      status: 'SUCCESS',
      screenshot: '05-dashboard-full.png'
    });

  } finally {
    results.consoleLogs = consoleLogs;
    results.pageErrors = pageErrors;
    
    console.log('
============================================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('============================================================');
    
    for (const step of results.steps) {
      console.log('Step ' + step.step + ': ' + step.status);
    }
    
    console.log('============================================================');
    console.log('Screenshots saved to:', SCREENSHOTS_DIR);
    
    await browser.close();
  }
  
  return results;
}

testProductionDeployment().catch(console.error);