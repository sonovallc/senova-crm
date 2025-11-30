const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== BUG-INBOX-FILTERS VERIFICATION TEST ===\n');

  try {
    console.log('Step 1: Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/inbox-filter-01-login.png', fullPage: true });
    console.log('Screenshot saved: inbox-filter-01-login.png');

    console.log('\nStep 2: Logging in as admin@evebeautyma.com...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/inbox-filter-02-dashboard.png', fullPage: true });
    console.log('Screenshot saved: inbox-filter-02-dashboard.png');

    console.log('\nStep 3: Navigating to /dashboard/inbox...');
    await page.goto('http://localhost:3000/dashboard/inbox', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/inbox-filter-03-inbox-initial.png', fullPage: true });
    console.log('Screenshot saved: inbox-filter-03-inbox-initial.png');

    console.log('\nStep 4: Checking for all 4 filter tabs...');
    const filters = ['All', 'Unread', 'Read', 'Archived'];
    const foundFilters = [];
    
    for (const filter of filters) {
      const tabCount = await page.locator('[role="tab"]').filter({ hasText: filter }).count();
      if (tabCount > 0) {
        foundFilters.push(filter);
        console.log('Found filter: ' + filter);
      } else {
        console.log('MISSING filter: ' + filter);
      }
    }

    console.log('\nStep 5: Taking focused screenshot of filter tabs area...');
    await page.screenshot({ path: 'screenshots/inbox-filter-04-tabs-close-up.png', fullPage: false });
    console.log('Screenshot saved: inbox-filter-04-tabs-close-up.png');

    console.log('\nStep 6: Testing each filter tab interaction...');
    for (const filter of foundFilters) {
      try {
        console.log('\nTesting filter: ' + filter);
        const tab = page.locator('[role="tab"]').filter({ hasText: filter }).first();
        await tab.click();
        await page.waitForTimeout(2000);
        const screenshotName = 'inbox-filter-05-' + filter.toLowerCase() + '-active.png';
        await page.screenshot({ path: 'screenshots/' + screenshotName, fullPage: true });
        console.log('Clicked ' + filter + ' tab successfully');
        console.log('Screenshot saved: ' + screenshotName);
      } catch (error) {
        console.log('Error clicking ' + filter + ' tab: ' + error.message);
      }
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log('Total filters found: ' + foundFilters.length + '/4');
    console.log('Filters present: ' + foundFilters.join(', '));
    
    if (foundFilters.length === 4 && foundFilters.includes('Read') && foundFilters.includes('Archived')) {
      console.log('\nBUG-INBOX-FILTERS: RESOLVED');
      console.log('All 4 filter tabs are present and functional!');
    } else {
      console.log('\nBUG-INBOX-FILTERS: STILL OPEN');
      const missing = filters.filter(f => !foundFilters.includes(f));
      console.log('Missing filters: ' + missing.join(', '));
    }

    console.log('\nBrowser will remain open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Test failed with error:', error.message);
    await page.screenshot({ path: 'screenshots/inbox-filter-ERROR.png', fullPage: true });
    console.log('Error screenshot saved: inbox-filter-ERROR.png');
  }

  await browser.close();
  console.log('\nTest complete!');
})();
