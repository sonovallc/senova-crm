const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots', 'bug7-verify-v2');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('=== BUG-7: Autoresponder Edit Persistence Test ===\n');
    
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-login.png'), fullPage: true });
    console.log('OK Login');

    console.log('\nStep 2: Navigate to autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '02-list.png'), fullPage: true });

    const rowCount = await page.locator('tbody tr').count();
    console.log('Found ' + rowCount + ' autoresponder(s)');

    console.log('\nStep 3: Find Edit button...');
    let editBtn = page.locator('[data-testid^="autoresponder-edit-"]').first();
    if (await editBtn.count() === 0) {
      console.log('Using fallback selector...');
      editBtn = page.locator('tbody tr:first-child td:last-child button').nth(1);
    }

    await page.screenshot({ path: path.join(screenshotDir, '03-before-edit.png'), fullPage: true });
    
    console.log('\nStep 4: Click Edit button...');
    await editBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '04-edit-form.png'), fullPage: true });

    console.log('\nStep 5: Make edits...');
    const nameInput = page.locator('input[name="name"]');
    const origName = await nameInput.inputValue();
    console.log('Original name: ' + origName);
    
    const newName = origName + ' EDITED';
    await nameInput.fill(newName);
    console.log('New name: ' + newName);
    
    await page.screenshot({ path: path.join(screenshotDir, '05-edited.png'), fullPage: true });

    console.log('\nStep 6: Save changes...');
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")').first();
    await saveBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '06-saved.png'), fullPage: true });

    console.log('\nStep 7: Back to list...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '07-list-after.png'), fullPage: true });

    console.log('\nStep 8: Open edit form again...');
    editBtn = page.locator('[data-testid^="autoresponder-edit-"]').first();
    if (await editBtn.count() === 0) {
      editBtn = page.locator('tbody tr:first-child td:last-child button').nth(1);
    }
    await editBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '08-reopen.png'), fullPage: true });

    console.log('\nStep 9: Verify persistence...');
    const persistedName = await page.locator('input[name="name"]').inputValue();
    console.log('Persisted name: ' + persistedName);
    
    const passed = persistedName === newName;
    
    await page.screenshot({ path: path.join(screenshotDir, '09-final.png'), fullPage: true });

    console.log('\n=== RESULT ===');
    console.log('Original: ' + origName);
    console.log('Expected: ' + newName);
    console.log('Got: ' + persistedName);
    console.log(passed ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('ERROR: ' + error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
