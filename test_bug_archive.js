const { chromium } = require('playwright');

(async () => {
  console.log('=== BUG-A: Inbox Archive Network Error Test ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/auth/login');
    await page.waitForLoadState('networkidle');

    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('✓ Login successful\n');

    console.log('Step 3: Navigating to Inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✓ Inbox loaded\n');

    console.log('Step 4: Taking screenshot of inbox...');
    await page.screenshot({ path: 'screenshots/bug-archive-01-inbox.png', fullPage: true });
    console.log('✓ Screenshot saved\n');

    console.log('Step 5: Checking for conversations...');
    const conversations = await page.locator('[data-testid^="inbox-message-item-"]').count();
    console.log(`Found ${conversations} conversation(s)\n`);

    if (conversations > 0) {
      // Click first conversation to select it
      console.log('Step 6: Selecting first conversation...');
      const firstConversation = page.locator('[data-testid^="inbox-message-item-"]').first();
      await firstConversation.click();
      await page.waitForTimeout(1500);
      console.log('✓ Conversation selected\n');

      await page.screenshot({ path: 'screenshots/bug-archive-02-selected.png', fullPage: true });
      console.log('✓ Screenshot saved\n');

      // Set up network monitoring BEFORE clicking archive
      console.log('Step 7: Setting up network monitoring...');
      let archiveResponse = null;
      page.on('response', response => {
        if (response.url().includes('/archive')) {
          archiveResponse = {
            status: response.status(),
            statusText: response.statusText(),
            url: response.url()
          };
          console.log(`📡 Archive API Response: ${response.status()} ${response.statusText()}`);
        }
      });

      // Look for Archive button in the header area (main button, not hover button)
      console.log('Step 8: Looking for Archive button in header...');
      const archiveButton = page.locator('button:has-text("Archive")').first();
      const archiveButtonExists = await archiveButton.count() > 0;

      if (archiveButtonExists) {
        console.log('✓ Archive button found\n');

        console.log('Step 9: Clicking Archive button...');
        await archiveButton.click();
        await page.waitForTimeout(3000);

        console.log('Step 10: Checking results...\n');

        // Check for error toast
        const errorToast = page.locator('[role="alert"]:has-text("Error")');
        const hasError = await errorToast.count() > 0;

        // Check for success toast
        const successToast = page.locator('[role="alert"]:has-text("archived")');
        const hasSuccess = await successToast.count() > 0;

        await page.screenshot({ path: 'screenshots/bug-archive-03-result.png', fullPage: true });
        console.log('✓ Screenshot saved\n');

        // Report results
        console.log('=== RESULTS ===\n');

        if (archiveResponse) {
          console.log(`Network Response: ${archiveResponse.status} ${archiveResponse.statusText}`);

          if (archiveResponse.status === 500) {
            console.log('❌ BUG CONFIRMED: Archive endpoint returning 500 Internal Server Error');
            console.log('   This indicates the exception handlers are NOT working properly.\n');
          } else if (archiveResponse.status === 404) {
            console.log('✓ PARTIAL FIX: Returning 404 Not Found (exception handlers working)');
            console.log('   This means communication was not found - check if ID is valid.\n');
          } else if (archiveResponse.status === 200) {
            console.log('✓ BUG FIXED: Archive endpoint working correctly!');
            console.log('   Returning 200 OK as expected.\n');
          } else {
            console.log(`ℹ️  Unexpected status code: ${archiveResponse.status}\n`);
          }
        }

        if (hasError) {
          const errorText = await errorToast.textContent();
          console.log(`Error Toast: ${errorText}`);
        }

        if (hasSuccess) {
          const successText = await successToast.textContent();
          console.log(`Success Toast: ${successText}`);
        }

        if (!hasError && !hasSuccess) {
          console.log('⚠️  No toast notification displayed');
        }

      } else {
        // Check for Unarchive button instead
        const unarchiveButton = page.locator('button:has-text("Unarchive")').first();
        const unarchiveButtonExists = await unarchiveButton.count() > 0;

        if (unarchiveButtonExists) {
          console.log('ℹ️  Found Unarchive button - conversation already archived');
          console.log('   Testing unarchive instead...\n');

          await unarchiveButton.click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'screenshots/bug-archive-03-unarchive-result.png', fullPage: true });
        } else {
          console.log('❌ No Archive or Unarchive button found!');
          console.log('   This suggests the UI may not be rendering properly.\n');
        }
      }

    } else {
      console.log('⚠️  No conversations found in inbox.');
      console.log('   Please ensure there are messages in the inbox to test archive functionality.\n');
    }

    console.log('\n=== TEST COMPLETE ===\n');
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'screenshots/bug-archive-ERROR.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
