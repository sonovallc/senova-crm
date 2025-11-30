const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Starting Activity Log Tests...\n');

  try {
    // Go directly to dashboard/activity-log
    console.log('TEST 1: Navigate to Activity Log directly');
    await page.goto('http://localhost:3004/dashboard/activity-log', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const screenshotPath1 = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug/activity_log_001_initial.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log('Screenshot saved: activity_log_001_initial.png\n');

    // Test 2: Check page content
    console.log('TEST 2: Check Activity Log page content');
    const pageUrl = page.url();
    console.log('  Current URL: ' + pageUrl);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('activity') || bodyText.includes('log') || bodyText.includes('Activity Log')) {
      console.log('  Page has activity log content: YES');
    } else {
      console.log('  Page has activity log content: NO (redirected or missing)');
      console.log('  Body preview: ' + bodyText.substring(0, 200));
    }
    console.log();

    // Test 3: Check table structure
    console.log('TEST 3: Check Table Structure');
    const tableStructure = await page.evaluate(() => {
      const headers = [];
      document.querySelectorAll('th').forEach(th => {
        headers.push(th.innerText.trim());
      });
      
      const rowCount = document.querySelectorAll('tbody tr').length;
      
      const rows = [];
      document.querySelectorAll('tbody tr').forEach((tr, idx) => {
        if (idx < 2) {
          const cells = [];
          tr.querySelectorAll('td').forEach(td => {
            cells.push(td.innerText.substring(0, 50));
          });
          rows.push(cells);
        }
      });
      
      return { headers, rowCount, rows };
    });
    
    console.log('  Table headers: ' + tableStructure.headers.join(' | '));
    console.log('  Total rows: ' + tableStructure.rowCount);
    if (tableStructure.rows.length > 0) {
      console.log('  Sample row 1: ' + tableStructure.rows[0].join(' | '));
      if (tableStructure.rows[1]) {
        console.log('  Sample row 2: ' + tableStructure.rows[1].join(' | '));
      }
    }
    console.log();

    // Test 4: Check for contact links
    console.log('TEST 4: Check for Contact Links');
    const linkInfo = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a').forEach(el => {
        const text = el.innerText.trim();
        if (text && text.length > 0 && text.length < 100) {
          const style = window.getComputedStyle(el);
          links.push({
            text: text,
            color: style.color,
            href: el.href
          });
        }
      });
      return links;
    });
    
    console.log('  Found ' + linkInfo.length + ' links');
    linkInfo.slice(0, 5).forEach((link, idx) => {
      console.log('    ' + (idx + 1) + '. "' + link.text + '" (color: ' + link.color + ')');
    });
    console.log();

    // Test 5: Try clicking a contact link
    console.log('TEST 5: Test Contact Link Navigation');
    const allLinks = await page.locator('a').all();
    if (allLinks.length > 0) {
      const firstLink = allLinks[0];
      const linkText = await firstLink.textContent();
      console.log('  Found ' + allLinks.length + ' links. Clicking first: "' + linkText.trim() + '"');
      
      try {
        const newPagePromise = context.waitForEvent('page');
        await firstLink.click();
        
        const newPage = await Promise.race([
          newPagePromise,
          new Promise(resolve => setTimeout(() => resolve(null), 2000))
        ]);
        
        if (newPage) {
          console.log('  Opened in new page');
        } else {
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }).catch(() => {});
          const newUrl = page.url();
          console.log('  Navigated to: ' + newUrl);
        }
        
        const screenshotPath2 = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug/activity_log_002_after_click.png';
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        console.log('  Screenshot saved: activity_log_002_after_click.png\n');
      } catch (e) {
        console.log('  Click did not navigate: ' + e.message + '\n');
      }
    } else {
      console.log('  No links found\n');
    }

    // Test 6: Scroll and check rendering
    console.log('TEST 6: Scroll and Check Rendering');
    await page.goto('http://localhost:3004/dashboard/activity-log', { waitUntil: 'networkidle' });
    
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await page.waitForTimeout(500);
    
    const screenshotPath3 = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug/activity_log_003_scrolled.png';
    await page.screenshot({ path: screenshotPath3, fullPage: true });
    console.log('  Screenshot saved: activity_log_003_scrolled.png\n');

    // Test 7: Check for console errors
    console.log('TEST 7: Check Console Errors');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', err => {
      errors.push(err.toString());
    });
    
    await page.goto('http://localhost:3004/dashboard/activity-log', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    if (errors.length > 0) {
      console.log('  Console errors found:');
      errors.forEach(err => console.log('    - ' + err));
    } else {
      console.log('  No console errors\n');
    }

    console.log('='.repeat(60));
    console.log('TESTS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('TEST FAILED:', error.message);
  }

  await context.close();
  await browser.close();
}

runTests().catch(console.error);
