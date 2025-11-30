const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const screenshotDir = path.join('C:', 'Users', 'jwood', 'Documents', 'Projects', 'claude-code-agents-wizard-v2', 'screenshots', 'round2-bugfix');
    
    console.log('=== BUG-1 FINAL VERIFICATION: Read/Unread Tabs ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    console.log('✓ Login successful\n');

    // Step 2: Navigate to inbox
    console.log('Step 2: Navigating to /dashboard/inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    console.log('✓ Inbox loaded\n');

    // Step 3-4: All tab
    console.log('Step 3-4: Checking "All" tab...');
    await page.screenshot({ path: path.join(screenshotDir, 'bug-1-final-1.png'), fullPage: true });
    
    const allThreads = await page.$$('.inbox-thread-item');
    console.log('All tab: ' + allThreads.length + ' threads visible');
    
    const newBadges = await page.$$('.badge:has-text("New")');
    console.log('New badges: ' + newBadges.length + ' messages with "New" badge');
    
    const blueBackgrounds = await page.$$('.inbox-thread-item.bg-blue-50');
    console.log('Blue backgrounds: ' + blueBackgrounds.length + ' threads with blue background\n');

    // Step 5-7: Unread tab
    console.log('Step 5-7: Clicking "Unread" tab...');
    await page.click('button:has-text("Unread")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-1-final-2.png'), fullPage: true });
    
    const unreadThreads = await page.$$('.inbox-thread-item');
    console.log('Unread tab: ' + unreadThreads.length + ' threads visible');
    
    if (unreadThreads.length > 0) {
      const firstUnread = await page.$('.inbox-thread-item');
      const unreadText = await firstUnread.textContent();
      const preview = unreadText.slice(0, 100);
      console.log('First unread thread preview: ' + preview + '...');
    }
    console.log('');

    // Step 8-10: Read tab
    console.log('Step 8-10: Clicking "Read" tab...');
    await page.click('button:has-text("Read")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-1-final-3.png'), fullPage: true });
    
    const readThreads = await page.$$('.inbox-thread-item');
    console.log('Read tab: ' + readThreads.length + ' threads visible');
    
    if (readThreads.length === 0) {
      console.log('(0 threads in Read tab is OK if nothing has been read yet)');
    }
    console.log('');

    // Step 11-14: Open an unread message
    console.log('Step 11-14: Opening an unread message...');
    await page.click('button:has-text("Unread")');
    await page.waitForTimeout(2000);
    
    const unreadCheck = await page.$$('.inbox-thread-item');
    if (unreadCheck.length > 0) {
      console.log('Found ' + unreadCheck.length + ' unread messages. Opening first one...');
      
      // Get the first unread thread's identifier before clicking
      const firstThread = await page.$('.inbox-thread-item');
      const threadSubject = await firstThread.$eval('.font-semibold', el => el.textContent);
      console.log('Opening thread: "' + threadSubject + '"');
      
      await firstThread.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug-1-final-4.png'), fullPage: true });
      console.log('✓ Thread opened, waiting 5 seconds for mark-as-read API...');
      await page.waitForTimeout(5000);
      console.log('');

      // Step 15-17: Check Unread tab again
      console.log('Step 15-17: Checking Unread tab after viewing...');
      await page.click('button:has-text("Unread")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug-1-final-5.png'), fullPage: true });
      
      const unreadAfter = await page.$$('.inbox-thread-item');
      console.log('Unread tab after viewing: ' + unreadAfter.length + ' threads');
      console.log('COMPARISON: Before=' + unreadCheck.length + ', After=' + unreadAfter.length);
      
      if (unreadAfter.length < unreadCheck.length) {
        console.log('✓ SUCCESS: Thread moved out of Unread!');
      } else {
        console.log('✗ ISSUE: Thread count unchanged in Unread tab');
      }
      console.log('');

      // Step 18-20: Check Read tab
      console.log('Step 18-20: Checking Read tab for the viewed message...');
      await page.click('button:has-text("Read")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug-1-final-6.png'), fullPage: true });
      
      const readAfter = await page.$$('.inbox-thread-item');
      console.log('Read tab after viewing: ' + readAfter.length + ' threads');
      
      if (readAfter.length > 0) {
        const readThreadsText = await page.$$eval('.inbox-thread-item .font-semibold', 
          els => els.map(el => el.textContent));
        console.log('Read threads: ' + readThreadsText.join(', '));
        
        if (readThreadsText.some(text => text.includes(threadSubject) || threadSubject.includes(text))) {
          console.log('✓ SUCCESS: Viewed thread IS NOW in Read tab!');
        } else {
          console.log('✗ ISSUE: Viewed thread NOT found in Read tab');
        }
      } else {
        console.log('✗ ISSUE: Read tab is empty, viewed thread not found');
      }
      console.log('');
    } else {
      console.log('⚠ No unread messages available to test read/unread transition');
      console.log('Cannot complete steps 11-20 without unread messages\n');
    }

    // Final verdict
    console.log('\n=== FINAL VERDICT ===');
    console.log('Review screenshots and console output above.');
    console.log('Screenshots saved to: ' + screenshotDir);
    console.log('\nKEY SUCCESS INDICATORS:');
    console.log('1. Unread and Read tabs show DIFFERENT thread counts');
    console.log('2. After viewing a message, Unread count decreases');
    console.log('3. After viewing a message, it appears in Read tab');
    console.log('4. Visual indicators (blue bg, "New" badge) present on unread items');

  } catch (error) {
    console.error('ERROR during test:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
})();
