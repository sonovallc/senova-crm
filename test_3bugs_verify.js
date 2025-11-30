const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots', 'bug-verify-3');
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

    // Screenshot 1: All tab
    await page.screenshot({ path: path.join(screenshotDir, 'bug1-01-all-tab.png'), fullPage: true });
    console.log('Screenshot: bug1-01-all-tab.png');

    // Count conversations in All tab
    const allConvos = await page.locator('.cursor-pointer').count();
    console.log('All tab conversation count:', allConvos);

    // Click Unread tab
    const unreadTab = page.locator('[role="tab"]:has-text("Unread")').first();
    if (await unreadTab.count() > 0) {
      await unreadTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug1-02-unread-tab.png'), fullPage: true });
      console.log('Screenshot: bug1-02-unread-tab.png');

      const unreadConvos = await page.locator('.cursor-pointer').count();
      console.log('Unread tab conversation count:', unreadConvos);
    } else {
      console.log('Unread tab not found');
    }

    // Click Read tab
    const readTab = page.locator('[role="tab"]:has-text("Read")').first();
    if (await readTab.count() > 0) {
      await readTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug1-03-read-tab.png'), fullPage: true });
      console.log('Screenshot: bug1-03-read-tab.png');

      const readConvos = await page.locator('.cursor-pointer').count();
      console.log('Read tab conversation count:', readConvos);
    } else {
      console.log('Read tab not found');
    }

    // Click Archived tab
    const archivedTab = page.locator('[role="tab"]:has-text("Archived")').first();
    if (await archivedTab.count() > 0) {
      await archivedTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'bug1-04-archived-tab.png'), fullPage: true });
      console.log('Screenshot: bug1-04-archived-tab.png');

      const archivedConvos = await page.locator('.cursor-pointer').count();
      console.log('Archived tab conversation count:', archivedConvos);
    }

    // ==================== BUG 4: CAMPAIGN DELETE ====================
    console.log('\n=== BUG 4: CAMPAIGN DELETE ===');

    await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'bug4-01-campaigns-list.png'), fullPage: true });
    console.log('Screenshot: bug4-01-campaigns-list.png');

    // Find delete button (look for trash icon in table row)
    const trashIcons = await page.locator('svg.lucide-trash-2').all();
    console.log('Trash icons found:', trashIcons.length);

    if (trashIcons.length > 0) {
      // Click the first trash icon's parent button
      await trashIcons[0].click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug4-02-after-delete-click.png'), fullPage: true });
      console.log('Screenshot: bug4-02-after-delete-click.png');

      // Check for confirmation dialog
      const dialogVisible = await page.locator('[role="alertdialog"], [role="dialog"]').isVisible().catch(() => false);
      console.log('Confirmation dialog visible:', dialogVisible);

      if (dialogVisible) {
        await page.screenshot({ path: path.join(screenshotDir, 'bug4-02b-dialog.png'), fullPage: true });

        // Look for confirm button in dialog
        const confirmBtn = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(3000);
        }
      }

      await page.screenshot({ path: path.join(screenshotDir, 'bug4-03-after-confirm.png'), fullPage: true });
      console.log('Screenshot: bug4-03-after-confirm.png');

      // Check for error toast
      const errorToast = await page.locator('.bg-destructive, [class*="destructive"], .text-red-500').first().textContent().catch(() => '');
      console.log('Error message found:', errorToast || 'None');
    } else {
      console.log('No trash icons found - checking for other patterns');
    }

    // ==================== BUG 7: AUTORESPONDER TEMPLATE ====================
    console.log('\n=== BUG 7: AUTORESPONDER TEMPLATE SAVE ===');

    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, 'bug7-01-autoresponders-list.png'), fullPage: true });
    console.log('Screenshot: bug7-01-autoresponders-list.png');

    // Find and click edit button on first autoresponder (pencil icon)
    const editIcons = await page.locator('svg.lucide-pencil').all();
    console.log('Edit icons found:', editIcons.length);

    if (editIcons.length > 0) {
      await editIcons[0].click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-02-edit-page.png'), fullPage: true });
      console.log('Screenshot: bug7-02-edit-page.png');

      // Scroll down to sequence section
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-03-sequence-section.png'), fullPage: true });
      console.log('Screenshot: bug7-03-sequence-section.png');

      // Enable sequence if not already
      const sequenceCheckbox = page.locator('label:has-text("Enable multi-step sequence")').first();
      if (await sequenceCheckbox.count() > 0) {
        await sequenceCheckbox.click();
        await page.waitForTimeout(1000);
      }

      // Look for Add Sequence Step button
      const addStepBtn = page.locator('button:has-text("Add Sequence Step")').first();
      if (await addStepBtn.count() > 0) {
        await addStepBtn.click();
        await page.waitForTimeout(1000);
      }

      // Scroll to see steps
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(500);

      await page.screenshot({ path: path.join(screenshotDir, 'bug7-04-sequence-steps.png'), fullPage: true });
      console.log('Screenshot: bug7-04-sequence-steps.png');

      // Try to find template dropdown in step
      const stepDropdown = page.locator('#step-template-0, button[id*="step-template"]').first();
      if (await stepDropdown.count() > 0) {
        console.log('Found step template dropdown');
        await stepDropdown.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: path.join(screenshotDir, 'bug7-05-template-dropdown-open.png'), fullPage: true });
        console.log('Screenshot: bug7-05-template-dropdown-open.png');

        // Select a template option
        const templateOptions = await page.locator('[role="option"]').all();
        console.log('Template options found:', templateOptions.length);

        for (const opt of templateOptions) {
          const text = await opt.textContent();
          if (text && !text.includes('Custom') && !text.includes('Loading') && text.trim()) {
            console.log('Selecting template:', text.trim());
            await opt.click();
            break;
          }
        }

        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, 'bug7-06-template-selected.png'), fullPage: true });
        console.log('Screenshot: bug7-06-template-selected.png');

        // Click Save
        const saveBtn = page.locator('button:has-text("Save")').first();
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(3000);

          await page.screenshot({ path: path.join(screenshotDir, 'bug7-07-after-save.png'), fullPage: true });
          console.log('Screenshot: bug7-07-after-save.png');
        }
      } else {
        console.log('Step template dropdown not found');
      }
    } else {
      console.log('No edit icons found');
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
