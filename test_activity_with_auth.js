const { chromium } = require('playwright');

const SCREENSHOT_DIR = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug';

async function runTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Activity Log Test with Authentication\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login to EVE CRM');
    await page.goto('http://localhost:3004/auth/sign-in', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });
    
    // Fill email
    const emailInput = await page.$('input[name="email"]') || await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.fill('admin@evebeautyma.com');
      console.log('  Filled email');
    }
    
    // Fill password
    const passwordInput = await page.$('input[name="password"]') || await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('TestPass123!');
      console.log('  Filled password');
    }
    
    // Click sign in
    await page.click('button:has-text("Sign in"), button[type="submit"]');
    console.log('  Clicked sign in');
    
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(2000);
    
    console.log('  Login complete\n');

    // Step 2: Navigate to Activity Log
    console.log('Step 2: Navigate to Activity Log');
    await page.goto('http://localhost:3004/dashboard/activity-log', { 
      waitUntil: 'networkidle',
      timeout: 30000
    }).catch(e => console.log('Navigate: ' + e.message));
    
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log('  Current URL: ' + url);
    
    const screenshotPath1 = SCREENSHOT_DIR + '/activity_log_authenticated_001.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log('  Screenshot: activity_log_authenticated_001.png\n');

    // Step 3: Verify page loaded
    console.log('Step 3: Verify Activity Log Page');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('  Body text length: ' + bodyText.length);
    console.log('  Preview: ' + bodyText.substring(0, 150));
    
    const hasActivityLog = bodyText.includes('Activity Log') || bodyText.includes('activity');
    console.log('  Has Activity Log content: ' + hasActivityLog + '\n');

    // Step 4: Check table structure
    console.log('Step 4: Check Table Structure');
    const tableInfo = await page.evaluate(() => {
      const headers = [];
      document.querySelectorAll('th').forEach(th => {
        headers.push(th.innerText.trim());
      });
      const rows = document.querySelectorAll('tbody tr').length;
      return {
        hasTable: document.querySelector('table') !== null,
        headers: headers,
        rowCount: rows
      };
    });
    
    console.log('  Has table: ' + tableInfo.hasTable);
    console.log('  Headers: ' + tableInfo.headers.join(' | '));
    console.log('  Rows: ' + tableInfo.rowCount + '\n');

    // Step 5: Check contact links
    console.log('Step 5: Check Contact Links');
    const links = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('a').forEach(el => {
        const text = el.innerText.trim();
        if (text && text.length > 0 && text.length < 100) {
          result.push({
            text: text,
            href: el.href,
            color: window.getComputedStyle(el).color
          });
        }
      });
      return result;
    });
    
    console.log('  Total links: ' + links.length);
    if (links.length > 0) {
      console.log('  Sample links:');
      links.slice(0, 3).forEach((link, idx) => {
        console.log('    ' + (idx + 1) + '. ' + link.text);
        console.log('       Color: ' + link.color);
      });
    }
    console.log();

    // Step 6: Try clicking first link
    if (links.length > 0) {
      console.log('Step 6: Test Link Navigation');
      const allLinks = await page.locator('a').all();
      if (allLinks.length > 0) {
        const firstLink = allLinks[0];
        const linkText = await firstLink.textContent();
        console.log('  Clicking: ' + linkText.trim());
        
        try {
          const waitNav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null);
          await firstLink.click();
          await waitNav;
          
          const newUrl = page.url();
          console.log('  Navigated to: ' + newUrl);
          
          const screenshotPath2 = SCREENSHOT_DIR + '/activity_log_authenticated_002.png';
          await page.screenshot({ path: screenshotPath2, fullPage: true });
          console.log('  Screenshot: activity_log_authenticated_002.png');
        } catch (e) {
          console.log('  Click error: ' + e.message);
        }
      }
    }
    console.log();

    // Step 7: Scroll test
    console.log('Step 7: Test Scrolling');
    await page.goto('http://localhost:3004/dashboard/activity-log', { 
      waitUntil: 'networkidle',
      timeout: 30000
    }).catch(e => null);
    
    const scrollResult = await page.evaluate(() => {
      const before = window.scrollY;
      window.scrollBy(0, 500);
      return { scrolled: window.scrollY > before };
    });
    
    console.log('  Scroll successful: ' + scrollResult.scrolled);
    
    const screenshotPath3 = SCREENSHOT_DIR + '/activity_log_authenticated_003.png';
    await page.screenshot({ path: screenshotPath3, fullPage: true });
    console.log('  Screenshot: activity_log_authenticated_003.png\n');

    console.log('='.repeat(60));
    console.log('TESTS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('ERROR: ' + error.message);
    
    const errorScreenshot = SCREENSHOT_DIR + '/activity_log_ERROR.png';
    try {
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      console.log('Error screenshot saved');
    } catch (e) {
      console.log('Could not save error screenshot');
    }
  }

  await context.close();
  await browser.close();
}

runTests().catch(console.error);
