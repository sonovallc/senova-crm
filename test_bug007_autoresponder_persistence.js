const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots', 'bug7-verify');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful');

    console.log('Step 2: Navigate to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-autoresponders-list.png'), fullPage: true });
    console.log('Screenshot: autoresponders list');

    console.log('Step 3: Find and click on first autoresponder...');
    const editButton = await page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
    } else {
      throw new Error('No edit buttons found');
    }
    
    await page.waitForTimeout(2000);
    const editUrl = page.url();
    console.log('Editing autoresponder at: ' + editUrl);
    
    await page.screenshot({ path: path.join(screenshotDir, '02-before-edit.png'), fullPage: true });
    console.log('Screenshot: Before editing');

    console.log('Step 4: Count existing sequence steps...');
    const existingSteps = await page.locator('[class*="step"], [class*="sequence"]').count();
    console.log('Found ' + existingSteps + ' existing steps');

    console.log('Step 5: Modify autoresponder name...');
    const nameInput = await page.locator('input[name*="name"], input[placeholder*="name"], input[type="text"]').first();
    const currentName = await nameInput.inputValue();
    console.log('Current name: "' + currentName + '"');
    
    if (!currentName.includes('- Edited')) {
      await nameInput.fill(currentName + ' - Edited');
      console.log('Changed name to: "' + currentName + ' - Edited"');
    }

    console.log('Step 6: Add new sequence step...');
    const addStepButton = await page.locator('button:has-text("Add Step"), button:has-text("Add Sequence"), button:has-text("New Step")').first();
    
    if (await addStepButton.count() > 0) {
      await addStepButton.click();
      await page.waitForTimeout(1500);
      console.log('Clicked Add Step button');
    }

    console.log('Step 7: Fill in new sequence step details...');
    const delayInputs = await page.locator('input[name*="delay"], input[name*="days"]');
    const delayCount = await delayInputs.count();
    if (delayCount > 0) {
      const lastDelayInput = delayInputs.nth(delayCount - 1);
      await lastDelayInput.fill('2');
      console.log('Set delay to 2 days');
    }

    const templateSelects = await page.locator('select[name*="template"]');
    const templateCount = await templateSelects.count();
    if (templateCount > 0) {
      const lastTemplateSelect = templateSelects.nth(templateCount - 1);
      const options = await lastTemplateSelect.locator('option').count();
      if (options > 1) {
        await lastTemplateSelect.selectOption({ index: 1 });
        console.log('Selected template');
      }
    }

    await page.screenshot({ path: path.join(screenshotDir, '03-after-edits.png'), fullPage: true });
    console.log('Screenshot: After making edits');

    console.log('Step 8: Save autoresponder...');
    const saveButton = await page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(screenshotDir, '04-after-save.png'), fullPage: true });
    console.log('Screenshot: After save');

    console.log('Step 9: Navigate away to dashboard...');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(1500);

    console.log('Step 10: Navigate back to edit autoresponder...');
    await page.goto(editUrl);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '05-after-reload.png'), fullPage: true });
    console.log('Screenshot: After reload');

    console.log('Step 11: Verify edits persisted...');
    const nameAfterReload = await page.locator('input[name*="name"], input[placeholder*="name"], input[type="text"]').first().inputValue();
    const namePersisted = nameAfterReload.includes('- Edited');
    console.log('Name after reload: "' + nameAfterReload + '"');
    console.log('Name persisted: ' + namePersisted);

    const stepsAfterReload = await page.locator('[class*="step"], [class*="sequence"]').count();
    const stepAdded = stepsAfterReload > existingSteps;
    console.log('Steps before: ' + existingSteps + ', After reload: ' + stepsAfterReload);
    console.log('Step added: ' + stepAdded);

    console.log('\nVERIFICATION RESULTS');
    console.log('Name Persistence: ' + (namePersisted ? 'PASS' : 'FAIL'));
    console.log('Step Added: ' + (stepAdded ? 'PASS' : 'FAIL'));
    
    const overallPass = namePersisted && stepAdded;
    console.log('OVERALL: ' + (overallPass ? 'PASS' : 'FAIL'));

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
