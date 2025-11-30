const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n=== BUG 6 VERIFICATION TEST ===\n');

  const results = {
    test1: 'NOT TESTED',
    test2: 'NOT TESTED',
    test3: 'NOT TESTED'
  };

  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful\n');

    // TEST 1: EDIT TEMPLATE
    console.log('TEST 1: Edit Template');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug006_01_templates.png', fullPage: true });

    const editBtn = await page.locator('button:has(svg.lucide-pencil)').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/bug006_02_edit_modal.png', fullPage: true });

      const editor = await page.locator('.ProseMirror, [contenteditable="true"]').first();
      const text = await editor.textContent();
      
      if (text && text.trim().length > 0) {
        console.log('PASS: Template body populated');
        results.test1 = 'PASS';
      } else {
        console.log('FAIL: Template body EMPTY');
        results.test1 = 'FAIL';
      }

      const closeBtn = await page.locator('button:has-text("Cancel")').first();
      if (await closeBtn.count() > 0) await closeBtn.click();
    } else {
      console.log('FAIL: No edit button');
      results.test1 = 'FAIL';
    }

    // TEST 2: COMPOSE TEMPLATE
    console.log('\nTEST 2: Compose Template');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug006_03_compose.png', fullPage: true });

    const templateBtn = await page.locator('button:has-text("Template")').first();
    if (await templateBtn.count() > 0) {
      await templateBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/bug006_04_dropdown.png', fullPage: true });

      const firstTemplate = await page.locator('[role="option"]').first();
      if (await firstTemplate.count() > 0) {
        await firstTemplate.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/bug006_05_selected.png', fullPage: true });

        const editor = await page.locator('.ProseMirror').first();
        const text = await editor.textContent();
        
        if (text && text.trim().length > 0) {
          console.log('PASS: Compose body populated');
          results.test2 = 'PASS';
        } else {
          console.log('FAIL: Compose body EMPTY');
          results.test2 = 'FAIL';
        }
      }
    } else {
      console.log('FAIL: No template selector');
      results.test2 = 'FAIL';
    }

    // TEST 3: CAMPAIGN TEMPLATE
    console.log('\nTEST 3: Campaign Template');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug006_06_campaigns.png', fullPage: true });

    const createBtn = await page.locator('button:has-text("Create Campaign")').first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForURL('**/campaigns/create**', { timeout: 10000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug006_07_create.png', fullPage: true });

      const campaignTemplateBtn = await page.locator('button:has-text("Template")').first();
      if (await campaignTemplateBtn.count() > 0) {
        await campaignTemplateBtn.click();
        await page.waitForTimeout(1000);

        const firstTemplate = await page.locator('[role="option"]').first();
        if (await firstTemplate.count() > 0) {
          await firstTemplate.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'screenshots/bug006_08_campaign_selected.png', fullPage: true });

          const editor = await page.locator('.ProseMirror').first();
          const text = await editor.textContent();
          
          if (text && text.trim().length > 0) {
            console.log('PASS: Campaign body populated');
            results.test3 = 'PASS';
          } else {
            console.log('FAIL: Campaign body EMPTY');
            results.test3 = 'FAIL';
          }
        }
      }
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
  }

  console.log('\n=== FINAL REPORT ===');
  console.log('Test 1 (Edit):', results.test1);
  console.log('Test 2 (Compose):', results.test2);
  console.log('Test 3 (Campaign):', results.test3);

  const passCount = Object.values(results).filter(r => r === 'PASS').length;
  console.log('\nPass Rate:', passCount + '/3');

  if (passCount === 3) {
    console.log('\nBUG #6: FIXED');
  } else {
    console.log('\nBUG #6: NOT FIXED');
  }

  await browser.close();
})();
