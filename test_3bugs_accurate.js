const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots', 'bug-verify-accurate');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // LOGIN
    console.log('=== LOGGING IN ===');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('Login completed');

    // ==================== BUG 1: INBOX TABS ====================
    console.log('\n=== BUG 1: INBOX UNREAD/READ TABS ===');

    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // Screenshot 1: All tab (should show conversations)
    await page.screenshot({ path: path.join(screenshotDir, 'bug1-01-all-tab.png'), fullPage: true });
    console.log('Screenshot: bug1-01-all-tab.png');

    // Count conversations in All tab using visible thread items
    const allConvos = await page.locator('[class*="flex"][class*="cursor-pointer"]').count();
    console.log('All tab: Found elements with cursor-pointer:', allConvos);

    // Try counting by looking for names (NR, EM, etc. avatars)
    const avatarItems = await page.locator('div:has(> div[class*="rounded-full"])').count();
    console.log('All tab: Items with avatar circles:', avatarItems);

    // Click Unread tab
    const unreadTab = page.locator('button:has-text("Unread")').first();
    if (await unreadTab.count() > 0) {
      console.log('Clicking Unread tab...');
      await unreadTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug1-02-unread-tab.png'), fullPage: true });
      console.log('Screenshot: bug1-02-unread-tab.png');

      // Check if any conversations are visible
      const pageContent = await page.content();
      const hasNoConversations = pageContent.includes('No conversations') || pageContent.includes('no messages');
      console.log('Unread tab - "No conversations" message:', hasNoConversations);
    }

    // Click Read tab
    const readTab = page.locator('button:has-text("Read")').first();
    if (await readTab.count() > 0) {
      console.log('Clicking Read tab...');
      await readTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug1-03-read-tab.png'), fullPage: true });
      console.log('Screenshot: bug1-03-read-tab.png');
    }

    // Click Archived tab
    const archivedTab = page.locator('button:has-text("Archived")').first();
    if (await archivedTab.count() > 0) {
      console.log('Clicking Archived tab...');
      await archivedTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug1-04-archived-tab.png'), fullPage: true });
      console.log('Screenshot: bug1-04-archived-tab.png');
    }

    // ==================== BUG 4: CAMPAIGN DELETE ====================
    console.log('\n=== BUG 4: CAMPAIGN DELETE ===');

    await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'bug4-01-campaigns-list.png'), fullPage: true });
    console.log('Screenshot: bug4-01-campaigns-list.png');

    // Find the three-dot menu (MoreHorizontal icon or ... button)
    const moreMenus = await page.locator('button:has(svg.lucide-more-horizontal), button:has-text("..."), [class*="more"]').all();
    console.log('Three-dot menu buttons found:', moreMenus.length);

    if (moreMenus.length > 0) {
      // Click the first three-dot menu
      await moreMenus[0].click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug4-02-menu-open.png'), fullPage: true });
      console.log('Screenshot: bug4-02-menu-open.png');

      // Look for Delete option in the dropdown
      const deleteOption = page.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")').first();
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
        const errorVisible = await page.locator('[class*="destructive"], [class*="error"], .bg-red-500').isVisible().catch(() => false);
        console.log('Error visible after delete:', errorVisible);
      } else {
        console.log('Delete option NOT found in menu');
      }
    } else {
      console.log('No three-dot menus found');
    }

    // ==================== BUG 7: AUTORESPONDER TEMPLATE ====================
    console.log('\n=== BUG 7: AUTORESPONDER TEMPLATE SAVE ===');

    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'bug7-01-autoresponders-list.png'), fullPage: true });
    console.log('Screenshot: bug7-01-autoresponders-list.png');

    // Find the edit button (pencil icon in Actions column)
    const editButtons = await page.locator('button:has(svg.lucide-pencil), a:has(svg.lucide-pencil)').all();
    console.log('Edit buttons found:', editButtons.length);

    // Also try to find by looking at the row actions area
    const actionButtons = await page.locator('td button:has(svg), td a:has(svg)').all();
    console.log('Action buttons in table cells:', actionButtons.length);

    // Click the edit button
    if (editButtons.length > 0) {
      console.log('Clicking edit button...');
      await editButtons[0].click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-02-edit-page.png'), fullPage: true });
      console.log('Screenshot: bug7-02-edit-page.png');

      // Scroll down to sequence section
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-03-sequence-section.png'), fullPage: true });
      console.log('Screenshot: bug7-03-sequence-section.png');

      // Check if sequence is already enabled - look for "Multi-Step" indicator or step content
      const stepSection = await page.locator('text=Step 1, text=Sequence Step').count();
      console.log('Step sections visible:', stepSection);

      // Scroll to see step details
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(500);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-04-step-details.png'), fullPage: true });
      console.log('Screenshot: bug7-04-step-details.png');

      // Find template dropdown
      const templateDropdown = page.locator('button[id*="template"], #step-template-0, [aria-label*="template"]').first();
      if (await templateDropdown.count() > 0) {
        console.log('Found template dropdown');
        const currentValue = await templateDropdown.textContent();
        console.log('Current template value:', currentValue);

        await templateDropdown.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: path.join(screenshotDir, 'bug7-05-dropdown-open.png'), fullPage: true });
        console.log('Screenshot: bug7-05-dropdown-open.png');

        // Get all options
        const options = await page.locator('[role="option"]').all();
        console.log('Dropdown options count:', options.length);

        // Select a different template (not Custom Content)
        for (const opt of options) {
          const text = await opt.textContent();
          console.log('Option:', text);
          if (text && !text.includes('Custom') && text.trim()) {
            console.log('Selecting:', text.trim());
            await opt.click();
            break;
          }
        }

        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, 'bug7-06-after-selection.png'), fullPage: true });
        console.log('Screenshot: bug7-06-after-selection.png');

        // Check new value
        const newValue = await templateDropdown.textContent();
        console.log('New template value:', newValue);

        // Click Save button
        const saveBtn = page.locator('button:has-text("Save")').first();
        if (await saveBtn.count() > 0) {
          console.log('Clicking Save button...');
          await saveBtn.click();
          await page.waitForTimeout(3000);

          await page.screenshot({ path: path.join(screenshotDir, 'bug7-07-after-save.png'), fullPage: true });
          console.log('Screenshot: bug7-07-after-save.png');

          // Navigate away and back to verify persistence
          await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
          await page.waitForTimeout(2000);

          // Click edit again
          const editAgain = await page.locator('button:has(svg.lucide-pencil), a:has(svg.lucide-pencil)').first();
          if (await editAgain.count() > 0) {
            await editAgain.click();
            await page.waitForTimeout(3000);

            await page.evaluate(() => window.scrollTo(0, 1200));
            await page.waitForTimeout(500);

            await page.screenshot({ path: path.join(screenshotDir, 'bug7-08-verification.png'), fullPage: true });
            console.log('Screenshot: bug7-08-verification.png');

            // Check if template persisted
            const verifyDropdown = page.locator('button[id*="template"], #step-template-0').first();
            if (await verifyDropdown.count() > 0) {
              const persistedValue = await verifyDropdown.textContent();
              console.log('Persisted template value:', persistedValue);

              if (persistedValue && !persistedValue.includes('Custom')) {
                console.log('*** SUCCESS: Template selection PERSISTED! ***');
              } else {
                console.log('*** FAILURE: Template selection DID NOT persist! ***');
              }
            }
          }
        }
      } else {
        console.log('Template dropdown not found');
      }
    } else {
      // Try clicking on the row itself or the pencil in actions
      const pencilInRow = page.locator('tr button:has(svg), tr a:has(svg)').first();
      console.log('Trying to find pencil in row...');
      if (await pencilInRow.count() > 0) {
        await pencilInRow.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(screenshotDir, 'bug7-02b-after-row-click.png'), fullPage: true });
      }
    }

    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('Screenshots saved to:', screenshotDir);

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
