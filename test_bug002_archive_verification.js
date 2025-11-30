const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\round2-bugfix';
  const timeout = 90000;
  
  try {
    console.log('\n=== BUG-2 ARCHIVE BUTTON VERIFICATION ===\n');
    
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004', { timeout, waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout });
    console.log('✓ Login successful');
    
    // Step 2: Navigate to inbox
    console.log('\nStep 2: Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Step 3: Screenshot inbox
    console.log('\nStep 3: Taking inbox screenshot...');
    await page.screenshot({ path: `${screenshotDir}\bug-2-verify-inbox.png`, fullPage: true });
    
    // Step 4: Count threads
    console.log('\nStep 4: Analyzing inbox threads...');
    const threads = await page.locator('[data-thread-id], .thread-item, .inbox-thread, [class*="thread"]').all();
    console.log(`Found ${threads.length} potential thread elements`);
    
    // Get all text content to see threads
    const pageText = await page.textContent('body');
    console.log('\nPage content preview (first 500 chars):');
    console.log(pageText.substring(0, 500));
    
    // Look for clickable thread items
    const clickableThreads = await page.locator('div[role="button"], a[href*="thread"], button:has-text("View"), .thread-row, .message-row').all();
    console.log(`\nFound ${clickableThreads.length} clickable thread elements`);
    
    if (clickableThreads.length === 0) {
      console.log('\n⚠ No threads found in inbox. Checking for empty state or different structure...');
      const bodyHTML = await page.content();
      console.log('\nPage HTML structure (first 1000 chars):');
      console.log(bodyHTML.substring(0, 1000));
    }
    
    // Step 5: Click on first thread
    console.log('\nStep 5: Attempting to open a thread...');
    let threadOpened = false;
    
    // Try multiple selectors
    const selectors = [
      'div[data-thread-id]:first-child',
      '.thread-item:first-child',
      '.inbox-thread:first-child',
      'a[href*="thread"]:first-child',
      'div[role="button"]:first-child',
      '.thread-row:first-child',
      '.message-row:first-child'
    ];
    
    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`Trying selector: ${selector}`);
          await element.click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          threadOpened = true;
          console.log(`✓ Clicked thread using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} failed: ${e.message}`);
      }
    }
    
    if (!threadOpened) {
      console.log('\nAttempting to find thread by text content...');
      const possibleThreads = await page.locator('div:has-text("Subject"), div:has-text("Re:"), div:has-text("From")').all();
      console.log(`Found ${possibleThreads.length} elements with thread-like text`);
      
      if (possibleThreads.length > 0) {
        await possibleThreads[0].click();
        await page.waitForTimeout(2000);
        threadOpened = true;
        console.log('✓ Clicked potential thread element');
      }
    }
    
    // Step 6: Screenshot thread view
    console.log('\nStep 6: Taking thread view screenshot...');
    await page.screenshot({ path: `${screenshotDir}\bug-2-verify-thread.png`, fullPage: true });
    
    // Step 7: Look for Archive button
    console.log('\nStep 7: Looking for Archive button...');
    const archiveSelectors = [
      'button:has-text("Archive")',
      'button[aria-label*="Archive"]',
      '[data-action="archive"]',
      'button:has-text("archive")',
      '.archive-button',
      'button.archive'
    ];
    
    let archiveButton = null;
    let usedSelector = '';
    
    for (const selector of archiveSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        archiveButton = btn;
        usedSelector = selector;
        console.log(`✓ Found Archive button using: ${selector}`);
        break;
      }
    }
    
    if (!archiveButton) {
      console.log('❌ Archive button NOT FOUND');
      console.log('\nAll buttons on page:');
      const allButtons = await page.locator('button').allTextContents();
      console.log(allButtons);
      throw new Error('Archive button not found');
    }
    
    // Check button state before clicking
    const isDisabled = await archiveButton.isDisabled();
    const buttonText = await archiveButton.textContent();
    console.log(`Button text: "${buttonText}"`);
    console.log(`Button disabled: ${isDisabled}`);
    
    // Step 8: Click Archive button
    console.log('\nStep 8: Clicking Archive button...');
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await archiveButton.click();
    await page.waitForTimeout(3000);
    
    // Step 9: Screenshot result
    console.log('\nStep 9: Taking result screenshot...');
    await page.screenshot({ path: `${screenshotDir}\bug-2-verify-result.png`, fullPage: true });
    
    // Step 10: Check for success/error messages
    console.log('\nStep 10: Checking for success/error messages...');
    const successMessage = await page.locator('text=/archived|success/i').count();
    const errorMessage = await page.locator('text=/error|failed/i').count();
    
    console.log(`Success messages found: ${successMessage}`);
    console.log(`Error messages found: ${errorMessage}`);
    console.log(`Console errors captured: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console errors detected:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✓ No console errors detected');
    }
    
    // Step 11: Navigate back to inbox
    console.log('\nStep 11: Navigating back to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 12: Screenshot inbox after archive
    console.log('\nStep 12: Taking inbox screenshot after archive...');
    await page.screenshot({ path: `${screenshotDir}\bug-2-verify-after.png`, fullPage: true });
    
    const threadsAfter = await page.locator('[data-thread-id], .thread-item, .inbox-thread').all();
    console.log(`Threads count after archive: ${threadsAfter.length} (was: ${threads.length})`);
    
    if (threadsAfter.length < threads.length) {
      console.log('✓ Thread count decreased - thread likely archived');
    } else {
      console.log('⚠ Thread count unchanged - need to verify archived location
