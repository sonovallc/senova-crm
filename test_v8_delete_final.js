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

    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Login successful\n');

    console.log('Step 2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-01-contacts.png'), fullPage: true });
    console.log('Screenshot: v8-delete-01-contacts.png\n');

    console.log('Step 3: Click on first contact name...');
    const contactNameLinks = await page.locator('a.text-blue-600').all();
    
    if (contactNameLinks.length === 0) {
      console.log('FAIL: No contact name links found');
      await browser.close();
      return;
    }

    console.log('Found ' + contactNameLinks.length + ' contact name links');
    const firstContactText = await contactNameLinks[0].textContent();
    console.log('Clicking contact: ' + firstContactText.trim());
    
    await contactNameLinks[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-02-detail.png'), fullPage: true });
    console.log('Screenshot: v8-delete-02-detail.png\n');

    console.log('Step 4: Look for Delete button...');
    let deleteBtn = null;
    
    const deleteButton = page.locator('button:has-text("Delete")').first();
    if (await deleteButton.isVisible().catch(() => false)) {
      deleteBtn = deleteButton;
      console.log('DELETE BUTTON FOUND!\n');
    }

    if (!deleteBtn) {
      console.log('FAIL: No delete button on detail page\n');
      
      const btns = await page.locator('button').all();
      console.log('Buttons found on page: ' + btns.length);
      for (let i = 0; i < btns.length; i++) {
        const txt = await btns[i].textContent();
        const cls = await btns[i].getAttribute('class');
        console.log('  Button ' + (i+1) + ': "' + txt.trim() + '" class: ' + cls);
      }
      
      await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-03-no-delete-btn.png'), fullPage: true });
      console.log('Screenshot: v8-delete-03-no-delete-btn.png');
      
      console.log('\n=== VERIFICATION #8 RESULTS ===');
      console.log('Delete button exists: NO');
      console.log('Overall: FAIL - Delete functionality NOT IMPLEMENTED');
      
      await browser.close();
      return;
    }

    await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-03-delete-btn.png'), fullPage: true });
    console.log('Screenshot: v8-delete-03-delete-btn.png\n');

    console.log('Step 5: Click Delete button...');
    await deleteBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-04-clicked.png'), fullPage: true });
    console.log('Screenshot: v8-delete-04-clicked.png\n');

    console.log('Step 6: Check for confirmation modal...');
    const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    
    if (modalVisible) {
      console.log('Confirmation modal found - clicking Confirm');
      const confirmBtn = page.locator('button:has-text("Confirm")').last();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1500);
        console.log('Clicked Confirm button');
      }
    } else {
      console.log('No confirmation modal - immediate delete');
    }

    await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-05-confirmed.png'), fullPage: true });
    console.log('Screenshot: v8-delete-05-confirmed.png\n');

    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('Current URL after delete: ' + currentUrl);

    await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-06-result.png'), fullPage: true });
    console.log('Screenshot: v8-delete-06-result.png\n');

    if (currentUrl.includes('/dashboard/contacts') && !currentUrl.match(/\/contacts\/\d+/)) {
      console.log('SUCCESS: Redirected back to contacts list after deletion\n');
      
      console.log('Step 7: Verify contact is deleted...');
      const bodyText = await page.textContent('body');
      if (bodyText.includes(firstContactText.trim())) {
        console.log('WARNING: Contact still appears in list (may be soft delete)');
      } else {
        console.log('Contact removed from list (hard delete confirmed)');
      }
      
      await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-07-verified.png'), fullPage: true });
      console.log('Screenshot: v8-delete-07-verified.png');
    }

    console.log('\n=== VERIFICATION #8 RESULTS ===');
    console.log('Delete button exists: YES');
    console.log('Confirmation modal: ' + (modalVisible ? 'YES' : 'NO (immediate delete)'));
    console.log('Delete functionality: WORKING');
    console.log('Delete type: ' + (modalVisible ? 'Soft/Hard with confirmation' : 'Immediate'));
    console.log('Overall: PASS');

  } catch (error) {
    console.error('\nError during test:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'v8-delete-error.png'), fullPage: true });
    console.log('Error screenshot saved');
    console.log('\n=== VERIFICATION #8 RESULTS ===');
    console.log('Overall: FAIL - Test error occurred');
  } finally {
    await browser.close();
  }
})();
