const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join('C:', 'Users', 'jwood', 'Documents', 'Projects', 'claude-code-agents-wizard-v2', 'screenshots', 'final-verification');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    const msgText = msg.type() + ': ' + msg.text();
    consoleMessages.push(msgText);
    console.log('Browser console:', msgText);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('Page error:', error.message);
  });

  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('Step 3: Navigating to campaigns page...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'domcontentloaded' });
    
    console.log('Waiting 5 seconds for page to load...');
    await page.waitForTimeout(5000);

    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug4-investigate-page.png'),
      fullPage: true 
    });

    const pageContent = await page.content();
    console.log('\n=== PAGE HTML (first 500 chars) ===');
    console.log(pageContent.substring(0, 500));

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== PAGE ERRORS ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No JavaScript errors detected');
    }

    const loadingText = await page.locator('text=Loading').count();
    const campaignsHeader = await page.locator('h1, h2, h3').count();
    const tableRows = await page.locator('table tbody tr').count();

    console.log('\n=== PAGE STATE ===');
    console.log('Loading text visible:', loadingText > 0);
    console.log('Headers found:', campaignsHeader);
    console.log('Table rows found:', tableRows);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug4-investigate-error.png'),
      fullPage: true 
    });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
