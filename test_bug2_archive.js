const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate and login
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004', { timeout: 90000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Login
    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Step 2: Navigate to inbox
    console.log('Step 3: Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Screenshot 1: Inbox list
    console.log('Step 4: Taking Screenshot 1 - Inbox list...');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-inbox-list.png',
      fullPage: true 
    });
    
    // Describe inbox - get thread information
    const threadCount = await page.$$eval('[class*="thread"], [class*="email"], [class*="inbox-item"]', els => els.length);
    console.log('\n=== SCREENSHOT 1 DESCRIPTION ===');
    console.log('Thread elements found: ' + threadCount);
    
    // Get page content to analyze
    const pageContent = await page.textContent('body');
    console.log('Page title/header contains: ' + (pageContent.includes('Inbox') ? 'Inbox' : 'Unknown'));
    
    // Look for Archive button visibility
    const archiveButtonCount = await page.$$eval('button', buttons => {
      return buttons.filter(b => b.textContent.includes('Archive')).length;
    });
    console.log('Archive buttons visible on page: ' + archiveButtonCount);
    
    // Step 5: Click on first thread
    console.log('\nStep 5: Looking for thread to click...');
    
    // Try to find and click a thread
    let threadClicked = false;
    const selectors = [
      '[class*="thread"]',
      '[class*="email"]',
      '[class*="inbox"]',
      'tr',
      'li'
    ];
    
    for (const selector of selectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log('Trying selector: ' + selector + ' (found ' + elements.length + ' elements)');
        try {
          await elements[0].click({ timeout: 3000 });
          threadClicked = true;
          console.log('Successfully clicked thread with selector: ' + selector);
          await page.waitForTimeout(2000);
          break;
        } catch (e) {
          console.log('Click failed for selector: ' + selector);
        }
      }
    }
    
    if (!threadClicked) {
      console.log('WARNING: Could not find/click thread. Proceeding anyway...');
    }
    
    // Screenshot 2: Thread open
    console.log('\nStep 6: Taking Screenshot 2 - Thread open...');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-thread-open.png',
      fullPage: true 
    });
    
    // Locate Archive button
    console.log('\n=== SCREENSHOT 2 DESCRIPTION ===');
    const archiveButtons = await page.$$('button');
    for (let i = 0; i < archiveButtons.length; i++) {
      const text = await archiveButtons[i].textContent();
      if (text.includes('Archive')) {
        const box = await archiveButtons[i].boundingBox();
        console.log('Archive button found: "' + text.trim() + '" at position x:' + Math.round(box.x) + ', y:' + Math.round(box.y));
      }
    }
    
    // Step 7: Click Archive button
    console.log('\nStep 7: Clicking Archive button...');
    let clicked = false;
    
    // Try clicking Archive button
    const allButtons = await page.$$('button');
    for (const button of allButtons) {
      const text = await button.textContent();
      if (text.includes('Archive')) {
        try {
          await button.click({ timeout: 5000 });
          clicked = true;
          console.log('Archive button clicked successfully');
          break;
        } catch (e) {
          console.log('Failed to click Archive button: ' + e.message);
        }
      }
    }
    
    if (!clicked) {
      console.log('WARNING: Could not click Archive button');
    }
    
    // Wait for response/error
    await page.waitForTimeout(3000);
    
    // Screenshot 3: Result
    console.log('\nStep 8: Taking Screenshot 3 - Result...');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-result.png',
      fullPage: true 
    });
    
    // Look for error message
    console.log('\n=== SCREENSHOT 3 DESCRIPTION ===');
    const errorSelectors = [
      '[class*="error"]',
      '[class*="alert"]',
      '[class*="toast"]',
      '[role="alert"]',
      '.error',
      '.alert',
      '.notification'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          for (const el of elements) {
            const text = await el.textContent();
            if (text && text.trim().length > 0) {
              console.log('ERROR ELEMENT FOUND with selector "' + selector + '": ' + text.trim());
              errorFound = true;
            }
          }
        }
      } catch (e) {
        // Skip invalid selectors
      }
    }
    
    if (!errorFound) {
      console.log('No error elements found with standard selectors');
      // Check page content for error keywords
      const bodyText = await page.textContent('body');
      if (bodyText.toLowerCase().includes('404')) {
        console.log('Page contains "404" text');
      }
      if (bodyText.toLowerCase().includes('error')) {
        console.log('Page contains "error" text');
      }
    }
    
    console.log('\n=== BUG-2 REPRODUCTION COMPLETE ===');
    
  } catch (error) {
    console.error('Error during test: ' + error.message);
    console.error('Stack: ' + error.stack);
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
