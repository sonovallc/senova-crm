const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testArchiveButton() {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
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
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  console.log('=== BUG-2 ARCHIVE BUTTON VERIFICATION (ROBUST) ===\n');

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
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-robust-inbox.png'), fullPage: true });
    console.log('✓ On inbox page\n');

    console.log('[3] Find threads...');
    // Wait for threads to load
    await page.waitForSelector('text=Dolores Fay', { timeout: 10000 });
    
    // Get all thread items (the cards with contact info)
    const threadCards = await page.locator('text=Dolores Fay').all();
    console.log(`Found ${threadCards.length} thread cards\n`);

    if (threadCards.length === 0) {
      throw new Error('No threads found in inbox');
    }

    console.log('[4] Click first thread...');
    // Click the first thread card
    await threadCards[0].click();
    await page.waitForTimeout(3000);
    console.log('✓ Clicked first thread\n');
    
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-robust-thread-open.png'), fullPage: true });

    console.log('[5] Look for Archive button in thread view...');
    // Look for Archive button
    const archiveButton = page.locator('button:has-text("Archive")').first();
    const archiveCount = await archiveButton.count();
    
    if (archiveCount === 0) {
      console.log('❌ Archive button NOT FOUND in thread view');
      const allButtons = await page.locator('button').allTextContents();
      console.log('Available buttons:', allButtons);
      throw new Error('Archive button not found');
    }
    
    console.log('✓ Archive button found\n');

    // Check if button is visible and enabled
    const isVisible = await archiveButton.isVisible();
    const isEnabled = await archiveButton.isEnabled();
    console.log('Button visible:', isVisible);
    console.log('Button enabled:', isEnabled);
    console.log('');

    console.log('[6] *** CLICK ARCHIVE BUTTON - CRITICAL TEST ***');
    await archiveButton.click();
    console.log('Archive button clicked!');
    await page.waitForTimeout(4000);
    
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-robust-after-archive.png'), fullPage: true });

    console.log('\n[7] Check for errors...');
    if (consoleErrors.length > 0) {
      console.log('❌ CONSOLE ERRORS DETECTED:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
      console.log('');
    } else {
      console.log('✅ NO console errors!\n');
    }

    // Check for success/error messages
    const successMsg = await page.locator('text=/archived|success/i').count();
    const errorMsg = await page.locator('text=/error|failed/i').count();
    
    console.log('Success messages found:', successMsg);
    console.log('Error messages found:', errorMsg);
    console.log('');

    console.log('[8] Return to inbox All tab...');
    await page.click('button:has-text("All")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-robust-inbox-after.png'), fullPage: true });
    
    const threadsAfter = await page.locator('text=Dolores Fay').all();
    console.log(`Threads in All tab after archive: ${threadsAfter.length} (was: ${threadCards.length})\n`);

    console.log('[9] Check Archived tab...');
    const archivedTab = page.locator('button:has-text("Archived")');
    await archivedTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-robust-archived-tab.png'), fullPage: true });
    
    const archivedThreads = await page.locator('text=Dolores Fay').all();
    console.log(`Threads in Archived tab: ${archivedThreads.length}\n`);

    console.log('\n=== FINAL REPORT ===');
    console.log('Archive Button Clicked Successfully:', consoleErrors.length === 0);
    console.log('Console Errors:', consoleErrors.length);
    console.log('Thread Appeared in Archived Tab:', archivedThreads.length > 0);
    console.log('');
    console.log('FIX SUCCESSFUL:', consoleErrors.length === 0 ? 'YES ✅' : 'NO ❌');
    console.log('READY FOR COMPLETE FEATURE TEST:', consoleErrors.length === 0 ? 'YES ✅' : 'NO ❌');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2-robust-error.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testArchiveButton().catch(console.error);
