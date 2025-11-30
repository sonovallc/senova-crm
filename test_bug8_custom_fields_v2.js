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

    // 2. Navigate to contacts page
    console.log('2. Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/bug8-v2-1-contacts-list.png', fullPage: true });

    // Look for contact cards (they use card layout, not table)
    const contactCards = await page.locator('[class*="card"], .rounded-lg.border').all();
    console.log('3. Found', contactCards.length, 'contact cards');

    // Look for "Show more (X fields)" buttons which indicate custom fields
    const showMoreButtons = await page.locator('text=/Show more \\(\\d+ fields?\\)/').all();
    console.log('4. Show more fields buttons:', showMoreButtons.length);

    if (showMoreButtons.length > 0) {
      // Click the first "Show more" to expand custom fields
      console.log('5. Clicking "Show more" to expand fields...');
      await showMoreButtons[0].click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'screenshots/bug8-v2-2-fields-expanded.png', fullPage: true });

      // Count visible field labels after expansion
      const expandedLabels = await page.locator('[class*="text-"], label').allTextContents();
      console.log('6. Fields visible after expansion:', expandedLabels.length);

      // Look for custom field names
      const customFieldIndicators = ['custom', 'additional', 'field'];
      let customFieldsFound = 0;
      expandedLabels.forEach(label => {
        const lower = label.toLowerCase();
        if (customFieldIndicators.some(ind => lower.includes(ind))) {
          customFieldsFound++;
        }
      });
      console.log('7. Custom field indicators found:', customFieldsFound);
    }

    // Click on first contact name to go to detail page
    console.log('8. Clicking on first contact name...');
    const firstContactName = page.locator('text=Dolores Fay, text=Diana Bunting, text=Serpil Dinler').first();
    if (await firstContactName.count() > 0) {
      await firstContactName.click();
      await page.waitForTimeout(3000);

      console.log('9. Current URL:', page.url());
      await page.screenshot({ path: 'screenshots/bug8-v2-3-contact-detail.png', fullPage: true });

      // Look for edit button or edit link
      const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit"), [href*="edit"]').first();
      if (await editBtn.count() > 0) {
        console.log('10. Found Edit button, clicking...');
        await editBtn.click();
        await page.waitForTimeout(3000);

        console.log('11. Edit URL:', page.url());
        await page.screenshot({ path: 'screenshots/bug8-v2-4-edit-form.png', fullPage: true });

        // Look for custom fields section or additional fields
        const pageContent = await page.locator('body').textContent();
        const hasCustomSection = pageContent.toLowerCase().includes('custom') ||
                                 pageContent.toLowerCase().includes('additional fields');
        console.log('12. Has custom/additional section:', hasCustomSection);

        // Count all form inputs
        const allInputs = await page.locator('input, textarea, select').count();
        console.log('13. Total form inputs:', allInputs);

        // List all section headers
        const headers = await page.locator('h2, h3, h4').allTextContents();
        console.log('14. Form sections:');
        headers.forEach((h, i) => {
          if (h.trim()) console.log('   ', i + 1, '-', h.trim());
        });

        // Scroll to bottom to see all fields
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/bug8-v2-5-edit-form-bottom.png', fullPage: true });
      } else {
        console.log('10. No Edit button found on detail page');
      }
    } else {
      console.log('8. No contact name link found');
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'screenshots/bug8-v2-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
