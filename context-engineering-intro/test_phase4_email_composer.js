const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, '..', 'screenshots', 'phase4');
  
  console.log('Starting Phase 4 Email Composer Testing...
');

  try {
    // Step 1: Navigate to inbox page
    console.log('Step 1: Navigating to inbox page...');
    await page.goto('http://localhost:3000/dashboard/inbox', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, '01-inbox-page.png'), fullPage: true });
    console.log('✓ Screenshot saved: 01-inbox-page.png
');

    // Step 2: Find and click Compose Email button
    console.log('Step 2: Looking for Compose Email button...');
    const composeButton = await page.locator('button:has-text("Compose Email")').first();
    if (await composeButton.count() > 0) {
      console.log('✓ Found Compose Email button');
      await composeButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '02-composer-opened.png'), fullPage: true });
      console.log('✓ Screenshot saved: 02-composer-opened.png
');
    } else {
      console.log('✗ Compose Email button not found!');
      await page.screenshot({ path: path.join(screenshotDir, 'error-no-compose-button.png'), fullPage: true });
    }

    // Step 3: Test To field
    console.log('Step 3: Testing To field...');
    await page.waitForTimeout(1000);
    const toInput = await page.locator('input[placeholder*="To"], input[name="to"]').first();
    if (await toInput.count() > 0) {
      await toInput.fill('test@example.com');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      console.log('✓ Added email to To field');
    } else {
      console.log('✗ To field not found');
    }

    // Step 4: Test CC field
    console.log('Step 4: Testing CC field...');
    const ccButton = await page.locator('button:has-text("CC"), button:has-text("Cc")').first();
    if (await ccButton.count() > 0) {
      await ccButton.click();
      await page.waitForTimeout(500);
      const ccInput = await page.locator('input[placeholder*="CC"], input[name="cc"]').first();
      if (await ccInput.count() > 0) {
        await ccInput.fill('cc@example.com');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        console.log('✓ Added email to CC field');
      }
    }

    // Step 5: Test BCC field
    console.log('Step 5: Testing BCC field...');
    const bccButton = await page.locator('button:has-text("BCC"), button:has-text("Bcc")').first();
    if (await bccButton.count() > 0) {
      await bccButton.click();
      await page.waitForTimeout(500);
      const bccInput = await page.locator('input[placeholder*="BCC"], input[name="bcc"]').first();
      if (await bccInput.count() > 0) {
        await bccInput.fill('bcc@example.com');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        console.log('✓ Added email to BCC field');
      }
    }
    await page.screenshot({ path: path.join(screenshotDir, '03-all-recipients.png'), fullPage: true });
    console.log('✓ Screenshot saved: 03-all-recipients.png
');

    // Step 6: Test Subject field
    console.log('Step 6: Testing Subject field...');
    const subjectInput = await page.locator('input[placeholder*="Subject"], input[name="subject"]').first();
    if (await subjectInput.count() > 0) {
      await subjectInput.fill('Test Email from Phase 4');
      console.log('✓ Entered subject');
    }

    // Step 7: Test Body field
    console.log('Step 7: Testing body field...');
    const bodyEditor = await page.locator('[contenteditable="true"], .tiptap').first();
    if (await bodyEditor.count() > 0) {
      await bodyEditor.click();
      await page.keyboard.type('This is a test email body.');
      console.log('✓ Entered body text');
    }
    await page.screenshot({ path: path.join(screenshotDir, '04-subject-and-body.png'), fullPage: true });
    console.log('✓ Screenshot saved: 04-subject-and-body.png
');

    // Step 8: Test Send button
    console.log('Step 8: Testing Send button...');
    const sendButton = await page.locator('button:has-text("Send")').first();
    if (await sendButton.count() > 0) {
      console.log('✓ Found Send button');
      
      // Monitor network
      page.on('response', async response => {
        if (response.url().includes('send-email')) {
          console.log('API Response:', response.status());
        }
      });

      await sendButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '05-after-send.png'), fullPage: true });
      console.log('✓ Screenshot saved: 05-after-send.png
');
    }

    console.log('
=== Test Completed Successfully ===');

  } catch (error) {
    console.error('
✗ Error during testing:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error-screenshot.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
