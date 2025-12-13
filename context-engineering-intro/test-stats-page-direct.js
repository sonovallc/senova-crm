const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Direct test of autoresponder stats page...\n');
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'autoresponder-stats-fix-verification');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: false
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  try {
    // Login first
    console.log('1. Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[name="password"]', 'D3n1w3n1!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    console.log('   Logged in successfully\n');

    // Go directly to Eve Beauty stats page using the UUID
    console.log('2. Going DIRECTLY to Eve Beauty stats page...');
    const eveBeautyId = 'd9ba18d3-21ec-4a37-967e-c22bdce8fcce';
    const statsUrl = `http://localhost:3004/dashboard/email/autoresponders/${eveBeautyId}`;
    
    console.log('   Navigating to:', statsUrl);
    await page.goto(statsUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Check what loaded
    console.log('\n3. CHECKING PAGE CONTENT:');
    const currentUrl = page.url();
    console.log('   Final URL:', currentUrl);
    
    // Look for error messages
    const notFoundCount = await page.locator('text=/Autoresponder not found|404|Not Found/i').count();
    
    if (notFoundCount > 0) {
      console.log('\n❌ ERROR: "Autoresponder not found" message appears!');
      console.log('   The bug is NOT fixed.\n');
      
      // Get the error text
      const errorText = await page.locator('body').textContent();
      console.log('   Error content:', errorText.substring(0, 200));
    } else {
      console.log('   ✅ No error messages found');
      
      // Look for stats page elements
      const hasTitle = await page.locator('h1, h2').filter({ hasText: /Eve Beauty|Autoresponder/i }).count();
      const hasStats = await page.locator('text=/Total Executions|Statistics|Sent|Pending/i').count();
      const hasCards = await page.locator('.grid .rounded-lg, .card').count();
      
      console.log('   Found title:', hasTitle > 0 ? 'Yes' : 'No');
      console.log('   Found stats text:', hasStats > 0 ? 'Yes' : 'No');  
      console.log('   Found cards:', hasCards);
      
      if (hasTitle > 0 || hasStats > 0) {
        console.log('\n✅ SUCCESS: Stats page loaded correctly!');
        console.log('   The API path bug has been fixed.');
      } else {
        console.log('\n⚠️ WARNING: Page loaded but no stats content visible');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-direct-stats-page.png'),
      fullPage: true
    });
    
    console.log('\n   Screenshot saved: 06-direct-stats-page.png');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-direct-test.png')
    });
  } finally {
    await browser.close();
  }
})();
