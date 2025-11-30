const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Starting BUG-1 verification test...');
  
  const screenshotDir = path.join(__dirname, 'screenshots');

  try {
    // Step 1: Login
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    
    console.log('Step 2: Entering credentials...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    
    console.log('Step 3: Clicking login button...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Step 2: Navigate to Inbox
    console.log('Step 4: Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(3000);
    
    // Step 3: Take screenshot of All tab
    console.log('Step 5: Taking screenshot of All tab...');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug1-fix-1-all-tab.png'),
      fullPage: true 
    });
    
    // Check if there are any threads
    const allThreads = await page.$$('[class*="thread"], [class*="inbox"] li, [class*="message"]');
    console.log('Found ' + allThreads.length + ' elements that might be threads in All tab');
    
    // Step 4: Click Unread tab
    console.log('Step 6: Clicking Unread tab...');
    try {
      await page.click('text=/Unread/i');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not find Unread tab');
    }
    
    // Step 5: Take screenshot of Unread tab
    console.log('Step 7: Taking screenshot of Unread tab...');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug1-fix-2-unread-tab.png'),
      fullPage: true 
    });
    
    const unreadThreads = await page.$$('[class*="thread"], [class*="inbox"] li, [class*="message"]');
    console.log('Found ' + unreadThreads.length + ' elements in Unread tab');
    
    // Step 6: Click Read tab
    console.log('Step 8: Clicking Read tab...');
    try {
      await page.click('text=/^Read$/i');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not find Read tab');
    }
    
    // Step 7: Take screenshot of Read tab
    console.log('Step 9: Taking screenshot of Read tab...');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug1-fix-3-read-tab.png'),
      fullPage: true 
    });
    
    const readThreads = await page.$$('[class*="thread"], [class*="inbox"] li, [class*="message"]');
    console.log('Found ' + readThreads.length + ' elements in Read tab');
    
    // Step 8: Click Archived tab
    console.log('Step 10: Clicking Archived tab...');
    try {
      await page.click('text=/Archived/i');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not find Archived tab');
    }
    
    console.log('Step 11: Taking screenshot of Archived tab...');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug1-fix-4-archived-tab.png'),
      fullPage: true 
    });
    
    // Step 9: Go back to All tab and click a thread
    console.log('Step 12: Returning to All tab...');
    try {
      await page.click('text=/^All$/i');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not find All tab');
    }
    
    // Try to find and click a thread
    console.log('Step 13: Looking for a thread to click...');
    const threadToClick = await page.$('[class*="thread"]:first-child, [class*="inbox"] li:first-child');
    if (threadToClick) {
      console.log('Found thread, clicking it...');
      await threadToClick.click();
      await page.waitForTimeout(2000);
      
      console.log('Step 14: Taking screenshot after clicking thread...');
      await page.screenshot({ 
        path: path.join(screenshotDir, 'bug1-fix-5-thread-clicked.png'),
        fullPage: true 
      });
    } else {
      console.log('No thread found to click');
    }
    
    // Step 10: Navigate away and back
    console.log('Step 15: Navigating to dashboard...');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(2000);
    
    console.log('Step 16: Returning to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(3000);
    
    console.log('Step 17: Taking screenshot after returning...');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug1-fix-6-after-return.png'),
      fullPage: true 
    });
    
    // Check Unread tab again
    console.log('Step 18: Checking Unread tab again...');
    try {
      await page.click('text=/Unread/i');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not click Unread tab');
    }
    
    console.log('Step 19: Taking final screenshot of Unread tab...');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug1-fix-7-unread-final.png'),
      fullPage: true 
    });
    
    console.log('Test completed successfully');

  } catch (error) {
    console.error('Error during test:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug1-fix-error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
