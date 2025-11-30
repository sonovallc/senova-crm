const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhase4EmailComposer() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), '..', 'screenshots', 'phase4');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Phase 4 Email Composer Testing ===');
  console.log('');

  try {
    console.log('Step 1: Navigating to inbox page...');
    await page.goto('http://localhost:3000/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '01-inbox-page.png'), fullPage: true });
    console.log('Screenshot: 01-inbox-page.png');
    console.log('');

    console.log('Step 2: Finding Compose Email button...');
    const composeBtn = page.locator('button:has-text("Compose Email")').first();
    const btnCount = await composeBtn.count();
    console.log('Found Compose Email buttons:', btnCount);
    
    if (btnCount === 0) {
      console.log('ERROR: Compose Email button not found!');
      await page.screenshot({ path: path.join(screenshotDir, 'ERROR-no-button.png'), fullPage: true });
      return;
    }

    await composeBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '02-composer-opened.png'), fullPage: true });
    console.log('Screenshot: 02-composer-opened.png');
    console.log('');

    console.log('Step 3: Filling To field...');
    const toInput = page.locator('input[name="to"], input[placeholder*="To"]').first();
    if (await toInput.count() > 0) {
      await toInput.fill('test@example.com');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      console.log('Added: test@example.com');
    } else {
      console.log('WARNING: To field not found');
    }
    console.log('');

    console.log('Step 4: Filling Subject field...');
    const subjectInput = page.locator('input[name="subject"], input[placeholder*="Subject"]').first();
    if (await subjectInput.count() > 0) {
      await subjectInput.fill('Test Email from Phase 4');
      console.log('Subject entered');
    } else {
      console.log('WARNING: Subject field not found');
    }
    console.log('');

    console.log('Step 5: Filling Body field...');
    const bodyEditor = page.locator('[contenteditable="true"], .tiptap').first();
    if (await bodyEditor.count() > 0) {
      await bodyEditor.click();
      await page.keyboard.type('This is a test email body with some content.');
      console.log('Body text entered');
    } else {
      console.log('WARNING: Body editor not found');
    }
    await page.screenshot({ path: path.join(screenshotDir, '03-form-filled.png'), fullPage: true });
    console.log('Screenshot: 03-form-filled.png');
    console.log('');

    console.log('Step 6: Testing Send button...');
    const sendBtn = page.locator('button:has-text("Send")').first();
    if (await sendBtn.count() > 0) {
      console.log('Found Send button');
      await sendBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '04-after-send.png'), fullPage: true });
      console.log('Screenshot: 04-after-send.png');
    } else {
      console.log('WARNING: Send button not found');
    }
    console.log('');

    await page.screenshot({ path: path.join(screenshotDir, '05-final-state.png'), fullPage: true });
    console.log('Screenshot: 05-final-state.png');
    console.log('');
    console.log('=== Test Completed Successfully ===');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR-screenshot.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testPhase4EmailComposer().catch(console.error);
