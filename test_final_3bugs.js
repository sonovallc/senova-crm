const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots', 'final-3bugs');
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

    // Screenshot All tab
    await page.screenshot({ path: path.join(screenshotDir, 'bug1-01-all-tab.png'), fullPage: true });
    console.log('Screenshot: bug1-01-all-tab.png');

    // Click Unread tab
    const unreadTab = page.locator('button:has-text("Unread")').first();
    if (await unreadTab.count() > 0) {
      await unreadTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug1-02-unread-tab.png'), fullPage: true });
      console.log('Screenshot: bug1-02-unread-tab.png');

      // Check for conversations in Unread tab
      const pageContent = await page.content();
      const hasNoConversations = pageContent.includes('No conversations');

      // Look for conversation items - they have EMAIL badges and names
      const conversationItems = await page.locator('.cursor-pointer:has(.rounded-full)').count();
      console.log('Unread tab conversations count:', conversationItems);

      if (conversationItems > 0) {
        results.bug1.status = 'FIXED';
        results.bug1.details = `Unread tab shows ${conversationItems} conversations`;
      } else if (hasNoConversations) {
        results.bug1.status = 'BROKEN';
        results.bug1.details = 'Unread tab shows "No conversations"';
      } else {
        results.bug1.status = 'UNCLEAR';
        results.bug1.details = 'Cannot determine state';
      }
    }

    // Click Read tab
    const readTab = page.locator('button:has-text("Read")').first();
    if (await readTab.count() > 0) {
      await readTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug1-03-read-tab.png'), fullPage: true });
      console.log('Screenshot: bug1-03-read-tab.png');
    }

    console.log('BUG 1 Result:', results.bug1.status, '-', results.bug1.details);

    // ==================== BUG 4: CAMPAIGN DELETE ====================
    console.log('\n=== BUG 4: CAMPAIGN DELETE ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'bug4-01-campaigns-list.png'), fullPage: true });
    console.log('Screenshot: bug4-01-campaigns-list.png');

    // Count campaigns before delete
    const campaignsBefore = await page.locator('[class*="card"], [class*="campaign"]').count();
    console.log('Campaigns before:', campaignsBefore);

    // Find the three-dot menu (MoreHorizontal icon)
    const moreMenus = await page.locator('button:has(svg.lucide-more-horizontal)').all();
    console.log('Three-dot menu buttons found:', moreMenus.length);

    if (moreMenus.length > 0) {
      // Click the first three-dot menu
      await moreMenus[0].click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug4-02-menu-open.png'), fullPage: true });
      console.log('Screenshot: bug4-02-menu-open.png');

      // Look for Delete option in the dropdown
      const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")').first();
      if (await deleteOption.count() > 0) {
        console.log('Found Delete option in menu');
        await deleteOption.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: path.join(screenshotDir, 'bug4-03-after-delete-click.png'), fullPage: true });
        console.log('Screenshot: bug4-03-after-delete-click.png');

        // Check for confirmation dialog
        const dialog = page.locator('[role="alertdialog"], [role="dialog"]');
        if (await dialog.isVisible().catch(() => false)) {
          console.log('Confirmation dialog appeared');
          await page.screenshot({ path: path.join(screenshotDir, 'bug4-04-dialog.png'), fullPage: true });

          // Click confirm button
          const confirmBtn = page.locator('[role="alertdialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Delete")').last();
          if (await confirmBtn.count() > 0) {
            await confirmBtn.click();
            await page.waitForTimeout(3000);
          }
        }

        await page.screenshot({ path: path.join(screenshotDir, 'bug4-05-final-result.png'), fullPage: true });
        console.log('Screenshot: bug4-05-final-result.png');

        // Check for error toast
        const errorToast = await page.locator('[class*="destructive"], .bg-red-500, [class*="error"]').first();
        const errorVisible = await errorToast.isVisible().catch(() => false);
        const errorText = errorVisible ? await errorToast.textContent().catch(() => '') : '';

        // Check for success toast
        const successToast = await page.locator('[class*="success"], .bg-green-500').first();
        const successVisible = await successToast.isVisible().catch(() => false);

        if (errorVisible && errorText.toLowerCase().includes('delete')) {
          results.bug4.status = 'BROKEN';
          results.bug4.details = `Error: ${errorText}`;
        } else if (successVisible) {
          results.bug4.status = 'FIXED';
          results.bug4.details = 'Campaign deleted successfully';
        } else {
          // Check if campaign count reduced
          const campaignsAfter = await page.locator('[class*="card"], [class*="campaign"]').count();
          if (campaignsAfter < campaignsBefore) {
            results.bug4.status = 'FIXED';
            results.bug4.details = `Campaign deleted (${campaignsBefore} -> ${campaignsAfter})`;
          } else {
            results.bug4.status = 'UNCLEAR';
            results.bug4.details = 'No clear success/error indication';
          }
        }
      }
    } else {
      results.bug4.status = 'SKIP';
      results.bug4.details = 'No campaigns with delete menu found';
    }

    console.log('BUG 4 Result:', results.bug4.status, '-', results.bug4.details);

    // ==================== BUG 7: AUTORESPONDER TEMPLATE ====================
    console.log('\n=== BUG 7: AUTORESPONDER TEMPLATE SAVE ===');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'bug7-01-autoresponders-list.png'), fullPage: true });
    console.log('Screenshot: bug7-01-autoresponders-list.png');

    // Find the edit button (pencil icon)
    const editButtons = await page.locator('button:has(svg.lucide-pencil), button:has(svg.lucide-edit)').all();
    console.log('Edit buttons found:', editButtons.length);

    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-02-edit-page.png'), fullPage: true });
      console.log('Screenshot: bug7-02-edit-page.png');

      // Scroll down to sequence section
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-03-sequence-section.png'), fullPage: true });
      console.log('Screenshot: bug7-03-sequence-section.png');

      // Find template dropdown - look for Select component
      const templateDropdowns = await page.locator('button[role="combobox"], [id*="template"], select').all();
      console.log('Template dropdowns found:', templateDropdowns.length);

      let foundTemplateDropdown = null;
      for (const dropdown of templateDropdowns) {
        const text = await dropdown.textContent().catch(() => '');
        console.log('Dropdown text:', text);
        if (text.includes('Select') || text.includes('Template') || text.includes('Custom')) {
          foundTemplateDropdown = dropdown;
          break;
        }
      }

      if (foundTemplateDropdown) {
        const originalValue = await foundTemplateDropdown.textContent();
        console.log('Original template value:', originalValue);

        await foundTemplateDropdown.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: path.join(screenshotDir, 'bug7-04-dropdown-open.png'), fullPage: true });
        console.log('Screenshot: bug7-04-dropdown-open.png');

        // Get all options
        const options = await page.locator('[role="option"]').all();
        console.log('Dropdown options count:', options.length);

        // Select a different template
        let selectedNewTemplate = false;
        for (const opt of options) {
          const text = await opt.textContent();
          console.log('Option:', text);
          if (text && !text.includes('Custom') && text.trim() && text !== originalValue) {
            console.log('Selecting:', text.trim());
            await opt.click();
            selectedNewTemplate = true;
            break;
          }
        }

        if (selectedNewTemplate) {
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(screenshotDir, 'bug7-05-after-selection.png'), fullPage: true });
          console.log('Screenshot: bug7-05-after-selection.png');

          const newValue = await foundTemplateDropdown.textContent();
          console.log('New template value:', newValue);

          // Click Save button
          const saveBtn = page.locator('button:has-text("Save")').first();
          if (await saveBtn.count() > 0) {
            console.log('Clicking Save button...');
            await saveBtn.click();
            await page.waitForTimeout(3000);

            await page.screenshot({ path: path.join(screenshotDir, 'bug7-06-after-save.png'), fullPage: true });
            console.log('Screenshot: bug7-06-after-save.png');

            // Navigate away and back to verify persistence
            await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 60000 });
            await page.waitForTimeout(2000);

            // Click edit again
            const editAgain = await page.locator('button:has(svg.lucide-pencil), button:has(svg.lucide-edit)').first();
            if (await editAgain.count() > 0) {
              await editAgain.click();
              await page.waitForTimeout(3000);

              await page.evaluate(() => window.scrollTo(0, 1000));
              await page.waitForTimeout(500);

              await page.screenshot({ path: path.join(screenshotDir, 'bug7-07-verification.png'), fullPage: true });
              console.log('Screenshot: bug7-07-verification.png');

              // Check if template persisted
              const verifyDropdown = await page.locator('button[role="combobox"], [id*="template"]').first();
              if (await verifyDropdown.count() > 0) {
                const persistedValue = await verifyDropdown.textContent();
                console.log('Persisted template value:', persistedValue);

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
      results.bug7.details = 'No autoresponders to edit';
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
