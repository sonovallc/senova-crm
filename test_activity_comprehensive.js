const { chromium } = require('playwright');

const SCREENSHOT_DIR = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug';

async function runTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Starting Comprehensive Activity Log Tests\n');

  try {
    // Test 1: Navigate to Activity Log
    console.log('TEST 1: Navigate to Activity Log');
    await page.goto('http://localhost:3004/dashboard/activity-log', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    }).catch(e => null);
    
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('Current URL: ' + url);
    
    const screenshotPath1 = SCREENSHOT_DIR + '/activity_log_001_initial.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log('Screenshot saved: activity_log_001_initial.png\n');

    // Test 2: Check page content
    console.log('TEST 2: Check Page Content');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body text length: ' + bodyText.length);
    console.log('Has activity keyword: ' + bodyText.includes('Activity'));
    console.log('Preview: ' + bodyText.substring(0, 100) + '\n');

    // Test 3: Check table structure
    console.log('TEST 3: Check Table Structure');
    const tableInfo = await page.evaluate(() => {
      const headers = [];
      document.querySelectorAll('th').forEach(th => {
        headers.push(th.innerText.trim());
      });
      const rows = document.querySelectorAll('tbody tr').length;
      return { 
        hasTable: document.querySelector('table') !== null,
        headers: headers,
        rows: rows
      };
    });
    
    console.log('Has table: ' + tableInfo.hasTable);
    console.log('Headers: ' + tableInfo.headers.join(' | '));
    console.log('Rows: ' + tableInfo.rows + '\n');

    // Test 4: Check for contact links
    console.log('TEST 4: Check for Contact Links');
    const links = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('a').forEach(el => {
        const text = el.innerText.trim();
        if (text && text.length > 0 && text.length < 100) {
          result.push({
            text: text,
            href: el.href
          });
        }
      });
      return result;
    });
    
    console.log('Found ' + links.length + ' links');
    links.slice(0, 3).forEach((link, idx) => {
      console.log((idx + 1) + '. ' + link.text + ' -> ' + link.href);
    });
    console.log();

    // Test 5: Try clicking a link
    console.log('TEST 5: Test Link Click');
    const allLinks = await page.locator('a').all();
    if (allLinks.length > 0) {
      const firstLink = allLinks[0];
      const linkText = await firstLink.textContent();
      console.log('Clicking on: ' + linkText.trim());
      
      try {
        const waitNav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => null);
        await firstLink.click();
        await waitNav;
        
        const newUrl = page.url();
        console.log('Navigated to: ' + newUrl);
        
        const screenshotPath2 = SCREENSHOT_DIR + '/activity_log_002_after_click.png';
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        console.log('Screenshot: activity_log_002_after_click.png');
      } catch (e) {
        console.log('Click failed: ' + e.message);
      }
    }
    console.log();

    // Test 6: Scroll test
    console.log('TEST 6: Test Scrolling');
    await page.goto('http://localhost:3004/dashboard/activity-log', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    }).catch(e => null);
    
    const scrolled = await page.evaluate(() => {
      const before = window.scrollY;
      window.scrollBy(0, 500);
      return window.scrollY > before;
    });
    
    console.log('Scroll successful: ' + scrolled);
    
    const screenshotPath3 = SCREENSHOT_DIR + '/activity_log_003_scrolled.png';
    await page.screenshot({ path: screenshotPath3, fullPage: true });
    console.log('Screenshot: activity_log_003_scrolled.png\n');

    // Test 7: Console errors
    console.log('TEST 7: Check Console Errors');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3004/dashboard/activity-log', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    }).catch(e => null);
    
    await page.waitForTimeout(2000);
    
    console.log('Console errors: ' + errors.length);
    if (errors.length > 0) {
      errors.slice(0, 3).forEach((err, idx) => {
        console.log((idx + 1) + '. ' + err.substring(0, 80));
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('TESTS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('ERROR:', error.message);
  }

  await context.close();
  await browser.close();
}

runTests().catch(console.error);
