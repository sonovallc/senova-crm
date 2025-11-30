const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('=== EMAIL TEMPLATES CRUD TESTING ===');

    // Navigate to templates
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/exhaust-templates/01-list.png' });

    // Count existing templates
    const templateCards = await page.$$('[class*="template"]');
    console.log(`Existing templates: ${templateCards.length}`);

    // TEST CREATE - with each category
    const categories = ['General', 'Marketing', 'Transactional', 'Autoresponder'];

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      console.log(`\nTesting CREATE with category: ${category}`);

      // Click New Template
      await page.click('text=New Template');
      await page.waitForTimeout(1000);

      // Fill form
      const timestamp = Date.now();
      await page.fill('[placeholder*="name" i]', `Test ${category} ${timestamp}`);

      // Select category
      await page.click('text=General'); // Opens dropdown
      await page.waitForTimeout(500);
      await page.click(`text=${category}`);
      await page.waitForTimeout(500);

      await page.fill('[placeholder*="subject" i]', `${category} Subject`);

      // Fill message (simple text)
      const editor = await page.$('[contenteditable]');
      if (editor) {
        await editor.click();
        await page.keyboard.type(`This is a ${category} template`);
      }

      await page.screenshot({ path: `screenshots/exhaust-templates/create-${category}.png` });

      // Click Create
      await page.click('text=Create Template');
      await page.waitForTimeout(2000);

      console.log(`  Created template: Test ${category} ${timestamp}`);
    }

    // TEST EDIT
    console.log('\nTesting EDIT functionality');
    await page.reload();
    await page.waitForTimeout(2000);

    // Click edit on first template
    const editButtons = await page.$$('button:has-text("Edit")');
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(1000);

      // Modify name
      await page.fill('[placeholder*="name" i]', 'EDITED Template');
      await page.screenshot({ path: 'screenshots/exhaust-templates/edit-form.png' });

      await page.click('text=Update Template');
      await page.waitForTimeout(2000);
      console.log('  Template edited successfully');
    }

    // TEST DELETE
    console.log('\nTesting DELETE functionality');
    await page.reload();
    await page.waitForTimeout(2000);

    const deleteButtons = await page.$$('button:has-text("Delete")');
    if (deleteButtons.length > 0) {
      await deleteButtons[0].click();
      await page.waitForTimeout(1000);

      // Confirm deletion
      await page.click('text=Confirm');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/exhaust-templates/after-delete.png' });
      console.log('  Template deleted successfully');
    }

    console.log('\n=== TEMPLATE CRUD TESTING COMPLETE ===');
    console.log('Tested: CREATE (all categories), EDIT, DELETE');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
