const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = './screenshots/round2-bugfix';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, name + '.png');
  await page.screenshot({ path: filepath, fullPage: true });
  console.log('  Screenshot: ' + filepath);
}

async function login(page) {
  console.log('
=== Logging in ===');
  await page.goto(BASE_URL + '/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  console.log('  Logged in successfully');
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  let archivedCount = 0;
  
  try {
    await login(page);
    
    console.log('
=== STEP 1: Navigate to Inbox ===');
    await page.goto(BASE_URL + '/dashboard/inbox');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'bug-2a-1-inbox');
    
    const threads = await page.locator('.thread-item, [class*="thread"], [class*="email-item"]').all();
    console.log('  Found ' + threads.length + ' threads in inbox');
    
    if (threads.length === 0) {
      console.log('  FAIL: No threads found to archive');
      await browser.close();
      return;
    }
    
    console.log('
=== STEP 2: Open a thread ===');
    await threads[0].click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'bug-2a-2-thread-open');
    
    console.log('
=== STEP 3: Click Archive button ===');
    const archiveBtn = await page.locator('button:has-text("Archive")').first();
    const archiveVisible = await archiveBtn.isVisible().catch(() => false);
    console.log('  Archive button visible: ' + archiveVisible);
    
    if (!archiveVisible) {
      console.log('  FAIL: Archive button not found');
      await browser.close();
      return;
    }
    
    await archiveBtn.click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'bug-2a-3-after-archive');
    
    const bodyText = await page.textContent('body');
    if (bodyText.includes('success')) {
      console.log('  SUCCESS message found');
    } else if (bodyText.includes('error')) {
      console.log('  ERROR message found');
    }
    
    console.log('
=== STEP 4: Click Archived tab (CRITICAL TEST) ===');
    await page.waitForTimeout(1000);
    
    const archivedTab = await page.locator('button:has-text("Archived"), [role="tab"]:has-text("Archived")').first();
    const tabVisible = await archivedTab.isVisible().catch(() => false);
    console.log('  Archived tab visible: ' + tabVisible);
    
    if (!tabVisible) {
      console.log('  FAIL: Archived tab not found');
      await browser.close();
      return;
    }
    
    await archivedTab.click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'bug-2a-4-archived-tab');
    
    console.log('
=== STEP 5: Check for archived threads (CRITICAL) ===');
    const archivedThreads = await page.locator('.thread-item, [class*="thread"], [class*="email-item"]').all();
    archivedCount = archivedThreads.length;
    console.log('  Archived threads found: ' + archivedCount);
    
    if (archivedCount === 0) {
      console.log('
  CRITICAL FAIL: No threads in Archived tab!');
      console.log('  BUG-2a is NOT FIXED');
    } else {
      console.log('
  PASS: ' + archivedCount + ' thread(s) in Archived tab!');
      console.log('  BUG-2a IS FIXED!');
      
      console.log('
=== STEP 6: Open archived thread ===');
      await archivedThreads[0].click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'bug-2a-5-view-archived');
      
      console.log('
=== STEP 7: Look for Unarchive button ===');
      const unarchiveBtn = await page.locator('button:has-text("Unarchive")').first();
      const unarchiveVisible = await unarchiveBtn.isVisible().catch(() => false);
      console.log('  Unarchive button visible: ' + unarchiveVisible);
      
      if (unarchiveVisible) {
        await unarchiveBtn.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'bug-2a-6-unarchived');
      }
    }
    
    console.log('
=== STEP 8: Return to All tab ===');
    const allTab = await page.locator('button:has-text("All"), [role="tab"]:has-text("All")').first();
    const allVisible = await allTab.isVisible().catch(() => false);
    
    if (allVisible) {
      await allTab.click();
      await page.waitForTimeout(2000);
    }
    
    await takeScreenshot(page, 'bug-2a-7-final');
    
    console.log('
=== FINAL VERDICT ===');
    if (archivedCount > 0) {
      console.log('BUG-2a FIX VERIFIED: Archived threads appear in Archived tab!');
    } else {
      console.log('BUG-2a NOT FIXED: No threads in Archived tab');
    }
    
  } catch (error) {
    console.error('
TEST ERROR:', error.message);
    await takeScreenshot(page, 'bug-2a-error');
  } finally {
    await browser.close();
  }
})();
