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
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('2. Logging in...');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');

    await emailInput.fill('admin@evebeautyma.com');
    await passwordInput.fill('TestPass123!');
    await loginButton.click();
    await page.waitForTimeout(3000);

    console.log('3. Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('4. Taking screenshot of inbox list...');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/ISSUE006-01-inbox-list.png',
      fullPage: true 
    });

    console.log('5. Checking for message list...');
    let messageList = page.locator('[data-testid="inbox-message-list"]');
    let messageListExists = await messageList.count() > 0;
    
    if (!messageListExists) {
      console.log('   Using fallback selector for message list...');
      messageList = page.locator('.message-list, [class*="MessageList"]').first();
      messageListExists = await messageList.count() > 0;
    }

    results.tests.push({
      name: 'Message list exists',
      passed: messageListExists,
      details: messageListExists ? 'Message list found' : 'Message list not found'
    });
    console.log('   Result: ' + (messageListExists ? 'PASS' : 'FAIL') + ' - Message list');

    console.log('6. Looking for messages to click...');
    let messageItem = page.locator('[data-testid^="inbox-message-item-"]').first();
    let messageExists = await messageItem.count() > 0;

    if (!messageExists) {
      console.log('   Using fallback selectors for message items...');
      messageItem = page.locator('.message-item, [class*="MessageItem"]').first();
      messageExists = await messageItem.count() > 0;
    }

    results.tests.push({
      name: 'Messages exist to click',
      passed: messageExists,
      details: messageExists ? 'Found clickable messages' : 'No messages found'
    });
    console.log('   Result: ' + (messageExists ? 'PASS' : 'FAIL') + ' - Clickable messages');

    if (messageExists) {
      console.log('7. Clicking first message...');
      await messageItem.click();
      await page.waitForTimeout(2000);

      console.log('8. Taking screenshot of selected message...');
      await page.screenshot({ 
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/ISSUE006-02-message-selected.png',
        fullPage: true 
      });

      console.log('9. Checking for message detail pane...');
      let detailPane = page.locator('[data-testid="inbox-message-detail"]');
      let detailExists = await detailPane.count() > 0;

      if (!detailExists) {
        console.log('   Using fallback selectors for detail pane...');
        detailPane = page.locator('.message-detail, [class*="MessageDetail"]').first();
        detailExists = await detailPane.count() > 0;
      }

      results.tests.push({
        name: 'Message detail pane appears',
        passed: detailExists,
        details: detailExists ? 'Detail pane visible' : 'Detail pane not found'
      });
      console.log('   Result: ' + (detailExists ? 'PASS' : 'FAIL') + ' - Detail pane');

      console.log('10. Checking for email content...');
      const hasContent = detailExists && await detailPane.textContent();
      const contentVisible = hasContent && hasContent.length > 10;

      results.tests.push({
        name: 'Email content displays',
        passed: contentVisible,
        details: contentVisible ? 'Email content rendered' : 'No content visible'
      });
      console.log('   Result: ' + (contentVisible ? 'PASS' : 'FAIL') + ' - Email content');

      console.log('11. Checking for Reply button...');
      let replyButton = page.locator('[data-testid="inbox-reply-button"]');
      let replyExists = await replyButton.count() > 0;

      if (!replyExists) {
        console.log('   Using fallback selectors for reply button...');
        replyButton = page.locator('button:has-text("Reply")').first();
        replyExists = await replyButton.count() > 0;
      }

      results.tests.push({
        name: 'Reply button visible',
        passed: replyExists,
        details: replyExists ? 'Reply button found' : 'Reply button not found'
      });
      console.log('   Result: ' + (replyExists ? 'PASS' : 'FAIL') + ' - Reply button');

      console.log('12. Checking for Forward button...');
      let forwardButton = page.locator('[data-testid="inbox-forward-button"]');
      let forwardExists = await forwardButton.count() > 0;

      if (!forwardExists) {
        console.log('   Using fallback selectors for forward button...');
        forwardButton = page.locator('button:has-text("Forward")').first();
        forwardExists = await forwardButton.count() > 0;
      }

      results.tests.push({
        name: 'Forward button visible',
        passed: forwardExists,
        details: forwardExists ? 'Forward button found' : 'Forward button not found'
      });
      console.log('   Result: ' + (forwardExists ? 'PASS' : 'FAIL') + ' - Forward button');

      console.log('13. Taking screenshot of Reply/Forward functionality...');
      await page.screenshot({ 
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/ISSUE006-03-reply-forward.png',
        fullPage: true 
      });
    }

    const passedTests = results.tests.filter(t => t.passed).length;
    const totalTests = results.tests.length;
    results.overall = passedTests === totalTests ? 'PASS' : 'FAIL';

    console.log('\n' + '='.repeat(60));
    console.log('FINAL RESULTS: ' + results.overall);
    console.log('Passed: ' + passedTests + '/' + totalTests + ' tests');
    console.log('='.repeat(60));

    fs.writeFileSync(
      'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/ISSUE006-results.json',
      JSON.stringify(results, null, 2)
    );

  } catch (error) {
    console.error('Test execution error:', error.message);
    results.overall = 'FAIL';
    results.error = error.message;
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
