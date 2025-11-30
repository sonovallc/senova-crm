const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Login
    console.log('=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(2000);
    
    // Should redirect to login - fill in credentials
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    console.log('Login submitted, waiting for redirect...');
    await page.waitForTimeout(5000);
    
    // Should now be at inbox
    console.log('Current URL after login: ' + page.url());
    
    // Step 2: Screenshot 1 - Inbox List
    console.log('\n=== STEP 2: SCREENSHOT 1 - INBOX LIST ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-inbox-list.png',
      fullPage: true 
    });
    
    // Analyze inbox
    console.log('\n--- SCREENSHOT 1 DESCRIPTION ---');
    const threads = await page.$$('tr, li, [class*="thread"], [class*="email"]');
    console.log('Potential thread elements: ' + threads.length);
    
    // Get all text content
    const pageText = await page.textContent('body');
    console.log('Page contains "Inbox": ' + pageText.includes('Inbox'));
    
    // Count visible buttons
    const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()));
    console.log('Visible buttons: ' + JSON.stringify(buttons.slice(0, 10)));
    
    // Step 3: Click first thread
    console.log('\n=== STEP 3: CLICK THREAD ===');
    let clicked = false;
    
    // Try clicking a thread row
    const threadRows = await page.$$('tr:not(:first-child)');
    if (threadRows.length > 0) {
      console.log('Found ' + threadRows.length + ' table rows');
      await threadRows[0].click();
      clicked = true;
      console.log('Clicked first thread row');
    } else {
      console.log('No table rows found, trying list items...');
      const listItems = await page.$$('li');
      if (listItems.length > 0) {
        await listItems[0].click();
        clicked = true;
        console.log('Clicked first list item');
      }
    }
    
    await page.waitForTimeout(3000);
    
    // Step 4: Screenshot 2 - Thread Open
    console.log('\n=== STEP 4: SCREENSHOT 2 - THREAD OPEN ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-thread-open.png',
      fullPage: true 
    });
    
    // Find Archive button
    console.log('\n--- SCREENSHOT 2 DESCRIPTION ---');
    const allButtons = await page.$$('button');
    let archiveButton = null;
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text.includes('Archive')) {
        archiveButton = btn;
        const box = await btn.boundingBox();
        console.log('Archive button found!');
        console.log('  Text: "' + text.trim() + '"');
        console.log('  Position: x=' + Math.round(box.x) + ', y=' + Math.round(box.y));
        console.log('  Size: ' + Math.round(box.width) + 'x' + Math.round(box.height));
        break;
      }
    }
    
    if (!archiveButton) {
      console.log('WARNING: Archive button NOT found on page!');
      console.log('Available buttons: ' + JSON.stringify(buttons));
    }
    
    // Step 5: Click Archive Button
    console.log('\n=== STEP 5: CLICK ARCHIVE BUTTON ===');
    if (archiveButton) {
      console.log('Clicking Archive button...');
      await archiveButton.click();
      console.log('Archive button clicked!');
    } else {
      console.log('ERROR: Cannot click Archive button - not found');
    }
    
    // Wait for network response
    await page.waitForTimeout(4000);
    
    // Step 6: Screenshot 3 - Result
    console.log('\n=== STEP 6: SCREENSHOT 3 - RESULT ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-result.png',
      fullPage: true 
    });
    
    // Look for error
    console.log('\n--- SCREENSHOT 3 DESCRIPTION ---');
    console.log('Looking for error messages...');
    
    // Check for toast/notification
    const errorElements = await page.$$('[class*="error"], [class*="Error"], [class*="toast"], [class*="Toast"], [class*="notification"], [class*="alert"], [role="alert"]');
    let errorFound = false;
    
    for (const el of errorElements) {
      try {
        const isVisible = await el.isVisible();
        if (isVisible) {
          const text = await el.textContent();
          if (text.trim().length > 0) {
            console.log('>>> ERROR FOUND: ' + text.trim());
            errorFound = true;
          }
        }
      } catch (e) {}
    }
    
    // Check for red error box at bottom right
    const bottomRight = await page.$$('[style*="bottom"], [style*="right"], .fixed, .absolute');
    for (const el of bottomRight) {
      try {
        const isVisible = await el.isVisible();
        if (isVisible) {
          const text = await el.textContent();
          const classes = await el.getAttribute('class');
          if ((text.toLowerCase().includes('error') || text.includes('404')) && classes) {
            console.log('>>> BOTTOM RIGHT ERROR: ' + text.trim());
            console.log('    Classes: ' + classes);
            errorFound = true;
          }
        }
      } catch (e) {}
    }
    
    if (!errorFound) {
      console.log('No error message visible on page');
      // Check body text for keywords
      const bodyText = await page.textContent('body');
      if (bodyText.includes('404')) {
        console.log('Body text contains "404"');
      }
      if (bodyText.toLowerCase().includes('failed')) {
        console.log('Body text contains "failed"');
      }
    }
    
    console.log('\n=== BUG-2 REPRODUCTION COMPLETE ===');
    console.log('Screenshots saved to: screenshots/round2-bugfix/');
    
  } catch (error) {
    console.error('\n!!! ERROR DURING TEST !!!');
    console.error('Message: ' + error.message);
    console.error('Stack: ' + error.stack);
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
