const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testEmailTemplates() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'testing', 'email-channel-screenshots');
  if (\!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('Browser console error:', msg.text());
    }
  });

  function getTimestamp() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return y + m + d + '-' + h + min + s;
  }

  async function screenshot(name) {
    const filepath = path.join(screenshotDir, getTimestamp() + '-' + name + '.png');
    await page.screenshot({ path: filepath, fullPage: true });
    console.log('Screenshot: ' + filepath);
    return filepath;
  }

  console.log('=== Email Templates Testing ===');

  try {
    console.log('\nStep 1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123\!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('Logged in successfully');

    console.log('\nStep 2: Navigate to Email Templates...');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot('templates-page-load');

    const title = await page.locator('h1, h2').first().textContent().catch(() => 'Not found');
    console.log('Page title:', title);

    console.log('\nStep 3: Check templates list...');
    const cards = await page.locator('[class*="card"], [class*="template"]').count();
    console.log('Found', cards, 'template cards');
    await screenshot('templates-list');

    console.log('\nStep 4: Check filters/tabs...');
    const allBtn = page.locator('button:has-text("All")');
    const myBtn = page.locator('button:has-text("My")');
    const sysBtn = page.locator('button:has-text("System")');
    console.log('All tab:', await allBtn.count() > 0);
    console.log('My tab:', await myBtn.count() > 0);
    console.log('System tab:', await sysBtn.count() > 0);

    console.log('\nStep 5: Try creating template...');
    const newBtn = page.locator('button:has-text("New Template"), button:has-text("+ New")').first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(1000);
      await screenshot('templates-create-modal');
      
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Template ' + Date.now());
        
        const subjInput = page.locator('input[name="subject"], input[placeholder*="subject"]').first();
        if (await subjInput.count() > 0) {
          await subjInput.fill('Test Subject Line');
        }
        
        const bodyInput = page.locator('textarea').first();
        if (await bodyInput.count() > 0) {
          await bodyInput.fill('Test email body content.');
        }
        
        await screenshot('templates-create-filled');
        
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")').first();
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          await screenshot('templates-created');
          console.log('Template created');
        }
      }
    } else {
      console.log('New template button not found');
    }

    console.log('\nStep 6: Test validation...');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(500);
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
        await screenshot('templates-validation');
      }
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();
        await page.waitForTimeout(500);
      }
    }

    console.log('\nStep 7: Test template actions...');
    const previewBtn = page.locator('button:has-text("Preview")').first();
    if (await previewBtn.count() > 0) {
      await previewBtn.click();
      await page.waitForTimeout(1000);
      await screenshot('templates-preview');
      const closeBtn = page.locator('button:has-text("Close")').first();
      if (await closeBtn.count() > 0) await closeBtn.click();
    }

    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(1000);
      await screenshot('templates-edit');
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.count() > 0) await cancelBtn.click();
    }

    await screenshot('templates-final');

    console.log('\n=== Console Errors ===');
    if (consoleErrors.length > 0) {
      console.log('Found', consoleErrors.length, 'errors:');
      consoleErrors.forEach(e => console.log(' -', e));
    } else {
      console.log('No console errors');
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Error:', error.message);
    await screenshot('error');
  } finally {
    await browser.close();
  }
}

testEmailTemplates().catch(console.error);
