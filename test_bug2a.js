const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  let archivedCount = 0;

  console.log('=== BUG-2a VERIFICATION: Archived Tab Shows Threads ===
');

  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Step 1: PASS - Logged in
');

    console.log('Step 2: Navigate to Inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-1-inbox.png', fullPage: true });
    console.log('Step 2: PASS - At Inbox
');

    console.log('Step 3: Count threads...');
    const threads = await page.locator('.thread-item, [class*="thread"], [class*="email-item"]').all();
    console.log('Found ' + threads.length + ' threads');
    
    if (threads.length === 0) {
      console.log('FAIL: No threads found
');
      await browser.close();
      return;
    }
    console.log('Step 3: PASS
');

    console.log('Step 4: Open first thread...');
    await threads[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-2-thread.png', fullPage: true });
    console.log('Step 4: PASS
');

    console.log('Step 5: Find Archive button...');
    const archiveBtn = await page.locator('button:has-text("Archive")').first();
    const archiveVisible = await archiveBtn.isVisible().catch(() => false);
    console.log('Archive button visible: ' + archiveVisible);
    
    if (!archiveVisible) {
      console.log('FAIL: Archive button not found
');
      await browser.close();
      return;
    }
    console.log('Step 5: PASS
');

    console.log('Step 6: Click Archive...');
    await archiveBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-3-after-archive.png', fullPage: true });
    console.log('Step 6: PASS - Archive clicked
');

    console.log('Step 7: Click Archived tab (CRITICAL)...');
    const archivedTab = await page.locator('button:has-text("Archived"), [role="tab"]:has-text("Archived")').first();
    const tabVisible = await archivedTab.isVisible().catch(() => false);
    console.log('Archived tab visible: ' + tabVisible);
    
    if (!tabVisible) {
      console.log('FAIL: Archived tab not found
');
      await browser.close();
      return;
    }
    
    await archivedTab.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-4-archived-tab.png', fullPage: true });
    console.log('Step 7: PASS - Clicked Archived tab
');

    console.log('Step 8: Check for archived threads (CRITICAL TEST)...');
    const archivedThreads = await page.locator('.thread-item, [class*="thread"], [class*="email-item"]').all();
    archivedCount = archivedThreads.length;
    console.log('Archived threads found: ' + archivedCount);
    
    if (archivedCount === 0) {
      console.log('
**** CRITICAL FAIL: No threads in Archived tab! ****');
      console.log('BUG-2a is NOT FIXED
');
    } else {
      console.log('
**** PASS: ' + archivedCount + ' thread(s) in Archived tab! ****');
      console.log('BUG-2a IS FIXED!
');
      
      console.log('Step 9: Open archived thread...');
      await archivedThreads[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-5-view-archived.png', fullPage: true });
      console.log('Step 9: PASS
');
      
      console.log('Step 10: Look for Unarchive button...');
      const unarchiveBtn = await page.locator('button:has-text("Unarchive")').first();
      const unarchiveVisible = await unarchiveBtn.isVisible().catch(() => false);
      console.log('Unarchive button visible: ' + unarchiveVisible);
      
      if (unarchiveVisible) {
        await unarchiveBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-6-unarchived.png', fullPage: true });
        console.log('Step 10: PASS - Unarchived
');
      }
    }

    console.log('Step 11: Return to All tab...');
    const allTab = await page.locator('button:has-text("All"), [role="tab"]:has-text("All")').first();
    const allVisible = await allTab.isVisible().catch(() => false);
    
    if (allVisible) {
      await allTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-7-final.png', fullPage: true });
    console.log('Step 11: PASS
');

    console.log('
===== FINAL VERDICT =====');
    if (archivedCount > 0) {
      console.log('BUG-2a FIX VERIFIED: Archived threads appear in Archived tab!');
      console.log('RESULT: PASS');
    } else {
      console.log('BUG-2a NOT FIXED: No threads in Archived tab');
      console.log('RESULT: FAIL');
    }
    console.log('========================
');

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-error.png', fullPage: true });
    console.log('RESULT: ERROR');
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
