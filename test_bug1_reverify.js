const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track API calls
  const apiCalls = [];
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      apiCalls.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  try {
    // 1. Login
    console.log('=== BUG-1 REVERIFICATION: Inbox Threads Always Show Unread ===\n');
    console.log('1. Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('   Login successful');

    // 2. Navigate to inbox
    console.log('2. Navigate to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/bug1-reverify-1-initial.png', fullPage: true });

    // 3. Count threads in list
    const threadItems = await page.locator('.cursor-pointer, [class*="thread"]').all();
    console.log('3. Total thread items found:', threadItems.length);

    // 4. Check for unread indicators (blue dots, bold text, etc.)
    const unreadIndicators = await page.locator('.bg-blue-500, [class*="unread"], .font-bold, .font-semibold').all();
    console.log('4. Unread indicators found:', unreadIndicators.length);

    // 5. Click on a thread to mark it as read
    console.log('5. Clicking on first thread to view/read it...');
    if (threadItems.length > 0) {
      await threadItems[0].click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'screenshots/bug1-reverify-2-thread-open.png', fullPage: true });

      // Check for "Mark as read" API call
      console.log('6. Checking API calls for mark-as-read...');
      const markReadCalls = apiCalls.filter(c =>
        c.url.includes('read') || c.url.includes('mark') || c.method === 'PATCH' || c.method === 'PUT'
      );
      console.log('   Mark-read related API calls:', markReadCalls.length);
      markReadCalls.forEach(c => console.log('   -', c.method, c.url, '->', c.status));
    }

    // 6. Navigate away and back
    console.log('7. Navigate away and back to inbox...');
    await page.goto('http://localhost:3004/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/bug1-reverify-3-after-return.png', fullPage: true });

    // 7. Check if the thread we viewed is now marked as read
    console.log('8. Checking thread status after viewing...');
    const unreadAfter = await page.locator('.bg-blue-500, [class*="unread"]').count();
    console.log('   Unread indicators after viewing:', unreadAfter);

    // 8. Try clicking Unread filter tab
    console.log('9. Clicking Unread filter tab...');
    const unreadTab = page.locator('button:has-text("Unread"), [role="tab"]:has-text("Unread")').first();
    if (await unreadTab.count() > 0) {
      await unreadTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug1-reverify-4-unread-tab.png', fullPage: true });

      const unreadThreadCount = await page.locator('.cursor-pointer, [class*="thread"]').count();
      console.log('   Threads in Unread tab:', unreadThreadCount);
    } else {
      console.log('   Unread tab not found');
    }

    // 9. Try clicking Read filter tab
    console.log('10. Clicking Read filter tab...');
    const readTab = page.locator('button:has-text("Read"), [role="tab"]:has-text("Read")').first();
    if (await readTab.count() > 0) {
      await readTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug1-reverify-5-read-tab.png', fullPage: true });

      const readThreadCount = await page.locator('.cursor-pointer, [class*="thread"]').count();
      console.log('   Threads in Read tab:', readThreadCount);
    } else {
      console.log('   Read tab not found');
    }

    // 10. Check page content for filter buttons
    console.log('\n11. Looking for all filter buttons...');
    const allButtons = await page.locator('button').allTextContents();
    const filterButtons = allButtons.filter(b =>
      b.includes('All') || b.includes('Unread') || b.includes('Read') || b.includes('Archived')
    );
    console.log('   Filter-related buttons:', filterButtons);

    // Print all API calls
    console.log('\n=== API CALLS DURING TEST ===');
    apiCalls.forEach(c => console.log(`${c.method} ${c.url} -> ${c.status}`));

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'screenshots/bug1-reverify-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
