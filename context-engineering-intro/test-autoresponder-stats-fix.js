const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting autoresponder stats fix verification test...');
  
  // Create screenshots directory
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'autoresponder-stats-fix-verification');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    console.log('Filling login credentials...');
    await page.fill('input[name="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[name="password"]', 'D3n1w3n1!');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login-filled.png'),
      fullPage: true 
    });
    
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-after-login.png'),
      fullPage: true 
    });
    console.log('Login successful');

    // Step 2: Navigate to Autoresponders List
    console.log('Step 2: Navigating to autoresponders list...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-autoresponders-list.png'),
      fullPage: true 
    });
    console.log('Autoresponders list loaded');

    // Step 3: Click stats link
    console.log('Step 3: Clicking stats link...');
    
    // Find the first stats link (should be Eve Beauty)
    const statsLink = await page.locator('a[href*="/dashboard/email/autoresponders/"]:not([href$="/autoresponders"])').first();
    
    if (await statsLink.count() > 0) {
      const href = await statsLink.getAttribute('href');
      console.log('Found stats link:', href);
      await statsLink.click();
      await page.waitForTimeout(3000);
    }

    // Step 4: Verify Stats Page
    console.log('Step 4: Verifying stats page...');
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check for errors
    const errorCount = await page.locator('text=/Autoresponder not found|404/i').count();
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-stats-page.png'),
      fullPage: true 
    });
    
    if (errorCount > 0) {
      console.log('ERROR: Page shows error message');
    } else {
      console.log('SUCCESS: Stats page loaded without errors');
      
      // Look for stats elements
      const statsCards = await page.locator('.rounded-lg').count();
      console.log('Found', statsCards, 'stats cards');
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-stats-page-full.png'),
        fullPage: true 
      });
    }
    
    // Summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log('Stats page loads:', errorCount === 0 ? 'PASS' : 'FAIL');

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-screenshot.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
    console.log('Test completed');
  }
})();
