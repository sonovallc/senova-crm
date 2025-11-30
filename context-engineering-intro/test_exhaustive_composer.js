const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots', 'exhaust-composer');
  
  console.log('
========================================');
  console.log('EXHAUSTIVE EMAIL COMPOSER TEST - STARTING');
  console.log('========================================
');

  try {
    // Login
    console.log('[LOGIN] Navigating to login page...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('[LOGIN] ✓ Logged in successfully
');

    // Navigate to composer
    console.log('[NAVIGATION] Going to email composer...');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('[NAVIGATION] ✓ At composer page
');

    // Take initial screenshot
    await page.screenshot({ path: path.join(screenshotDir, '01-template-list.png'), fullPage: true });
    console.log('Screenshot: 01-template-list.png');

    console.log('
========================================');
    console.log('TEST COMPLETE - CHECK SCREENSHOTS');
    console.log('========================================
');

  } catch (error) {
    console.error('
❌ ERROR DURING TESTING:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error-state.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();