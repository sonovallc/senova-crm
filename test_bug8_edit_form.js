const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('1. Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('   Login successful');

    // 2. Navigate directly to contacts page
    console.log('2. Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // 3. Look for any clickable contact link/button
    console.log('3. Looking for contact links...');

    // Find all links that might be contact names
    const allLinks = await page.locator('a').all();
    console.log('   Total links on page:', allLinks.length);

    // Look for links containing contact-related paths
    const contactLinks = await page.locator('a[href*="/contacts/"]').all();
    console.log('   Contact detail links found:', contactLinks.length);

    await page.screenshot({ path: 'screenshots/bug8-edit-1-contacts-page.png', fullPage: true });

    if (contactLinks.length > 0) {
      // Get the href of the first contact link
      const href = await contactLinks[0].getAttribute('href');
      console.log('4. First contact link href:', href);

      // Navigate to that contact's detail/edit page
      await contactLinks[0].click();
      await page.waitForTimeout(3000);

      console.log('5. Current URL after click:', page.url());
      await page.screenshot({ path: 'screenshots/bug8-edit-2-contact-detail.png', fullPage: true });

      // Now look for Edit button
      const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      if (await editBtn.count() > 0) {
        console.log('6. Found Edit button, clicking...');
        await editBtn.click();
        await page.waitForTimeout(3000);

        console.log('7. Edit URL:', page.url());
        await page.screenshot({ path: 'screenshots/bug8-edit-3-edit-form.png', fullPage: true });

        // Check form sections
        const headers = await page.locator('h2, h3, h4, h5').allTextContents();
        console.log('8. Form section headers:');
        headers.forEach((h, i) => {
          if (h.trim()) console.log('   ', i + 1, '-', h.trim());
        });

        // Check for custom fields section
        const pageText = await page.locator('body').textContent();
        const hasCustom = pageText.toLowerCase().includes('custom');
        const hasAdditional = pageText.toLowerCase().includes('additional');
        console.log('9. Has "custom" text:', hasCustom);
        console.log('10. Has "additional" text:', hasAdditional);

        // Count all form fields
        const inputs = await page.locator('input:visible').count();
        const textareas = await page.locator('textarea:visible').count();
        const selects = await page.locator('select:visible, [role="combobox"]').count();
        console.log('11. Visible inputs:', inputs);
        console.log('12. Visible textareas:', textareas);
        console.log('13. Visible selects/comboboxes:', selects);
        console.log('14. Total visible form elements:', inputs + textareas + selects);

        // Scroll to bottom and screenshot
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/bug8-edit-4-form-bottom.png', fullPage: true });

        // Look for any field labels
        console.log('15. Looking for field labels...');
        const labels = await page.locator('label').allTextContents();
        console.log('    Found', labels.length, 'labels');

        // Print first 20 labels
        console.log('16. First 20 field labels:');
        labels.slice(0, 20).forEach((l, i) => {
          if (l.trim()) console.log('   ', i + 1, '-', l.trim().substring(0, 50));
        });

      } else {
        console.log('6. No Edit button found on detail page');

        // Check if we're already on an edit form
        const formInputs = await page.locator('input, textarea').count();
        console.log('   Form inputs on this page:', formInputs);
      }
    } else {
      console.log('4. No contact detail links found');

      // Try clicking on a contact card directly
      const cards = await page.locator('.rounded-lg.border, [class*="card"]').all();
      console.log('   Found', cards.length, 'card elements');

      if (cards.length > 0) {
        // Click the first card that might be a contact
        await cards[0].click();
        await page.waitForTimeout(3000);
        console.log('5. URL after card click:', page.url());
        await page.screenshot({ path: 'screenshots/bug8-edit-2-after-card-click.png', fullPage: true });
      }
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'screenshots/bug8-edit-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
