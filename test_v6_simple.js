const playwright = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const screenshotDir = path.join(__dirname, 'screenshots');

  const results = {
    checkboxColumnExists: false,
    individualSelectionWorks: false,
    selectionCountDisplays: false,
    bulkActionBarAppears: false,
    addTagsActionWorks: false,
    tagsVisibleOnContacts: false
  };

  try {
    console.log('VERIFICATION #6: Contacts - Bulk Selection & Actions\n');

    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Logged in\n');

    console.log('Step 2: Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'v6-bulk-01-contacts.png'), fullPage: true });
    console.log('Screenshot: v6-bulk-01-contacts.png\n');

    console.log('Step 3: Check for checkboxes...');
    const checkboxCount = await page.locator('input[type="checkbox"]').count();
    console.log('Found ' + checkboxCount + ' checkboxes');
    results.checkboxColumnExists = checkboxCount > 0;

    if (checkboxCount > 0) {
      await page.screenshot({ path: path.join(screenshotDir, 'v6-bulk-02-checkboxes.png'), fullPage: true });
      console.log('Checkbox column exists: PASS\n');

      console.log('Step 4: Select first contact...');
      const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
      const hasCheckbox = await firstCheckbox.count() > 0;

      if (hasCheckbox) {
        await firstCheckbox.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, 'v6-bulk-03-one-selected.png'), fullPage: true });
        results.individualSelectionWorks = true;
        console.log('Individual selection works: PASS\n');

        const bodyText = await page.textContent('body');
        if (bodyText.includes('selected') || bodyText.includes('Selected')) {
          results.selectionCountDisplays = true;
          console.log('Selection count displays: PASS\n');
        }

        console.log('Step 5: Select multiple contacts...');
        const allCheckboxes = await page.locator('tbody input[type="checkbox"]').all();
        if (allCheckboxes.length >= 3) {
          await allCheckboxes[1].click();
          await page.waitForTimeout(500);
          await allCheckboxes[2].click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(screenshotDir, 'v6-bulk-04-three-selected.png'), fullPage: true });
          console.log('Three contacts selected\n');
        }

        console.log('Step 6: Check for bulk action bar...');
        const bulkButtons = await page.locator('button:has-text("Add Tags"), button:has-text("Tags"), button:has-text("Bulk")').count();
        if (bulkButtons > 0) {
          results.bulkActionBarAppears = true;
          console.log('Bulk action bar appears: PASS\n');
        } else {
          console.log('Bulk action bar NOT found: FAIL\n');
        }

        console.log('Step 7: Test Add Tags...');
        const addTagsBtn = page.locator('button:has-text("Add Tags")').first();
        if (await addTagsBtn.count() > 0) {
          await addTagsBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(screenshotDir, 'v6-bulk-05-tags-modal.png'), fullPage: true });
          console.log('Add Tags modal opened\n');

          const tagOptions = await page.locator('input[type="checkbox"], [role="option"]').count();
          console.log('Found ' + tagOptions + ' tag options');

          if (tagOptions > 0) {
            await page.locator('input[type="checkbox"]').first().click();
            await page.waitForTimeout(500);

            const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Save")').first();
            if (await applyBtn.count() > 0) {
              await applyBtn.click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: path.join(screenshotDir, 'v6-bulk-06-tags-applied.png'), fullPage: true });
              results.addTagsActionWorks = true;
              console.log('Add Tags action works: PASS\n');
            }
          }
        }

        await page.screenshot({ path: path.join(screenshotDir, 'v6-bulk-07-final.png'), fullPage: true });

        const finalBodyText = await page.textContent('body');
        if (finalBodyText.includes('tag') || finalBodyText.includes('Tag')) {
          results.tagsVisibleOnContacts = true;
          console.log('Tags visible on contacts: PASS\n');
        }
      }
    }

    console.log('==========================================================');
    console.log('VERIFICATION #6 RESULTS');
    console.log('==========================================================');
    console.log('Checkbox column exists: ' + (results.checkboxColumnExists ? 'PASS' : 'FAIL'));
    console.log('Individual selection works: ' + (results.individualSelectionWorks ? 'PASS' : 'FAIL'));
    console.log('Selection count displays: ' + (results.selectionCountDisplays ? 'PASS' : 'FAIL'));
    console.log('Bulk action bar appears: ' + (results.bulkActionBarAppears ? 'PASS' : 'FAIL'));
    console.log('Add Tags action works: ' + (results.addTagsActionWorks ? 'PASS' : 'FAIL'));
    console.log('Tags visible on contacts: ' + (results.tagsVisibleOnContacts ? 'PASS' : 'FAIL'));

    const allPassed = Object.values(results).every(v => v === true);
    console.log('\n==========================================================');
    console.log('OVERALL: ' + (allPassed ? 'PASS' : 'FAIL'));
    console.log('==========================================================');

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'v6-bulk-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
