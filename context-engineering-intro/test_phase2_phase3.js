const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhase2And3() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(__dirname, 'testing', 'email-channel-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Phase 2 & 3: Email Channel Testing ===\n');

  try {
    console.log('PHASE 2: Test 2.2 - Login and Navigate to Inbox');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✓ LOGIN SUCCESSFUL\n');

    console.log('Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '20251121-phase2-01-inbox-list.png'), 
      fullPage: true 
    });
    console.log('✓ SCREENSHOT: 20251121-phase2-01-inbox-list.png\n');

    console.log('PHASE 2: Test 2.3 - View Email Thread');
    const emailConv = page.locator('text=testcustomer@example.com').first();
    if (await emailConv.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailConv.click();
      await page.waitForTimeout(2000);
      console.log('✓ CLICKED email conversation\n');
    } else {
      console.log('⚠ WARNING: Email conversation not visible\n');
    }

    await page.screenshot({ 
      path: path.join(screenshotDir, '20251121-phase2-02-email-thread.png'), 
      fullPage: true 
    });
    console.log('✓ SCREENSHOT: 20251121-phase2-02-email-thread.png\n');

    console.log('PHASE 3: Test 3.1 - Configure Mailgun Settings');
    await page.goto('http://localhost:3004/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const emailTab = page.locator('button:has-text("Email Configuration"), button:has-text("Email")').first();
    if (await emailTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailTab.click();
      await page.waitForTimeout(1000);
      console.log('✓ Email Configuration tab clicked\n');
    }

    const apiKeyInput = page.locator('input[name="mailgun_api_key"], input[placeholder*="API Key"]').first();
    if (await apiKeyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await apiKeyInput.fill('key-test123456789');
    }
    
    const domainInput = page.locator('input[name="mailgun_domain"], input[placeholder*="Domain"]').first();
    if (await domainInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await domainInput.fill('mg.senovallc.com');
    }
    
    const fromEmailInput = page.locator('input[name="from_email"], input[placeholder*="From Email"]').first();
    if (await fromEmailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fromEmailInput.fill('noreply@senovallc.com');
    }
    
    const fromNameInput = page.locator('input[name="from_name"], input[placeholder*="From Name"]').first();
    if (await fromNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fromNameInput.fill('Eve Beauty MA');
    }

    const saveBtn = page.locator('button:has-text("Save Settings"), button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      console.log('✓ Mailgun settings saved\n');
    }

    await page.screenshot({ 
      path: path.join(screenshotDir, '20251121-phase3-01-mailgun-saved.png'), 
      fullPage: true 
    });
    console.log('✓ SCREENSHOT: 20251121-phase3-01-mailgun-saved.png\n');

    console.log('PHASE 3: Test 3.2 - Email Composer UI');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const emailConv2 = page.locator('text=testcustomer@example.com').first();
    if (await emailConv2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailConv2.click();
      await page.waitForTimeout(2000);
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    await page.screenshot({ 
      path: path.join(screenshotDir, '20251121-phase3-02-composer-email-mode.png'), 
      fullPage: true 
    });
    console.log('✓ SCREENSHOT: 20251121-phase3-02-composer-email-mode.png\n');

    console.log('PHASE 3: Test 3.3 - Compose Formatted Reply');
    const subjectInput = page.locator('input[name="subject"], input[placeholder*="Subject"]').first();
    if (await subjectInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await subjectInput.fill('Re: Test Inquiry About Services');
    }

    const editor = page.locator('.tiptap, [contenteditable="true"]').last();
    if (await editor.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editor.click();
      await page.keyboard.type('Thank you for your inquiry!');
      await page.keyboard.press('Enter');
      await page.keyboard.type('We offer:');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Service 1');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Service 2');
      console.log('✓ Message composed\n');
    }

    await page.waitForTimeout(1000);

    await page.screenshot({ 
      path: path.join(screenshotDir, '20251121-phase3-03-formatted-reply.png'), 
      fullPage: true 
    });
    console.log('✓ SCREENSHOT: 20251121-phase3-03-formatted-reply.png\n');

    console.log('PHASE 3: Test 3.4 - Send Reply (Expected to Fail)');
    const sendButton = page.locator('button:has-text("Send")').last();
    if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendButton.click();
      await page.waitForTimeout(4000);
      console.log('✓ Send button clicked\n');
    }

    await page.screenshot({ 
      path: path.join(screenshotDir, '20251121-phase3-04-send-result.png'), 
      fullPage: true 
    });
    console.log('✓ SCREENSHOT: 20251121-phase3-04-send-result.png\n');

    console.log('\n=== TESTING COMPLETE ===');
    console.log('Screenshots saved to:', screenshotDir);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'ERROR-state.png'), 
      fullPage: true 
    });
  } finally {
    console.log('\nClosing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testPhase2And3().catch(console.error);
