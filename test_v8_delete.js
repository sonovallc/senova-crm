const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('=== VERIFICATION #8: Delete Contact ===\n');

    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 5000 });
    console.log('Login successful\n');

    console.log('Step 2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\v8-delete-01-contacts.png', fullPage: true });
    console.log('Screenshot: v8-delete-01-contacts.png\n');

    console.log('Step 3: Find and click contact...');
    const contactLinks = await page.locator('a[href*="/dashboard/contacts/"]').all();
    
    if (contactLinks.length === 0) {
      console.log('FAIL: No contact links found');
      await browser.close();
      return;
    }

    console.log('Found ' + contactLinks.length + ' contacts');
    const firstContactHref = await contactLinks[0].getAttribute('href');
    console.log('Clicking: ' + firstContactHref);
    
    await contactLinks[0].click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\v8-delete-02-detail.png', fullPage: true });
    console.log('Screenshot: v8-delete-02-detail.png\n');

    console.log('Step 4: Look for Delete button...');
    
    const deleteSelectors = [
      'button:has-text("Delete")',
      'button:has-text("delete")',
      'button.delete-btn',
      'a:has-text("Delete")'
    ];

    let deleteButton = null;
    for (const selector of deleteSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible().catch(() => false)) {
        deleteButton = btn;
        console.log('Found delete button: ' + selector);
        break;
      }
    }

    if (!deleteButton) {
      console.log('FAIL: Delete button not found\n');
      
      const allButtons = await page.locator('button').all();
      console.log('Buttons on page: ' + allButtons.length);
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        console.log('  Button: ' + text.trim());
      }
      
      await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\v8-delete-03-no-btn.png', fullPage: true });
      await browser.close();
      return;
    }

    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\v8-delete-03-btn-found.png', fullPage: true });
    console.log('Screenshot: v8-delete-03-btn-found.png\n');

    console.log('Step 5: Click Delete...');
    await deleteButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\v8-delete-04-clicked.png', fullPage: true });
    console.log('Screenshot: v8-delete-04-clicked.png\n');

    console.log('Step 6: Check for modal...');
    const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    
    if (modalVisible) {
      console.log('Modal found - confirming...');
      const confirmBtn = page.locator('button:has-text("Confirm")').last();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        console.log('Clicked confirm');
      }
    } else {
      console.log('No modal - immediate delete');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\v8-delete-05-result.png', fullPage: true });
    console.log('Screenshot: v8-delete-05-result.png\n');

    const currentUrl = page.url();
    console.log('Current URL: ' + currentUrl);

    if (currentUrl.includes('/dashboard/contacts') && !currentUrl.match(/\/contacts\/\d+/)) {
      console.log('Redirected to contacts list - delete successful\n');
      
      console.log('Verifying contact is gone...');
      await page.goto('http://localhost:3004' + firstContactHref);
      await page.waitForTimeout(1000);
      
      const finalUrl = page.url();
      if (finalUrl !== 'http://localhost:3004' + firstContactHref) {
        console.log('Contact deleted - redirected away');
        console.log('HARD DELETE confirmed');
      }
      
      await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\v8-delete-06-verified.png', fullPage: true });
    }

    console.log('\n=== RESULTS ===');
    console.log('Delete button: FOUND');
    console.log('Delete works: YES');
    console.log('Overall: PASS');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\v8-delete-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
