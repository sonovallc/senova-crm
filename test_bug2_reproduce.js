const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Login
    console.log('=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:3004/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('At login page, entering credentials...');
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button:has-text("Sign in")');
      await page.waitForTimeout(5000);
    }
    console.log('Logged in successfully');
    
    // Step 2: Navigate to Inbox
    console.log('\n=== STEP 2: NAVIGATE TO INBOX ===');
    await page.click('text=Inbox');
    await page.waitForTimeout(3000);
    console.log('Inbox page loaded: ' + page.url());
    
    // Screenshot 1: Inbox list
    console.log('\n=== SCREENSHOT 1: INBOX LIST ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-inbox-list.png',
      fullPage: true 
    });
    
    console.log('\n--- DESCRIPTION OF SCREENSHOT 1 ---');
    // Find thread items in left panel
    const threadElements = await page.$$('[class*="thread"], [class*="conversation"], div:has-text("EMAIL")');
    console.log('Thread/conversation elements found: ' + threadElements.length);
    
    // Get thread names
    const threadNames = await page.$$eval('div:has-text("EMAIL")', divs => {
      return divs.slice(0, 5).map(d => {
        const parent = d.parentElement?.parentElement || d.parentElement;
        return parent?.textContent?.substring(0, 50) || '';
      });
    });
    console.log('Visible threads: ' + JSON.stringify(threadNames));
    console.log('Number of threads visible: ' + threadNames.length);
    
    // Step 3: Click on first thread
    console.log('\n=== STEP 3: CLICK ON A THREAD ===');
    // Click on "Dolores Fay" or first visible thread
    const firstThread = await page.$('text=Dolores Fay');
    if (firstThread) {
      console.log('Clicking on "Dolores Fay" thread...');
      await firstThread.click();
      await page.waitForTimeout(3000);
      console.log('Thread selected!');
    } else {
      console.log('ERROR: Could not find Dolores Fay thread');
    }
    
    // Screenshot 2: Thread open with Archive button
    console.log('\n=== SCREENSHOT 2: THREAD OPEN ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-thread-open.png',
      fullPage: true 
    });
    
    console.log('\n--- DESCRIPTION OF SCREENSHOT 2 ---');
    // Find Archive button in the message detail area
    const allButtons = await page.$$('button');
    let archiveButton = null;
    
    for (const btn of allButtons) {
      const text = await btn.textContent();
      // Look for Archive button (not Archived tab)
      if (text.trim() === 'Archive' || (text.includes('Archive') && !text.includes('Archived'))) {
        const box = await btn.boundingBox();
        if (box) {
          console.log('Archive button found:');
          console.log('  Text: "' + text.trim() + '"');
          console.log('  Location: x=' + Math.round(box.x) + ', y=' + Math.round(box.y));
          console.log('  Size: ' + Math.round(box.width) + 'px × ' + Math.round(box.height) + 'px');
          archiveButton = btn;
          break;
        }
      }
    }
    
    if (!archiveButton) {
      console.log('WARNING: Archive button NOT FOUND!');
      const buttonTexts = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()));
      console.log('All buttons: ' + JSON.stringify(buttonTexts));
    }
    
    // Step 4: Click Archive button
    console.log('\n=== STEP 4: CLICK ARCHIVE BUTTON ===');
    if (archiveButton) {
      console.log('Clicking Archive button...');
      await archiveButton.click();
      console.log('Archive button CLICKED!');
      
      // Wait for network response
      console.log('Waiting for server response...');
      await page.waitForTimeout(3000);
    } else {
      console.log('CANNOT PROCEED: Archive button not found');
    }
    
    // Screenshot 3: Result (error message)
    console.log('\n=== SCREENSHOT 3: RESULT ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-result.png',
      fullPage: true 
    });
    
    console.log('\n--- DESCRIPTION OF SCREENSHOT 3 ---');
    console.log('Searching for error message (red box at bottom right)...');
    
    // Look for error notification
    const errorFound = await page.evaluate(() => {
      const selectors = [
        '.error', '.toast', '.notification', '.alert',
        '[role="alert"]', '[class*="error"]', '[class*="Error"]',
        '[class*="toast"]', '[class*="notification"]'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const text = el.textContent;
          
          // Filter out CSS content
          if (isVisible && text && text.length > 0 && text.length < 500 && !text.includes('{') && !text.includes('keyframes')) {
            return {
              found: true,
              text: text.trim(),
              selector: selector,
              position: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              }
            };
          }
        }
      }
      return { found: false };
    });
    
    if (errorFound.found) {
      console.log('>>> ERROR MESSAGE FOUND! <<<');
      console.log('    Text: "' + errorFound.text + '"');
      console.log('    Selector: ' + errorFound.selector);
      console.log('    Position: x=' + errorFound.position.x + ', y=' + errorFound.position.y);
      console.log('    Size: ' + errorFound.position.width + 'px × ' + errorFound.position.height + 'px');
    } else {
      console.log('No error message found on page');
    }
    
    console.log('\n=== BUG-2 REPRODUCTION COMPLETE ===');
    
  } catch (error) {
    console.error('\n!!! ERROR DURING TEST !!!');
    console.error('Message: ' + error.message);
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
