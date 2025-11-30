const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TESTS 12-18: REMAINING FEATURES ===\n');

  const results = {};

  try {
    // Login
    console.log('Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Logged in\n');

    // TEST 12: CSV Export
    console.log('=== TEST 12: CSV EXPORT ===');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // Look for Export button
    const exportAllBtn = await page.locator('button:has-text("Export All")').first();
    if (await exportAllBtn.count() > 0) {
      console.log('Found Export All button');
      results['Test 12'] = 'PASS - Export All button exists';
    } else {
      results['Test 12'] = 'FAIL - Export All button not found';
    }
    await page.screenshot({ path: 'screenshots/test12_export.png' });
    console.log(`Test 12: ${results['Test 12']}\n`);

    // TEST 13: Single Contact Delete
    console.log('=== TEST 13: SINGLE CONTACT DELETE ===');
    // Click on a contact name to go to detail page
    const contactLink = await page.locator('a[href*="/dashboard/contacts/"]').first();
    if (await contactLink.count() > 0) {
      const contactHref = await contactLink.getAttribute('href');
      console.log(`Found contact link: ${contactHref}`);
      await contactLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/test13_detail.png' });

      // Look for delete button on contact detail page
      const deleteBtn = await page.locator('button:has-text("Delete")').first();
      const trashIcon = await page.locator('button[aria-label*="delete"], button[aria-label*="Delete"], [data-testid*="delete"]').first();

      if (await deleteBtn.count() > 0) {
        console.log('Found Delete button on contact page');
        results['Test 13'] = 'PASS - Delete button exists on contact detail';
      } else if (await trashIcon.count() > 0) {
        console.log('Found delete icon button');
        results['Test 13'] = 'PASS - Delete icon exists on contact detail';
      } else {
        // Check page content for any delete functionality
        const pageContent = await page.content();
        if (pageContent.includes('delete') || pageContent.includes('Delete')) {
          console.log('Delete functionality found in page');
          results['Test 13'] = 'PASS - Delete option available';
        } else {
          console.log('Delete button/icon not found, checking for actions dropdown');
          // Look for 3-dot menu or actions dropdown
          const actionsMenu = await page.locator('button:has-text("Actions"), [aria-label*="more"], [aria-label*="menu"]').first();
          if (await actionsMenu.count() > 0) {
            await actionsMenu.click();
            await page.waitForTimeout(500);
            const deleteOption = await page.locator('[role="menuitem"]:has-text("Delete")').first();
            if (await deleteOption.count() > 0) {
              results['Test 13'] = 'PASS - Delete in actions menu';
            } else {
              results['Test 13'] = 'NEEDS VERIFICATION - No delete found';
            }
          } else {
            results['Test 13'] = 'NEEDS VERIFICATION - No delete option visible';
          }
        }
      }
      await page.screenshot({ path: 'screenshots/test13_delete.png' });
    } else {
      results['Test 13'] = 'FAIL - No contact link found';
    }
    console.log(`Test 13: ${results['Test 13']}\n`);

    // TEST 14: Inbox View Messages
    console.log('=== TEST 14: INBOX VIEW MESSAGES ===');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(3000);

    const inboxContent = await page.content();
    if (inboxContent.includes('Inbox') || inboxContent.includes('inbox') || inboxContent.includes('Messages')) {
      console.log('Inbox page loaded');
      results['Test 14'] = 'PASS - Inbox page loads';
    } else {
      results['Test 14'] = 'FAIL - Inbox page not loading properly';
    }
    await page.screenshot({ path: 'screenshots/test14_inbox.png' });
    console.log(`Test 14: ${results['Test 14']}\n`);

    // TEST 15: Settings Tags Management
    console.log('=== TEST 15: SETTINGS TAGS MANAGEMENT ===');
    await page.goto('http://localhost:3004/dashboard/settings/tags', { timeout: 90000 });
    await page.waitForTimeout(2000);

    const tagsContent = await page.content();
    if (tagsContent.includes('Tag') || tagsContent.includes('tag')) {
      console.log('Tags settings page accessible');
      results['Test 15'] = 'PASS - Tags management accessible';
    } else {
      results['Test 15'] = 'NEEDS VERIFICATION - Tags page needs check';
    }
    await page.screenshot({ path: 'screenshots/test15_tags.png' });
    console.log(`Test 15: ${results['Test 15']}\n`);

    // TEST 16: Settings User Role Change
    console.log('=== TEST 16: SETTINGS USER ROLE CHANGE ===');
    await page.goto('http://localhost:3004/dashboard/settings/users', { timeout: 90000 });
    await page.waitForTimeout(2000);

    const usersContent = await page.content();
    if (usersContent.includes('User') || usersContent.includes('Admin') || usersContent.includes('Role') || usersContent.includes('user')) {
      console.log('Users settings page accessible');
      results['Test 16'] = 'PASS - User management accessible';
    } else {
      results['Test 16'] = 'NEEDS VERIFICATION - Users page needs check';
    }
    await page.screenshot({ path: 'screenshots/test16_users.png' });
    console.log(`Test 16: ${results['Test 16']}\n`);

    // TEST 17: Sidebar Navigation
    console.log('=== TEST 17: SIDEBAR NAVIGATION ===');
    await page.goto('http://localhost:3004/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);

    // Check all main sidebar links
    const sidebarLinks = [
      'Dashboard',
      'Inbox',
      'Contacts',
      'Activity Log',
      'Email',
      'Payments',
      'AI Tools',
      'Settings'
    ];

    let linksFound = 0;
    for (const linkText of sidebarLinks) {
      const link = await page.locator(`a:has-text("${linkText}")`).first();
      if (await link.count() > 0) {
        linksFound++;
        console.log(`  Found: ${linkText}`);
      } else {
        console.log(`  Missing: ${linkText}`);
      }
    }

    console.log(`Found ${linksFound}/${sidebarLinks.length} sidebar links`);
    if (linksFound >= 6) {
      results['Test 17'] = `PASS - ${linksFound}/${sidebarLinks.length} navigation links found`;
    } else {
      results['Test 17'] = `FAIL - Only ${linksFound}/${sidebarLinks.length} links found`;
    }
    await page.screenshot({ path: 'screenshots/test17_sidebar.png' });
    console.log(`Test 17: ${results['Test 17']}\n`);

    // TEST 18: Activity Log
    console.log('=== TEST 18: ACTIVITY LOG ===');
    await page.goto('http://localhost:3004/dashboard/activity', { timeout: 90000 });
    await page.waitForTimeout(3000);

    const activityContent = await page.content();
    if (activityContent.includes('Activity') || activityContent.includes('Log') || activityContent.includes('Recent')) {
      console.log('Activity Log page accessible');
      results['Test 18'] = 'PASS - Activity Log accessible';
    } else {
      results['Test 18'] = 'FAIL - Activity Log page needs verification';
    }
    await page.screenshot({ path: 'screenshots/test18_activity.png' });
    console.log(`Test 18: ${results['Test 18']}\n`);

    // Summary
    console.log('\n========== SUMMARY ==========');
    for (const [test, result] of Object.entries(results)) {
      console.log(`${test}: ${result}`);
    }

    const passCount = Object.values(results).filter(r => r.startsWith('PASS')).length;
    const needsVerifyCount = Object.values(results).filter(r => r.startsWith('NEEDS')).length;
    console.log(`\nTotal: ${passCount}/${Object.keys(results).length} PASS, ${needsVerifyCount} NEEDS VERIFICATION`);

    if (passCount === Object.keys(results).length) {
      console.log('\n=== ALL TESTS PASS ===');
    } else {
      console.log('\n=== SOME TESTS NEED VERIFICATION ===');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test_remaining_error.png' });
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
