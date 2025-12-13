const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting autoresponder stats page verification...');
  
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
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('\n1. LOGIN');
    console.log('   Going to login page...');
    await page.goto('http://localhost:3004/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(1000);
    
    console.log('   Entering credentials...');
    await page.fill('input[name="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[name="password"]', 'D3n1w3n1!');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login-filled.png')
    });
    
    console.log('   Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for any navigation
    await page.waitForTimeout(5000);
    
    const afterLoginUrl = page.url();
    console.log('   After login URL:', afterLoginUrl);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-after-login.png')
    });

    // Step 2: Go to autoresponders
    console.log('\n2. AUTORESPONDERS LIST');
    console.log('   Navigating to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-autoresponders-list.png')
    });
    
    // Count autoresponders
    const rows = await page.locator('tbody tr').count();
    console.log('   Found', rows, 'autoresponders in list');

    // Step 3: Click the stats link for Eve Beauty
    console.log('\n3. CLICK STATS LINK');
    
    // Look for Eve Beauty row first
    const eveRow = await page.locator('tr:has-text("Eve Beauty")');
    if (await eveRow.count() > 0) {
      console.log('   Found Eve Beauty autoresponder');
      // Find the link in that row
      const linkInRow = eveRow.locator('a[href*="/dashboard/email/autoresponders/"]').first();
      if (await linkInRow.count() > 0) {
        const href = await linkInRow.getAttribute('href');
        console.log('   Clicking stats link:', href);
        await linkInRow.click();
      }
    } else {
      // Fallback: click first available stats link
      console.log('   Eve Beauty not found, clicking first stats link...');
      const firstLink = await page.locator('a[href*="/dashboard/email/autoresponders/"]:has-text("d9ba18d3")').first();
      if (await firstLink.count() > 0) {
        await firstLink.click();
      } else {
        // Try any stats link
        await page.locator('a[href^="/dashboard/email/autoresponders/"][href*="-"]').first().click();
      }
    }
    
    await page.waitForTimeout(3000);

    // Step 4: Check if stats page loaded
    console.log('\n4. VERIFY STATS PAGE');
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // Check for error messages
    const notFoundText = await page.locator('text="Autoresponder not found"').count();
    const error404 = await page.locator('text="404"').count();
    
    console.log('   "Not found" errors:', notFoundText);
    console.log('   "404" errors:', error404);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-stats-page-result.png')
    });
    
    if (notFoundText === 0 && error404 === 0) {
      console.log('   ✅ NO ERRORS - Page loaded successfully!');
      
      // Look for stats content
      const hasStats = await page.locator('text=/Total Executions|Sent|Pending|Failed/i').count();
      console.log('   Stats elements found:', hasStats);
      
      // Look for the header
      const header = await page.locator('h1, h2').first().textContent();
      console.log('   Page header:', header);
      
      // Scroll to capture full page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-stats-page-full.png')
      });
      
      console.log('\n✅ SUCCESS: Stats page is working!');
      console.log('The API path fix has resolved the issue.');
    } else {
      console.log('   ❌ ERROR FOUND - Page still showing "not found"');
      console.log('\n❌ FAILURE: Bug is not fixed');
    }

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-screenshot.png')
    });
  } finally {
    await browser.close();
    console.log('\nTest complete. Screenshots saved to:', screenshotDir);
  }
})();
