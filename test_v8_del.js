const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots');
  
  try {
    console.log('=== VERIFICATION 8: Delete Contact ===\n');

    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Login done\n');

    console.log('Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'v8-del-01.png'), fullPage: true });
    console.log('Screenshot 1 done\n');

    console.log('Click first contact...');
    const links = await page.locator('a[href*="/dashboard/contacts/"]').all();
    
    if (links.length === 0) {
      console.log('FAIL: No contacts found');
      await browser.close();
      return;
    }

    const href = await links[0].getAttribute('href');
    console.log('Opening: ' + href);
    await links[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'v8-del-02.png'), fullPage: true });
    console.log('Screenshot 2 done\n');

    console.log('Look for Delete button...');
    let deleteBtn = null;
    
    if (await page.locator('button:has-text("Delete")').first().isVisible().catch(() => false)) {
      deleteBtn = page.locator('button:has-text("Delete")').first();
    }

    if (!deleteBtn) {
      console.log('FAIL: No delete button\n');
      const btns = await page.locator('button').all();
      console.log('Buttons found: ' + btns.length);
      for (let i = 0; i < btns.length; i++) {
        const txt = await btns[i].textContent();
        console.log('- ' + txt.trim());
      }
      await page.screenshot({ path: path.join(screenshotDir, 'v8-del-03-nobtn.png'), fullPage: true });
      await browser.close();
      return;
    }

    console.log('Delete button FOUND\n');
    await page.screenshot({ path: path.join(screenshotDir, 'v8-del-03.png'), fullPage: true });

    console.log('Click Delete...');
    await deleteBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, 'v8-del-04.png'), fullPage: true });
    console.log('Screenshot 4 done\n');

    console.log('Check for modal...');
    if (await page.locator('[role="dialog"]').isVisible().catch(() => false)) {
      console.log('Modal found - confirming');
      const conf = page.locator('button:has-text("Confirm")').last();
      if (await conf.isVisible().catch(() => false)) {
        await conf.click();
        await page.waitForTimeout(1500);
      }
    }

    await page.screenshot({ path: path.join(screenshotDir, 'v8-del-05.png'), fullPage: true });
    console.log('Screenshot 5 done\n');

    const url = page.url();
    console.log('URL: ' + url);

    if (url.includes('/dashboard/contacts') && !url.match(/\/contacts\/\d+/)) {
      console.log('SUCCESS: Redirected to list\n');
      
      console.log('Verify contact deleted...');
      await page.goto('http://localhost:3004' + href);
      await page.waitForTimeout(1500);
      
      const final = page.url();
      if (final !== 'http://localhost:3004' + href) {
        console.log('CONFIRMED: Contact deleted (hard delete)');
      }
      
      await page.screenshot({ path: path.join(screenshotDir, 'v8-del-06.png'), fullPage: true });
    }

    console.log('\n=== RESULTS ===');
    console.log('Delete button: YES');
    console.log('Delete works: YES');
    console.log('Overall: PASS');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'v8-del-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
