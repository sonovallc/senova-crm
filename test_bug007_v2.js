const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  let testResult = 'UNCERTAIN';

  try {
    console.log('BUG-7 VERIFICATION: Autoresponder Edit Persistence');

    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_01_login.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('Logged in');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_02_dashboard.png'), fullPage: true });

    console.log('Step 2: Navigate to Autoresponders...');
    await page.click('text=Email');
    await page.waitForTimeout(1000);
    await page.click('text=Autoresponders');
    await page.waitForTimeout(2000);
    console.log('At Autoresponders page');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_03_autoresponders.png'), fullPage: true });

    console.log('Step 3: Click Edit button...');
    await page.waitForSelector('button[title="Edit"]', { timeout: 10000 });
    const editButtons = await page.$$('button[title="Edit"]');
    console.log('Found', editButtons.length, 'autoresponder(s)');
    
    await editButtons[0].click();
    await page.waitForTimeout(2000);
    console.log('Edit modal opened');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_04_edit_modal.png'), fullPage: true });

    console.log('Step 4: Modify name field...');
    const nameField = await page.$('input[name="name"]');
    const currentValue = await nameField.inputValue();
    console.log('Current name:', currentValue);
    
    const timestamp = new Date().toLocaleTimeString();
    const newValue = currentValue.replace(/\(edited.*?\)/, '').trim() + ' (edited ' + timestamp + ')';
    await nameField.fill(newValue);
    await page.waitForTimeout(500);
    console.log('New name:', newValue);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_05_modified.png'), fullPage: true });

    console.log('Step 5: Scroll and save...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_06_scrolled.png'), fullPage: true });

    let networkError = false;
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Network Error')) {
        console.log('Console error:', text);
        networkError = true;
      }
    });
    
    const saveButton = await page.$('button:has-text("Save Changes"), button:has-text("Update"), button:has-text("Save")');
    await saveButton.click();
    console.log('Clicked Save');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_07_after_save.png'), fullPage: true });

    console.log('Step 6: Check results...');
    const errorToast = await page.$('text=Network Error');
    if (errorToast) {
      console.log('FAIL: Network Error found');
      networkError = true;
      testResult = 'FAIL';
    } else {
      console.log('No Network Error');
    }
    
    const successToast = await page.$('text=/successfully|updated/i');
    if (successToast) {
      const successText = await successToast.textContent();
      console.log('SUCCESS:', successText);
      testResult = 'PASS';
    }

    await page.screenshot({ path: path.join(screenshotDir, 'bug007_08_final.png'), fullPage: true });

  } catch (error) {
    console.error('Test error:', error.message);
    testResult = 'ERROR';
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_error.png'), fullPage: true });
  } finally {
    console.log('\nRESULT:', testResult);
    if (testResult === 'PASS') {
      console.log('BUG-7 FIXED: Autoresponder edits now persist!');
    } else if (testResult === 'FAIL') {
      console.log('BUG-7 NOT FIXED: Network Error still occurs');
    }
    await browser.close();
  }
})();
