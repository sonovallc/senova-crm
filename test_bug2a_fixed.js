const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'round2-bugfix');
  const timeout = 90000;
  
  try {
    console.log('
=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:3004/login', { timeout });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout });
    console.log('✓ Login successful');
    
    console.log('
=== STEP 2: NAVIGATE TO INBOX ===');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2a-1-inbox.png'), fullPage: true });
    console.log('✓ Screenshot: bug-2a-1-inbox.png');
    
    const threads = await page.locator('.thread-item, [class*="thread"], [class*="email-item"]').all();
    console.log();
    
    for (let i = 0; i < Math.min(threads.length, 5); i++) {
      const threadText = await threads[i].textContent();
      console.log();
    }
    
    console.log('
=== STEP 3: OPEN A THREAD ===');
    if (threads.length === 0) {
      throw new Error('❌ FAIL: No threads found in inbox to archive!');
    }
    
    await threads[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2a-2-thread.png'), fullPage: true });
    console.log('✓ Screenshot: bug-2a-2-thread.png');
    
    const archiveButton = await page.locator('button:has-text("Archive"), [class*="archive"]').first();
    const archiveVisible = await archiveButton.isVisible().catch(() => false);
    console.log();
    
    if (!archiveVisible) {
      throw new Error('Archive button not visible');
    }
    
    console.log('
=== STEP 4: CLICK ARCHIVE BUTTON ===');
    await archiveButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2a-3-after-archive.png'), fullPage: true });
    console.log('✓ Screenshot: bug-2a-3-after-archive.png');
    
    const pageText = await page.textContent('body');
    if (pageText.includes('success') || pageText.includes('archived')) {
      console.log('✓ Success indication found');
    } else if (pageText.includes('error') || pageText.includes('fail')) {
      console.log('⚠ Error indication found');
    }
    
    console.log('
=== STEP 5: CLICK ARCHIVED TAB (CRITICAL TEST) ===');
    await page.waitForTimeout(1000);
    
    const archivedTab = await page.locator('button:has-text("Archived"), [role="tab"]:has-text("Archived"), .tab:has-text("Archived"), a:has-text("Archived")').first();
    
    const tabVisible = await archivedTab.isVisible().catch(() => false);
    console.log();
    
    if (!tabVisible) {
      throw new Error('Archived tab not visible');
    }
    
    await archivedTab.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2a-4-archived-tab.png'), fullPage: true });
    console.log('✓ Screenshot: bug-2a-4-archived-tab.png');
    
    console.log('
=== CRITICAL CHECK: ARCHIVED THREADS ===');
    const archivedThreads = await page.locator('.thread-item, [class*="thread"], [class*="email-item"]').all();
    console.log();
    
    if (archivedThreads.length === 0) {
      console.log('❌ CRITICAL FAIL: No threads appear in Archived tab!');
      console.log('This means BUG-2a is NOT fixed - archived threads still not showing');
    } else {
      console.log();
      console.log('This means BUG-2a IS FIXED - archived threads now appear!');
      
      for (let i = 0; i < Math.min(archivedThreads.length, 3); i++) {
        const threadText = await archivedThreads[i].textContent();
        console.log();
      }
      
      console.log('
=== STEP 6: OPEN ARCHIVED THREAD ===');
      await archivedThreads[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug-2a-5-view-archived.png'), fullPage: true });
      console.log('✓ Screenshot: bug-2a-5-view-archived.png');
      
      console.log('
=== STEP 7: LOOK FOR UNARCHIVE BUTTON ===');
      const unarchiveButton = await page.locator('button:has-text("Unarchive"), [class*="unarchive"]').first();
      const unarchiveVisible = await unarchiveButton.isVisible().catch(() => false);
      console.log();
      
      if (unarchiveVisible) {
        await unarchiveButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, 'bug-2a-6-unarchived.png'), fullPage: true });
        console.log('✓ Screenshot: bug-2a-6-unarchived.png');
      }
    }
    
    console.log('
=== STEP 8: RETURN TO ALL TAB ===');
    const allTab = await page.locator('button:has-text("All"), [role="tab"]:has-text("All"), .tab:has-text("All"), a:has-text("All")').first();
    
    const allTabVisible = await allTab.isVisible().catch(() => false);
    if (allTabVisible) {
      await allTab.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('http://localhost:3004/dashboard/inbox', { timeout });
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2a-7-final.png'), fullPage: true });
    console.log('✓ Screenshot: bug-2a-7-final.png');
    
    console.log('
=== FINAL VERDICT ===');
    if (archivedThreads.length > 0) {
      console.log('✓✓✓ BUG-2a FIX VERIFIED: Archived threads NOW appear in Archived tab!');
    } else {
      console.log('❌❌❌ BUG-2a NOT FIXED: Archived threads still do not appear in Archived tab');
    }
    
  } catch (error) {
    console.error('
❌ TEST ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'bug-2a-error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
