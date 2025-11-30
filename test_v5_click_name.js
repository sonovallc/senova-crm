const { chromium } = require('playwright');

(async () => {
  console.log('Testing Contact Name Click...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to Contacts
    console.log('Navigating to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);

    // Get current URL
    console.log('Current URL:', page.url());

    // Try to find contact name and check if it's clickable
    const contactNames = await page.locator('text=Kathleen Clifford').all();
    console.log('Found elements with "Kathleen Clifford":', contactNames.length);

    if (contactNames.length > 0) {
      // Get the element's tag and attributes
      const firstContact = contactNames[0];
      const tagName = await firstContact.evaluate(el => el.tagName);
      const isLink = await firstContact.evaluate(el => el.closest('a') !== null);
      const parent = await firstContact.evaluate(el => el.parentElement?.tagName);

      console.log('Element tag:', tagName);
      console.log('Is wrapped in link:', isLink);
      console.log('Parent tag:', parent);

      // Click on the name
      console.log('Clicking on contact name...');
      await firstContact.click();
      await page.waitForTimeout(3000);

      // Check if URL changed
      const newUrl = page.url();
      console.log('URL after click:', newUrl);

      if (newUrl !== 'http://localhost:3004/dashboard/contacts') {
        console.log('SUCCESS: Navigated to different page!');
        await page.screenshot({ path: 'screenshots/v5-detail-page-opened.png' });

        // Look for Edit button on this page
        const editBtn = await page.locator('button:has-text("Edit")').first();
        if (await editBtn.count() > 0) {
          console.log('FOUND: Edit button exists on detail page!');
          await page.screenshot({ path: 'screenshots/v5-edit-button-found.png' });
        } else {
          console.log('NO Edit button found on detail page');
          // List all buttons
          const btns = await page.locator('button').all();
          console.log('Buttons on page:');
          for (const btn of btns.slice(0, 15)) {
            const text = await btn.textContent();
            console.log('  -', text?.trim().substring(0, 40));
          }
        }
      } else {
        console.log('URL did not change - name is not clickable or modal opened');
        await page.screenshot({ path: 'screenshots/v5-after-name-click.png' });

        // Check if a modal opened
        const modal = await page.locator('[role="dialog"]').first();
        if (await modal.count() > 0) {
          console.log('A modal opened!');
          await page.screenshot({ path: 'screenshots/v5-modal-opened.png' });
        }
      }
    }

    // Try clicking anywhere on the contact card
    console.log('\nTrying to click on contact card...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);

    // Find the first card container
    const card = await page.locator('[class*="card"], [class*="Card"]').first();
    if (await card.count() > 0) {
      console.log('Found card element');
      await card.click();
      await page.waitForTimeout(2000);
      console.log('URL after card click:', page.url());
      await page.screenshot({ path: 'screenshots/v5-after-card-click.png' });
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'screenshots/v5-error.png' });
  } finally {
    await browser.close();
  }
})();
