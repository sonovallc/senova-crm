const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotDir = path.join('C:', 'Users', 'jwood', 'Documents', 'Projects', 'claude-code-agents-wizard-v2', 'screenshots', 'bug4-manual-test');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('=== BUG-4: Campaign Deletion Test ===
');

  try {
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/admin/login');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });

    await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01b-after-login.png'), fullPage: true });
    console.log('Login successful
');

    console.log('Step 2: Navigating to Campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '02-campaigns-page.png'), fullPage: true });

    console.log('Step 4: Looking for delete controls...
');
    await page.waitForTimeout(2000);

    let menuButton = await page.locator('button[aria-label*="menu"], button:has-text("⋮")').first();
    
    if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Found menu button');
      await menuButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '05-menu-opened.png'), fullPage: true });

      const deleteOption = await page.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")').first();
      if (await deleteOption.isVisible({ timeout: 2000 })) {
        console.log('Found Delete option');
        await deleteOption.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, '06-delete-clicked.png'), fullPage: true });

        const confirmButton = await page.locator('button:has-text("Confirm"), button:has-text("Yes")').last();
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('Confirming deletion');
          await page.screenshot({ path: path.join(screenshotDir, '07-confirm-dialog.png'), fullPage: true });
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }

        await page.screenshot({ path: path.join(screenshotDir, '08-after-deletion.png'), fullPage: true });

        const errorMessage = await page.locator('text=/Failed to delete/i').first();
        const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasError) {
          const errorText = await errorMessage.textContent();
          console.log('FAIL: Error appeared:', errorText);
          await page.screenshot({ path: path.join(screenshotDir, '09-FAIL.png'), fullPage: true });
          console.log('
=== TEST RESULT: FAIL ===');
          console.log('Screenshots:', screenshotDir);
        } else {
          console.log('PASS: No error message');
          await page.screenshot({ path: path.join(screenshotDir, '10-PASS.png'), fullPage: true });
          console.log('
=== TEST RESULT: PASS ===');
          console.log('Screenshots:', screenshotDir);
        }
      } else {
        console.log('No Delete option found');
        console.log('
=== TEST RESULT: INCONCLUSIVE ===');
      }
    } else {
      console.log('No menu button found, checking page...');
      await page.screenshot({ path: path.join(screenshotDir, 'page-structure.png'), fullPage: true });
      console.log('
=== TEST RESULT: INCONCLUSIVE ===');
      console.log('Screenshots:', screenshotDir);
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
    console.log('
=== TEST RESULT: ERROR ===');
    console.log('Screenshots:', screenshotDir);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();