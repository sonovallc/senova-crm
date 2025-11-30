const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('=== BUG-1 VERIFICATION TEST ===\n');
    
    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('   ✓ Logged in\n');
    
    // Navigate to inbox
    console.log('2. Navigating to Inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(4000);
    console.log('   ✓ At Inbox page\n');
    
    // Screenshot All tab
    console.log('3. Taking screenshot: All tab');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-done-1.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    const hasThreads = pageText.includes('From:') || pageText.includes('Subject:') || pageText.includes('@');
    console.log('   All tab has visible content:', hasThreads);
    console.log('   ✓ Screenshot saved\n');
    
    // Click Unread tab
    console.log('4. Clicking Unread tab...');
    await page.locator('text=Unread').first().click();
    await page.waitForTimeout(3000);
    console.log('   ✓ Unread tab clicked\n');
    
    // Screenshot Unread tab
    console.log('5. Taking screenshot: Unread tab');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-done-2.png', fullPage: true });
    
    const unreadPageText = await page.textContent('body');
    const unreadHasThreads = unreadPageText.includes('From:') || unreadPageText.includes('Subject:') || unreadPageText.includes('@');
    const isEmpty = unreadPageText.includes('No messages') || unreadPageText.includes('empty');
    console.log('   Unread tab has visible threads:', unreadHasThreads);
    console.log('   Unread tab shows empty state:', isEmpty);
    console.log('   ✓ Screenshot saved\n');
    
    // Click Read tab
    console.log('6. Clicking Read tab...');
    await page.locator('text=Read').first().click();
    await page.waitForTimeout(3000);
    console.log('   ✓ Read tab clicked\n');
    
    // Screenshot Read tab
    console.log('7. Taking screenshot: Read tab');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-done-3.png', fullPage: true });
    
    const readPageText = await page.textContent('body');
    const readHasThreads = readPageText.includes('From:') || readPageText.includes('Subject:') || readPageText.includes('@');
    const readIsEmpty = readPageText.includes('No messages') || readPageText.includes('empty');
    console.log('   Read tab has visible threads:', readHasThreads);
    console.log('   Read tab shows empty state:', readIsEmpty);
    console.log('   ✓ Screenshot saved\n');
    
    // Final verdict
    console.log('\n=== VERIFICATION RESULTS ===');
    console.log('All tab: Has threads =', hasThreads);
    console.log('Unread tab: Has threads =', unreadHasThreads);
    console.log('Read tab: Has threads =', readHasThreads);
    console.log('Read tab: Empty state =', readIsEmpty, '(expected if no read messages yet)');
    
    if (unreadHasThreads && !isEmpty) {
      console.log('\n✓✓✓ BUG-1 STATUS: FIXED');
      console.log('Unread tab now displays threads correctly!');
    } else {
      console.log('\n✗✗✗ BUG-1 STATUS: STILL BROKEN');
      console.log('Unread tab is still empty or showing no threads!');
    }
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-error-2.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
