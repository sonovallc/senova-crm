const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    overall: 'FAIL',
    tests: []
  };

  try {
    console.log('Testing ISSUE-006: Inbox Message Selection');
    console.log('='.repeat(60));

    console.log('\n1. Navigating to login page...');
    await page.goto('http://localhost:3004', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('2. Checking login form elements...');
    await page.screenshot({ path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/ISSUE006-00-login.png', fullPage: true });
    
    console.log('3. Filling login form...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.waitForTimeout(500);
    
    console.log('4. Submitting login...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    console.log('5. Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    console.log('6. Taking screenshot of inbox page...');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/ISSUE006-01-inbox-list.png',
      fullPage: true 
    });

    console.log('7. Analyzing inbox page structure...');
    const pageContent = await page.content();
    
    console.log('8. Checking for message list with data-testid...');
    let messageList = page.locator('[data-testid="inbox-message-list"]');
    let messageListExists = await messageList.count() > 0;
    
    console.log('   Message list (data-testid): ' + (messageListExists ? 'FOUND' : 'NOT FOUND'));
    
    if (!messageListExists) {
      console.log('9. Trying fallback selectors for message list...');
      const possibleSelectors = [
        '.message-list',
        '[class*="MessageList"]',
        '[class*="inbox-list"]',
        '[class*="email-list"]',
        'div[role="list"]',
        '.inbox-messages'
      ];
      
      for (const selector of possibleSelectors) {
        const element = page.locator(selector).first();
        const count = await element.count();
        console.log('   Trying ' + selector + ': ' + (count > 0 ? 'FOUND' : 'NOT FOUND'));
        if (count > 0) {
          messageList = element;
          messageListExists = true;
          break;
        }
      }
    }

    results.tests.push({
      name: 'Message list exists',
      passed: messageListExists,
      details: messageListExists ? 'Message list found' : 'Message list not found'
    });

    console.log('10. Looking for message items...');
    let messageItem = page.locator('[data-testid^="inbox-message-item-"]').first();
    let messageExists = await messageItem.count() > 0;

    console.log('   Message items (data-testid): ' + (messageExists ? 'FOUND' : 'NOT FOUND'));

    if (!messageExists) {
      console.log('11. Trying fallback selectors for messages...');
      const possibleSelectors = [
        '.message-item',
        '[class*="MessageItem"]',
        '[class*="inbox-item"]',
        '[class*="email-item"]',
        'div[role="button"]',
        'li[role="listitem"]',
        '[data-message-id]',
        'tr[class*="message"]'
      ];
      
      for (const selector of possibleSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        console.log('   Trying ' + selector + ': ' + count + ' found');
        if (count > 0) {
          messageItem = elements.first();
          messageExists = true;
          break;
        }
      }
    }

    results.tests.push({
      name: 'Messages exist to click',
      passed: messageExists,
      details: messageExists ? 'Found clickable messages' : 'No messages found'
    });

    if (messageExists) {
      console.log('12. Clicking first message...');
      await messageItem.click();
      await page.waitForTimeout(3000);

      console.log('13. Taking screenshot after click...');
      await page.screenshot({ 
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/ISSUE006-02-message-selected.png',
        fullPage: true 
      });

      console.log('14. Checking for detail pane with data-testid...');
      let detailPane = page.locator('[data-testid="inbox-message-detail"]');
      let detailExists = await detailPane.count() > 0;

      console.log('   Detail pane (data-testid): ' + (detailExists ? 'FOUND' : 'NOT FOUND'));

      if (!detailExists) {
        console.log('15. Trying fallback selectors for detail pane...');
        const possibleSelectors = [
          '.message-detail',
          '[class*="MessageDetail"]',
          '[class*="inbox-detail"]',
          '[class*="email-content"]',
          '[class*="message-body"]',
          '.email-viewer',
          '[role="article"]'
        ];
        
        for (const selector of possibleSelectors) {
          const element = page.locator(selector).first();
          const count = await element.count();
          console.log('   Trying ' + selector + ': ' + (count > 0 ? 'FOUND' : 'NOT FOUND'));
          if (count > 0) {
            detailPane = element;
            detailExists = true;
            break;
          }
        }
      }

      results.tests.push({
        name: 'Message detail pane appears',
        passed: detailExists,
        details: detailExists ? 'Detail pane visible' : 'Detail pane not found'
      });

      if (detailExists) {
        console.log('16. Checking email content...');
        const content = await detailPane.textContent();
        const contentVisible = content && content.trim().length > 10;
        console.log('   Content length: ' + (content ? content.length : 0) + ' chars');

        results.tests.push({
          name: 'Email content displays',
          passed: contentVisible,
          details: contentVisible ? 'Email content: ' + content.substring(0, 100) + '...' : 'No content'
        });
      }

      console.log('17. Looking for Reply button...');
      let replyButton = page.locator('[data-testid="inbox-reply-button"]');
      let replyExists = await replyButton.count() > 0;

      console.log('   Reply button (data-testid): ' + (replyExists ? 'FOUND' : 'NOT FOUND'));

      if (!replyExists) {
        const possibleSelectors = [
          'button:has-text("Reply")',
          '[class*="reply-button"]',
          'button[aria-label*="Reply"]',
          'button:has-text("Send")'
        ];
        
        for (const selector of possibleSelectors) {
          const element = page.locator(selector).first();
          const count = await element.count();
          console.log(
