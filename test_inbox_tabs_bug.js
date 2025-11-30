const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== BUG-1 INVESTIGATION: INBOX TAB FILTERING ===\n');

  try {
    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('   ✓ Logged in\n');

    // Navigate to inbox
    console.log('2. Navigating to inbox...');
    await page.goto('http://localhost:3000/dashboard/inbox');
    await page.waitForTimeout(2000);
    console.log('   ✓ At inbox page\n');

    // Check ALL tab first
    console.log('3. Checking ALL tab data...');
    await page.click('[role="tab"][value="all"]');
    await page.waitForTimeout(1000);

    const allTabConversations = await page.$$('[data-conversation-item]');
    console.log(`   Found ${allTabConversations.length} conversations in ALL tab`);

    // Get details of first few conversations
    for (let i = 0; i < Math.min(3, allTabConversations.length); i++) {
      const conv = allTabConversations[i];
      const name = await conv.$eval('[data-conversation-name]', el => el.textContent).catch(() => 'N/A');
      const preview = await conv.$eval('[data-conversation-preview]', el => el.textContent).catch(() => 'N/A');
      console.log(`   [${i}] ${name} - ${preview.substring(0, 50)}...`);
    }
    console.log('');

    // Check UNREAD tab
    console.log('4. Checking UNREAD tab data...');
    await page.click('[role="tab"][value="unread"]');
    await page.waitForTimeout(1000);

    const unreadTabConversations = await page.$$('[data-conversation-item]');
    console.log(`   Found ${unreadTabConversations.length} conversations in UNREAD tab`);

    // Get details
    for (let i = 0; i < Math.min(3, unreadTabConversations.length); i++) {
      const conv = unreadTabConversations[i];
      const name = await conv.$eval('[data-conversation-name]', el => el.textContent).catch(() => 'N/A');
      const preview = await conv.$eval('[data-conversation-preview]', el => el.textContent).catch(() => 'N/A');
      console.log(`   [${i}] ${name} - ${preview.substring(0, 50)}...`);
    }
    console.log('');

    // Check READ tab
    console.log('5. Checking READ tab data...');
    await page.click('[role="tab"][value="read"]');
    await page.waitForTimeout(1000);

    const readTabConversations = await page.$$('[data-conversation-item]');
    console.log(`   Found ${readTabConversations.length} conversations in READ tab`);

    // Get details
    for (let i = 0; i < Math.min(3, readTabConversations.length); i++) {
      const conv = readTabConversations[i];
      const name = await conv.$eval('[data-conversation-name]', el => el.textContent).catch(() => 'N/A');
      const preview = await conv.$eval('[data-conversation-preview]', el => el.textContent).catch(() => 'N/A');
      console.log(`   [${i}] ${name} - ${preview.substring(0, 50)}...`);
    }
    console.log('');

    // Check browser console for API responses
    console.log('6. Checking browser console...');
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`   [BROWSER] ${msg.text()}`);
      }
    });

    // Open devtools to inspect network requests
    console.log('\n7. Opening DevTools to inspect data...');
    console.log('   Check the Network tab for API responses');
    console.log('   Look at the "inbox/threads" API calls\n');

    // Get current conversations data from the page
    const conversationsData = await page.evaluate(() => {
      // Try to get the React component state
      const component = document.querySelector('[data-testid="inbox-page"]');
      if (!component) return null;

      // Get all conversation items
      const items = Array.from(document.querySelectorAll('[data-conversation-item]'));
      return items.map(item => {
        const name = item.querySelector('[data-conversation-name]')?.textContent;
        const preview = item.querySelector('[data-conversation-preview]')?.textContent;
        return { name, preview };
      });
    });

    console.log('8. ANALYSIS:');
    console.log(`   ALL tab: ${allTabConversations.length} conversations`);
    console.log(`   UNREAD tab: ${unreadTabConversations.length} conversations`);
    console.log(`   READ tab: ${readTabConversations.length} conversations\n`);

    if (unreadTabConversations.length === readTabConversations.length) {
      console.log('   ⚠️  BUG CONFIRMED: Unread and Read tabs show SAME number of conversations!');
      console.log('   This indicates the filtering is NOT working correctly.\n');
    }

    console.log('\n=== WAITING 30 seconds for manual inspection ===');
    console.log('Check the browser window and DevTools Network tab');
    console.log('Look for the inbox/threads API response data\n');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'inbox_tabs_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
