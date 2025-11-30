const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots', 'final-verification');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results = {
    bug1: { status: 'UNKNOWN', details: '' },
    bug4: { status: 'UNKNOWN', details: '' },
    bug7: { status: 'UNKNOWN', details: '' }
  };

  try {
    // LOGIN
    console.log('=== LOGGING IN ===');
    await page.goto('http://localhost:3004/login', { timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('Login completed');

    // ==================== BUG 1: INBOX TABS ====================
    console.log('\n=== BUG 1: INBOX UNREAD/READ TABS ===');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 60000 });
    await page.waitForTimeout(3000);

    // Screenshot All tab - count visible conversations
    await page.screenshot({ path: path.join(screenshotDir, 'bug1-01-all-tab.png'), fullPage: true });
    console.log('Screenshot: bug1-01-all-tab.png');

    // Check for "Pending" text which indicates conversations
    const allTabContent = await page.content();
    const pendingCountAll = (allTabContent.match(/Pending/g) || []).length;
    console.log('All tab - Pending conversations:', pendingCountAll);

    // Click Unread tab
    await page.click('button:has-text("Unread")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug1-02-unread-tab.png'), fullPage: true });
    console.log('Screenshot: bug1-02-unread-tab.png');

    // Check Unread content
    const unreadContent = await page.content();
    const pendingCountUnread = (unreadContent.match(/Pending/g) || []).length;
    const noConversationsUnread = unreadContent.includes('No conversations');
    console.log('Unread tab - Pending conversations:', pendingCountUnread);
    console.log('Unread tab - "No conversations" shown:', noConversationsUnread);

    // Click Read tab
    await page.click('button:has-text("Read")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug1-03-read-tab.png'), fullPage: true });
    console.log('Screenshot: bug1-03-read-tab.png');

    // Determine BUG 1 status
    if (pendingCountUnread > 0 || !noConversationsUnread) {
      results.bug1.status = 'FIXED';
      results.bug1.details = `Unread tab shows ${pendingCountUnread} Pending conversations`;
    } else if (noConversationsUnread && pendingCountAll > 0) {
      results.bug1.status = 'BROKEN';
      results.bug1.details = 'Unread tab empty while All tab has conversations';
    } else {
      results.bug1.status = 'UNCLEAR';
      results.bug1.details = 'No Pending conversations in system to test';
    }

    console.log('BUG 1 Result:', results.bug1.status, '-', results.bug1.details);

    // ==================== BUG 4: CAMPAIGN DELETE ====================
    console.log('\n=== BUG 4: CAMPAIGN DELETE ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'bug4-01-campaigns-list.png'), fullPage: true });
    console.log('Screenshot: bug4-01-campaigns-list.png');

    // Count campaigns before
    const campaignCards = await page.locator('.border.rounded-lg').all();
    const campaignCountBefore = campaignCards.length;
    console.log('Campaigns before:', campaignCountBefore);

    if (campaignCountBefore > 0) {
      // Click the three-dot menu on first campaign (the ... button)
      const moreBtn = page.locator('.border.rounded-lg').first().locator('button').last();
      await moreBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug4-02-menu-open.png'), fullPage: true });
      console.log('Screenshot: bug4-02-menu-open.png');

      // Look for Delete in the dropdown
      const deleteBtn = page.locator('[role="menuitem"]:has-text("Delete")');
      if (await deleteBtn.count() > 0) {
        console.log('Delete option found - clicking...');
        await deleteBtn.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: path.join(screenshotDir, 'bug4-03-after-delete-click.png'), fullPage: true });
        console.log('Screenshot: bug4-03-after-delete-click.png');

        // Check for confirmation dialog
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');
        if (await confirmDialog.isVisible().catch(() => false)) {
          console.log('Confirmation dialog appeared');
          await page.screenshot({ path: path.join(screenshotDir, 'bug4-04-confirm-dialog.png'), fullPage: true });

          // Click confirm delete
          const confirmBtn = page.locator('[role="alertdialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Delete")').last();
          if (await confirmBtn.count() > 0) {
            await confirmBtn.click();
            await page.waitForTimeout(3000);
          }
        }

        await page.screenshot({ path: path.join(screenshotDir, 'bug4-05-final-result.png'), fullPage: true });
        console.log('Screenshot: bug4-05-final-result.png');

        // Check for error/success
        const pageContent = await page.content();
        const hasError = pageContent.toLowerCase().includes('failed to delete') ||
                        pageContent.toLowerCase().includes('error');
        const hasSuccess = pageContent.toLowerCase().includes('deleted successfully');

        // Count campaigns after
        const campaignCountAfter = await page.locator('.border.rounded-lg').count();
        console.log('Campaigns after:', campaignCountAfter);

        if (hasError) {
          results.bug4.status = 'BROKEN';
          results.bug4.details = 'Delete failed with error';
        } else if (campaignCountAfter < campaignCountBefore || hasSuccess) {
          results.bug4.status = 'FIXED';
          results.bug4.details = `Campaign deleted successfully (${campaignCountBefore} -> ${campaignCountAfter})`;
        } else {
          results.bug4.status = 'UNCLEAR';
          results.bug4.details = 'No clear success/error indication';
        }
      } else {
        results.bug4.status = 'SKIP';
        results.bug4.details = 'Delete option not found in menu';
      }
    } else {
      results.bug4.status = 'SKIP';
      results.bug4.details = 'No campaigns to test';
    }

    console.log('BUG 4 Result:', results.bug4.status, '-', results.bug4.details);

    // ==================== BUG 7: AUTORESPONDER TEMPLATE ====================
    console.log('\n=== BUG 7: AUTORESPONDER TEMPLATE SAVE ===');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'bug7-01-autoresponders-list.png'), fullPage: true });
    console.log('Screenshot: bug7-01-autoresponders-list.png');

    // Find the edit button (pencil icon) in the Actions column
    const editBtn = page.locator('button:has(svg)').filter({ has: page.locator('svg.lucide-edit, svg.lucide-pencil, svg[class*="edit"], svg[class*="pencil"]') }).first();

    // Alternative: look for edit button by position in Actions column
    const actionButtons = await page.locator('table tbody tr').first().locator('button').all();
    console.log('Action buttons found:', actionButtons.length);

    if (actionButtons.length >= 2) {
      // The edit button should be the second one (after stats)
      const editButton = actionButtons[1];
      console.log('Clicking edit button...');
      await editButton.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-02-edit-page.png'), fullPage: true });
      console.log('Screenshot: bug7-02-edit-page.png');

      // Scroll to sequence section
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-03-sequence-section.png'), fullPage: true });
      console.log('Screenshot: bug7-03-sequence-section.png');

      // Look for template dropdown
      const templateDropdown = page.locator('button[role="combobox"]').first();
      if (await templateDropdown.count() > 0) {
        const originalValue = await templateDropdown.textContent();
        console.log('Original template value:', originalValue);

        await templateDropdown.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: path.join(screenshotDir, 'bug7-04-dropdown-open.png'), fullPage: true });
        console.log('Screenshot: bug7-04-dropdown-open.png');

        // Select a template
        const options = await page.locator('[role="option"]').all();
        console.log('Dropdown options:', options.length);

        if (options.length > 0) {
          // Pick a different option
          for (const opt of options) {
            const text = await opt.textContent();
            if (text !== originalValue && text.trim() && !text.includes('Custom')) {
              console.log('Selecting:', text);
              await opt.click();
              break;
            }
          }
          await page.waitForTimeout(1000);

          const newValue = await templateDropdown.textContent();
          console.log('New template value:', newValue);

          await page.screenshot({ path: path.join(screenshotDir, 'bug7-05-after-selection.png'), fullPage: true });

          // Click Save
          const saveBtn = page.locator('button:has-text("Save")').first();
          if (await saveBtn.count() > 0) {
            console.log('Clicking Save...');
            await saveBtn.click();
            await page.waitForTimeout(3000);

            await page.screenshot({ path: path.join(screenshotDir, 'bug7-06-after-save.png'), fullPage: true });

            // Navigate back to verify persistence
            await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 60000 });
            await page.waitForTimeout(2000);

            // Click edit again
            const actionButtons2 = await page.locator('table tbody tr').first().locator('button').all();
            if (actionButtons2.length >= 2) {
              await actionButtons2[1].click();
              await page.waitForTimeout(3000);

              await page.evaluate(() => window.scrollTo(0, 1000));
              await page.waitForTimeout(500);

              await page.screenshot({ path: path.join(screenshotDir, 'bug7-07-verification.png'), fullPage: true });

              const verifyDropdown = page.locator('button[role="combobox"]').first();
              if (await verifyDropdown.count() > 0) {
                const persistedValue = await verifyDropdown.textContent();
                console.log('Persisted value:', persistedValue);

                if (persistedValue === newValue) {
                  results.bug7.status = 'FIXED';
                  results.bug7.details = `Template persisted: ${persistedValue}`;
                } else if (persistedValue === originalValue) {
                  results.bug7.status = 'BROKEN';
                  results.bug7.details = `Template reverted to: ${persistedValue}`;
                } else {
                  results.bug7.status = 'UNCLEAR';
                  results.bug7.details = `Expected ${newValue}, got ${persistedValue}`;
                }
              }
            }
          }
        }
      } else {
        results.bug7.status = 'SKIP';
        results.bug7.details = 'No template dropdown found';
      }
    } else {
      results.bug7.status = 'SKIP';
      results.bug7.details = 'No edit button found';
    }

    console.log('BUG 7 Result:', results.bug7.status, '-', results.bug7.details);

    // ==================== FINAL SUMMARY ====================
    console.log('\n========================================');
    console.log('=== FINAL VERIFICATION SUMMARY ===');
    console.log('========================================');
    console.log('BUG 1 (Inbox Tabs):', results.bug1.status, '-', results.bug1.details);
    console.log('BUG 4 (Campaign Delete):', results.bug4.status, '-', results.bug4.details);
    console.log('BUG 7 (Autoresponder Template):', results.bug7.status, '-', results.bug7.details);
    console.log('========================================');

    const allFixed = results.bug1.status === 'FIXED' &&
                     results.bug4.status === 'FIXED' &&
                     results.bug7.status === 'FIXED';

    if (allFixed) {
      console.log('\n*** ALL BUGS VERIFIED AS FIXED ***');
    } else {
      console.log('\n*** SOME BUGS STILL NEED ATTENTION ***');
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
