const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== BUG-1 FIX VERIFICATION: Read/Unread Tabs ===\n');
    
    console.log('1. Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('Logged in successfully\n');
    
    console.log('2. Navigating to Inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    console.log('At Inbox page\n');
    
    console.log('3. Testing All tab...');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-fix-1.png', fullPage: true });
    const allThreads = await page.locator('.space-y-2 > div').count();
    console.log('  Total threads in All tab: ' + allThreads);
    
    const unreadBadges = await page.locator('text="New"').count();
    const blueBackgrounds = await page.locator('.bg-blue-50').count();
    console.log('  Visual indicators - New badges: ' + unreadBadges + ', Blue backgrounds: ' + blueBackgrounds + '\n');
    
    console.log('4. Clicking Unread tab...');
    await page.click('button:has-text("Unread")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-fix-2.png', fullPage: true });
    const unreadThreads = await page.locator('.space-y-2 > div').count();
    console.log('  Threads in Unread tab: ' + unreadThreads + '\n');
    
    console.log('5. Clicking Read tab...');
    await page.click('button:has-text("Read")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-fix-3.png', fullPage: true });
    const readThreads = await page.locator('.space-y-2 > div').count();
    console.log('  Threads in Read tab: ' + readThreads + '\n');
    
    console.log('6. Going back to All tab and selecting first thread...');
    await page.click('button:has-text("All")');
    await page.waitForTimeout(2000);
    const firstThread = page.locator('.space-y-2 > div').first();
    await firstThread.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-fix-4.png', fullPage: true });
    console.log('  Opened thread\n');
    
    console.log('7. Waiting 5 seconds for read status update...');
    await page.waitForTimeout(5000);
    
    console.log('8. Checking Unread tab after viewing...');
    await page.click('button:has-text("Unread")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-fix-5.png', fullPage: true });
    const unreadAfter = await page.locator('.space-y-2 > div').count();
    console.log('  Threads in Unread AFTER viewing: ' + unreadAfter + ' (was ' + unreadThreads + ')\n');
    
    console.log('9. Checking Read tab after viewing...');
    await page.click('button:has-text("Read")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-fix-6.png', fullPage: true });
    const readAfter = await page.locator('.space-y-2 > div').count();
    console.log('  Threads in Read AFTER viewing: ' + readAfter + ' (was ' + readThreads + ')\n');
    
    console.log('\n=== CRITICAL TEST RESULTS ===\n');
    
    console.log('Test 1: Do Unread and Read tabs show DIFFERENT threads?');
    console.log('  All: ' + allThreads + ', Unread: ' + unreadThreads + ', Read: ' + readThreads);
    const test1 = unreadThreads !== readThreads;
    console.log('  RESULT: ' + (test1 ? 'PASS - Different counts' : 'FAIL - Same counts') + '\n');
    
    console.log('Test 2: After viewing, does thread move from Unread to Read?');
    console.log('  Unread: ' + unreadThreads + ' -> ' + unreadAfter);
    console.log('  Read: ' + readThreads + ' -> ' + readAfter);
    const test2 = (unreadAfter < unreadThreads) && (readAfter > readThreads);
    console.log('  RESULT: ' + (test2 ? 'PASS - Thread moved' : 'FAIL - Thread did not move') + '\n');
    
    console.log('Test 3: Are there visual indicators for unread?');
    console.log('  New badges: ' + unreadBadges + ', Blue backgrounds: ' + blueBackgrounds);
    const test3 = unreadBadges > 0 || blueBackgrounds > 0;
    console.log('  RESULT: ' + (test3 ? 'PASS - Visual indicators present' : 'FAIL - No visual indicators') + '\n');
    
    const allPass = test1 && test2 && test3;
    console.log('\n=== FINAL VERDICT ===');
    console.log(allPass ? 'BUG-1 FIXED - All tests passed!' : 'BUG-1 STILL BROKEN - Some tests failed');
    console.log('Screenshots saved to: screenshots/round2-bugfix/bug-1-fix-*.png');
    
  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/error.png' });
  } finally {
    await browser.close();
  }
})();
