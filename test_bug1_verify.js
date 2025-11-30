const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Step 1: Navigate to login page...');
  await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2000);

  console.log('Step 2: Login with credentials...');
  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 90000 });
  await page.waitForTimeout(2000);

  console.log('Step 3: Navigate to inbox...');
  await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);

  console.log('Step 4: Screenshot inbox with threads...');
  await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-verify-1-inbox.png', fullPage: true });

  console.log('Step 5: DESCRIBE - Looking for unread indicators...');
  const threads = await page.$$('.thread-item, [class*="thread"], [class*="Thread"]');
  console.log(`Found ${threads.length} potential thread elements`);

  // Get thread info
  const threadInfo = await page.evaluate(() => {
    const threadElements = Array.from(document.querySelectorAll('.thread-item, [class*="thread"], [class*="Thread"], [role="button"]'));
    return threadElements.slice(0, 5).map((el, idx) => {
      const hasBlue = el.classList.toString().includes('blue') || 
                      window.getComputedStyle(el).backgroundColor.includes('rgb(59, 130, 246)') ||
                      window.getComputedStyle(el).backgroundColor.includes('rgb(37, 99, 235)');
      const hasBold = window.getComputedStyle(el).fontWeight >= 600;
      const hasNewBadge = el.textContent.includes('New') || el.textContent.includes('Unread');
      const text = el.textContent.substring(0, 100);
      
      return {
        index: idx,
        hasBlueBackground: hasBlue,
        hasBoldText: hasBold,
        hasNewBadge: hasNewBadge,
        preview: text,
        classes: el.className
      };
    });
  });
  
  console.log('Thread visual indicators:');
  console.log(JSON.stringify(threadInfo, null, 2));

  console.log('Step 6: Click on an INBOUND thread...');
  // Try to click the first visible thread
  const firstThread = await page.$('.thread-item, [class*="thread"], [class*="Thread"]');
  if (!firstThread) {
    console.log('ERROR: No thread found to click');
    await browser.close();
    return;
  }
  
  const threadName = await page.evaluate(el => el.textContent.substring(0, 50), firstThread);
  console.log(`Clicking thread: ${threadName}`);
  await firstThread.click();
  await page.waitForTimeout(2000);

  console.log('Step 7: Screenshot thread open...');
  await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-verify-2-thread.png', fullPage: true });
  console.log(`Step 8: DESCRIBE - Clicked thread: ${threadName}`);

  console.log('Step 9: Wait 5 seconds for API to complete...');
  await page.waitForTimeout(5000);

  console.log('Step 10: Navigate away to dashboard...');
  await page.goto('http://localhost:3004/dashboard', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2000);

  console.log('Step 11: Navigate back to inbox...');
  await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);

  console.log('Step 12: Screenshot inbox after viewing...');
  await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-verify-3-after.png', fullPage: true });

  console.log('Step 13: DESCRIBE - Check if thread changed from unread to read...');
  const threadInfoAfter = await page.evaluate(() => {
    const threadElements = Array.from(document.querySelectorAll('.thread-item, [class*="thread"], [class*="Thread"], [role="button"]'));
    return threadElements.slice(0, 5).map((el, idx) => {
      const hasBlue = el.classList.toString().includes('blue') || 
                      window.getComputedStyle(el).backgroundColor.includes('rgb(59, 130, 246)') ||
                      window.getComputedStyle(el).backgroundColor.includes('rgb(37, 99, 235)');
      const hasBold = window.getComputedStyle(el).fontWeight >= 600;
      const hasNewBadge = el.textContent.includes('New') || el.textContent.includes('Unread');
      const text = el.textContent.substring(0, 100);
      
      return {
        index: idx,
        hasBlueBackground: hasBlue,
        hasBoldText: hasBold,
        hasNewBadge: hasNewBadge,
        preview: text,
        classes: el.className
      };
    });
  });
  
  console.log('Thread visual indicators AFTER viewing:');
  console.log(JSON.stringify(threadInfoAfter, null, 2));

  console.log('Step 14: Click Unread tab...');
  const unreadTab = await page.$('button:has-text("Unread"), [role="tab"]:has-text("Unread")');
  if (unreadTab) {
    await unreadTab.click();
    await page.waitForTimeout(2000);
    console.log('Step 15: Screenshot Unread tab...');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-verify-4-unread.png', fullPage: true });
    
    const unreadThreads = await page.evaluate(() => {
      const threads = Array.from(document.querySelectorAll('.thread-item, [class*="thread"], [class*="Thread"], [role="button"]'));
      return threads.map(el => el.textContent.substring(0, 50));
    });
    console.log('Step 16: DESCRIBE - Threads in Unread tab:');
    console.log(JSON.stringify(unreadThreads, null, 2));
  } else {
    console.log('WARNING: Unread tab not found');
  }

  console.log('Step 17: Click Read tab...');
  const readTab = await page.$('button:has-text("Read"), [role="tab"]:has-text("Read")');
  if (readTab) {
    await readTab.click();
    await page.waitForTimeout(2000);
    console.log('Step 18: Screenshot Read tab...');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-verify-5-read.png', fullPage: true });
    
    const readThreads = await page.evaluate(() => {
      const threads = Array.from(document.querySelectorAll('.thread-item, [class*="thread"], [class*="Thread"], [role="button"]'));
      return threads.map(el => el.textContent.substring(0, 50));
    });
    console.log('Step 19: DESCRIBE - Threads in Read tab:');
    console.log(JSON.stringify(readThreads, null, 2));
  } else {
    console.log('WARNING: Read tab not found');
  }

  console.log('Test complete!');
  await browser.close();
})();
