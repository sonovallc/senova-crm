const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testArchiveButton() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'round2-bugfix');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('=== BUG-2 ARCHIVE BUTTON VERIFICATION ===\n');

  try {
    console.log('[1] Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Logged in\n');

    console.log('[2] Go to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-verify-inbox.png'), fullPage: true });
    console.log('✓ On inbox page\n');

    console.log('[3] Count threads...');
    const threads = await page.locator('[data-thread-id], .thread-item, .inbox-thread').all();
    console.log(`Found ${threads.length} threads\n`);

    if (threads.length === 0) {
      console.log('⚠️  No threads found in inbox');
      console.log('Checking page content...');
      const content = await page.textContent('body');
      console.log('Page has content:', content.substring(0, 200));
    }

    console.log('[4] Open first thread...');
    const firstThread = page.locator('[data-thread-id], .thread-item, a[href*="thread"]').first();
    const threadCount = await firstThread.count();
    
    if (threadCount > 0) {
      await firstThread.click();
      await page.waitForTimeout(2000);
      console.log('✓ Thread opened\n');
    } else {
      console.log('⚠️  Could not find thread to click');
    }

    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-verify-thread.png'), fullPage: true });

    console.log('[5] Looking for Archive button...');
    const archiveButton = page.locator('button:has-text("Archive")').first();
    const archiveCount = await archiveButton.count();
    
    if (archiveCount === 0) {
      console.log('❌ Archive button NOT FOUND');
      const allButtons = await page.locator('button').allTextContents();
      console.log('Available buttons:', allButtons);
      throw new Error('Archive button not found');
    }
    
    console.log('✓ Archive button found\n');

    console.log('[6] *** CRITICAL TEST - Click Archive button ***');
    await archiveButton.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-verify-result.png'), fullPage: true });

    console.log('[7] Check for errors...');
    console.log('Console errors:', consoleErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('❌ ERRORS DETECTED:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✅ NO console errors!');
    }

    const successMsg = await page.locator('text=/archived|success/i').count();
    const errorMsg = await page.locator('text=/error|failed/i').count();
    
    console.log('Success messages:', successMsg);
    console.log('Error messages:', errorMsg);
    console.log('');

    console.log('[8] Go back to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-verify-after.png'), fullPage: true });
    
    const threadsAfter = await page.locator('[data-thread-id], .thread-item').all();
    console.log(`Threads after archive: ${threadsAfter.length} (was: ${threads.length})\n`);

    console.log('[9] Check Archived tab...');
    const archivedTab = page.locator('button:has-text("Archived"), a:has-text("Archived")').first();
    
    if (await archivedTab.count() > 0) {
      await archivedTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug-2-verify-archived-tab.png'), fullPage: true });
      
      const archivedThreads = await page.locator('[data-thread-id], .thread-item').all();
      console.log(`Threads in Archived tab: ${archivedThreads.length}\n`);
    } else {
      console.log('⚠️  Archived tab not found\n');
    }

    console.log('=== FINAL REPORT ===');
    console.log('Fix Successful:', consoleErrors.length === 0 ? 'YES' : 'NO');
    console.log('Remaining Errors:', consoleErrors.length);
    console.log('Ready for Complete Feature Test:', consoleErrors.length === 0 ? 'YES' : 'NO');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-verify-error.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testArchiveButton().catch(console.error);
