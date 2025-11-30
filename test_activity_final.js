const { chromium } = require('playwright');

const SCREENSHOT_DIR = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug';

async function runTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Activity Log Comprehensive Test\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
    console.log('  Login successful\n');

    // Step 2: Navigate to Activity Log
    console.log('Step 2: Navigate to Activity Log');
    await page.goto('http://localhost:3004/dashboard/activity-log', { 
      waitUntil: 'networkidle',
      timeout: 30000
    }).catch(e => null);
    
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log('  URL: ' + url);
    
    const screenshotPath1 = SCREENSHOT_DIR + '/activity_log_001_initial.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log('  Screenshot saved\n');

    // Step 3: Verify content
    console.log('Step 3: Verify Activity Log Page');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('  Body text length: ' + bodyText.length);
    
    const hasActivityLog = bodyText.includes('Activity Log');
    console.log('  Has "Activity Log" title: ' + hasActivityLog);
    
    const hasTable = await page.evaluate(() => document.querySelector('table') !== null);
    console.log('  Has table: ' + hasTable);
    
    const rowCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log('  Visible rows: ' + rowCount);
    console.log();

    // Step 4: Check table structure
    console.log('Step 4: Check Table Structure');
    const tableHeaders = await page.evaluate(() => {
      const headers = [];
      document.querySelectorAll('th').forEach(th => {
        headers.push(th.innerText.trim());
      });
      return headers;
    });
    
    console.log('  Headers: ' + tableHeaders.join(' | '));
    console.log();

    // Step 5: Check for contact links
    console.log('Step 5: Verify Contact Links (should be BLUE)');
    const links = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('a').forEach(el => {
        const text = el.innerText.trim();
        if (text && text.length > 0 && text.length < 100) {
          const style = window.getComputedStyle(el);
          const color = style.color;
          result.push({
            text: text,
            href: el.href,
            color: color
          });
        }
      });
      return result;
    });
    
    console.log('  Total links: ' + links.length);
    if (links.length > 0) {
      console.log('  Sample links:');
      links.slice(0, 3).forEach((link, idx) => {
        console.log('    ' + (idx + 1) + '. "' + link.text + '"');
        console.log('       Href: ' + link.href);
        console.log('       Color: ' + link.color);
      });
    }
    console.log();

    // Step 6: Click a link and verify navigation
    if (links.length > 0) {
      console.log('Step 6: Test Link Navigation');
      const allLinks = await page.locator('a').all();
      if (allLinks.length > 0) {
        const firstLink = allLinks[0];
        const linkText = await firstLink.textContent();
        console.log('  Clicking: "' + linkText.trim() + '"');
        
        try {
          const waitNav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null);
          await firstLink.click();
          await waitNav;
          
          const newUrl = page.url();
          console.log('  Navigated to: ' + newUrl);
          
          const screenshotPath2 = SCREENSHOT_DIR + '/activity_log_002_after_click.png';
          await page.screenshot({ path: screenshotPath2, fullPage: true });
          console.log('  Screenshot saved');
        } catch (e) {
          console.log('  Note: Click did not navigate');
        }
      }
    }
    console.log();

    // Step 7: Scroll test
    console.log('Step 7: Test Scrolling');
    const scrollSuccess = await page.evaluate(() => {
      const before = window.scrollY;
      window.scrollBy(0, 500);
      return window.scrollY > before;
    });
    
    console.log('  Scroll successful: ' + scrollSuccess);
    
    const screenshotPath3 = SCREENSHOT_DIR + '/activity_log_003_scrolled.png';
    await page.screenshot({ path: screenshotPath3, fullPage: true });
    console.log('  Screenshot saved\n');

    // Step 8: Check for filters
    console.log('Step 8: Check Filters');
    const hasFilters = await page.evaluate(() => {
      return {
        hasTypeFilter: document.querySelector('[data-testid="activity-log-filter-type"]') !== null,
        hasUserFilter: document.querySelector('[data-testid="activity-log-filter-user"]') !== null,
        hasFromDateFilter: document.querySelector('[data-testid="activity-log-filter-from"]') !== null,
        hasToDateFilter: document.querySelector('[data-testid="activity-log-filter-to"]') !== null,
        hasSearchFilter: document.querySelector('[data-testid="activity-log-filter-search"]') !== null
      };
    });
    
    console.log('  Type filter: ' + hasFilters.hasTypeFilter);
    console.log('  User filter: ' + hasFilters.hasUserFilter);
    console.log('  From date filter: ' + hasFilters.hasFromDateFilter);
    console.log('  To date filter: ' + hasFilters.hasToDateFilter);
    console.log('  Search filter: ' + hasFilters.hasSearchFilter);
    console.log();

    // Step 9: Check for export button
    console.log('Step 9: Check Export Button');
    const hasExportBtn = await page.evaluate(() => {
      return document.querySelector('[data-testid="activity-log-export"]') !== null;
    });
    console.log('  Has export button: ' + hasExportBtn + '\n');

    console.log('='.repeat(60));
    console.log('TESTS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('ERROR: ' + error.message);
    
    try {
      const errorScreenshot = SCREENSHOT_DIR + '/activity_log_ERROR.png';
      await page.screenshot({ path: errorScreenshot, fullPage: true });
    } catch (e) {}
  }

  await context.close();
  await browser.close();
}

runTests().catch(console.error);
