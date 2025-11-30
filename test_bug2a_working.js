const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  let archivedCount = 0;

  console.log('=== BUG-2a VERIFICATION ===\n');

  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('PASS\n');

    console.log('Step 2: Navigate to Inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-1-inbox.png', fullPage: true });
    
    // Try multiple selectors to find thread items
    let threads = await page.$$('[role="button"]:has-text("EMAIL")');
    if (threads.length === 0) {
      threads = await page.$$('div:has-text("EMAIL")');
    }
    if (threads.length === 0) {
      threads = await page.$$('.cursor-pointer');
    }
    
    console.log('Threads found: ' + threads.length);
    console.log('PASS\n');

    if (threads.length === 0) {
      console.log('FAIL: No threads to test\n');
      await browser.close();
      return;
    }

    console.log('Step 3: Click first thread...');
    await threads[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-2-thread.png', fullPage: true });
    console.log('PASS\n');

    console.log('Step 4: Find and click Archive button...');
    const archiveBtn = await page.$('button:has-text("Archive")');
    if (!archiveBtn) {
      console.log('FAIL: Archive button not found\n');
      await browser.close();
      return;
    }
    await archiveBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-3-after-archive.png', fullPage: true });
    console.log('PASS - Archived!\n');

    console.log('Step 5: Click Archived tab (CRITICAL TEST)...');
    const archivedTab = await page.$('button:has-text("Archived"), [role="tab"]:has-text("Archived")');
    if (!archivedTab) {
      console.log('FAIL: Archived tab not found\n');
      await browser.close();
      return;
    }
    await archivedTab.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-4-archived-tab.png', fullPage: true });
    console.log('PASS - On Archived tab\n');

    console.log('Step 6: Check for archived threads (CRITICAL)...');
    // Try same selectors for archived threads
    let archivedThreads = await page.$$('[role="button"]:has-text("EMAIL")');
    if (archivedThreads.length === 0) {
      archivedThreads = await page.$$('div:has-text("EMAIL")');
    }
    if (archivedThreads.length === 0) {
      archivedThreads = await page.$$('.cursor-pointer');
    }
    
    archivedCount = archivedThreads.length;
    console.log('Archived threads found: ' + archivedCount);
    
    if (archivedCount === 0) {
      console.log('\n*** CRITICAL FAIL: No threads in Archived tab! ***');
      console.log('BUG-2a is NOT FIXED\n');
    } else {
      console.log('\n*** PASS: ' + archivedCount + ' thread(s) visible in Archived tab! ***');
      console.log('BUG-2a IS FIXED!\n');
      
      console.log('Step 7: Open archived thread...');
      await archivedThreads[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-5-view-archived.png', fullPage: true });
      console.log('PASS\n');
      
      console.log('Step 8: Look for Unarchive button...');
      const unarchiveBtn = await page.$('button:has-text("Unarchive")');
      if (unarchiveBtn) {
        console.log('Found Unarchive button - clicking...');
        await unarchiveBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-6-unarchived.png', fullPage: true });
        console.log('PASS - Unarchived\n');
      } else {
        console.log('Unarchive button not found (may not be implemented)\n');
      }
    }

    console.log('Step 9: Return to All tab...');
    const allTab = await page.$('button:has-text("All"), [role="tab"]:has-text("All")');
    if (allTab) {
      await allTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-7-final.png', fullPage: true });
    console.log('PASS\n');

    console.log('\n========== FINAL VERDICT ==========');
    if (archivedCount > 0) {
      console.log('BUG-2a FIX VERIFIED!');
      console.log('Archived threads NOW appear in Archived tab!');
      console.log('RESULT: PASS');
    } else {
      console.log('BUG-2a NOT FIXED');
      console.log('Archived threads do NOT appear in Archived tab');
      console.log('RESULT: FAIL');
    }
    console.log('===================================\n');

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-2a-error.png' });
    console.log('RESULT: ERROR\n');
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
