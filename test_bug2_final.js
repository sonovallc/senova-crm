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
    console.log('Logged in, current URL: ' + page.url());
    
    // Step 2: Navigate to Inbox
    console.log('\n=== STEP 2: NAVIGATE TO INBOX ===');
    await page.click('text=Inbox');
    await page.waitForTimeout(3000);
    console.log('Navigated to inbox: ' + page.url());
    
    // Screenshot 1: Inbox list
    console.log('\n=== SCREENSHOT 1: INBOX LIST ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-inbox-list.png',
      fullPage: true 
    });
    
    console.log('\n--- DESCRIPTION OF SCREENSHOT 1 ---');
    // Count threads/emails
    const threadRows = await page.$$('tr:not(:first-child)');
    console.log('Table rows found (excluding header): ' + threadRows.length);
    
    // Get visible buttons
    const buttons = await page.$$eval('button:visible', btns => 
      btns.map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 30)
    );
    console.log('Visible buttons: ' + JSON.stringify(buttons));
    
    // Check for Archive button before selecting thread
    const hasArchiveBefore = buttons.some(b => b.includes('Archive'));
    console.log('Archive button visible BEFORE selecting thread: ' + hasArchiveBefore);
    
    // Step 3: Click on a thread
    console.log('\n=== STEP 3: SELECT A THREAD ===');
    if (threadRows.length > 0) {
      console.log('Clicking first thread row...');
      await threadRows[0].click();
      await page.waitForTimeout(3000);
      console.log('Thread selected');
    } else {
      console.log('ERROR: No threads found in inbox!');
    }
    
    // Screenshot 2: Thread selected with Archive button
    console.log('\n=== SCREENSHOT 2: THREAD SELECTED ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-thread-open.png',
      fullPage: true 
    });
    
    console.log('\n--- DESCRIPTION OF SCREENSHOT 2 ---');
    // Find Archive button
    const allButtons = await page.$$('button');
    let archiveButton = null;
    let archiveButtonInfo = null;
    
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text.includes('Archive')) {
        archiveButton = btn;
        const box = await btn.boundingBox();
        const isVisible = await btn.isVisible();
        archiveButtonInfo = {
          text: text.trim(),
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
          visible: isVisible
        };
        console.log('Archive button FOUND:');
        console.log('  Text: "' + archiveButtonInfo.text + '"');
        console.log('  Position: x=' + archiveButtonInfo.x + ', y=' + archiveButtonInfo.y);
        console.log('  Size: ' + archiveButtonInfo.width + 'x' + archiveButtonInfo.height);
        console.log('  Visible: ' + archiveButtonInfo.visible);
        break;
      }
    }
    
    if (!archiveButton) {
      console.log('ERROR: Archive button NOT FOUND after selecting thread!');
      const allButtonTexts = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()));
      console.log('All buttons on page: ' + JSON.stringify(allButtonTexts));
    }
    
    // Step 4: Click Archive button
    console.log('\n=== STEP 4: CLICK ARCHIVE BUTTON ===');
    if (archiveButton) {
      console.log('Clicking Archive button NOW...');
      await archiveButton.click();
      console.log('Archive button clicked!');
      
      // Wait for network request/response
      await page.waitForTimeout(3000);
      
      console.log('Waiting additional time for error to appear...');
      await page.waitForTimeout(2000);
    } else {
      console.log('ERROR: Cannot click Archive - button not found!');
    }
    
    // Screenshot 3: Result after clicking Archive
    console.log('\n=== SCREENSHOT 3: RESULT AFTER ARCHIVE CLICK ===');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-result.png',
      fullPage: true 
    });
    
    console.log('\n--- DESCRIPTION OF SCREENSHOT 3 ---');
    console.log('Looking for error messages (red box, toast, notification)...');
    
    // Look for error toast/notification
    const errorSelectors = [
      '.error',
      '.toast',
      '.notification',
      '[role="alert"]',
      '[class*="error"]',
      '[class*="Error"]',
      '[class*="toast"]',
      '[class*="Toast"]',
      '[class*="notification"]',
      '[class*="alert"]'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const el of elements) {
          const isVisible = await el.isVisible();
          if (isVisible) {
            const text = await el.textContent();
            // Filter out CSS/style content
            if (text && text.trim().length > 0 && text.trim().length < 500 && !text.includes('{')) {
              console.log('>>> ERROR ELEMENT FOUND (selector: ' + selector + '):');
              console.log('    Text: ' + text.trim());
              errorFound = true;
            }
          }
        }
      } catch (e) {
        // Skip
      }
    }
    
    if (!errorFound) {
      console.log('No error message found');
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('All screenshots saved to: screenshots/round2-bugfix/');
    
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
