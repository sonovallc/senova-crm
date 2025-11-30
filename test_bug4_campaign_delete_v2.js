const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('response', response => {
    if (response.url().includes('campaigns') && !response.ok()) {
      console.log('API Response Error:', response.status(), response.url());
    }
  });

  page.on('requestfailed', request => {
    console.log('Request Failed:', request.url(), request.failure().errorText);
  });

  try {
    // 1. Login
    console.log('1. Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('   Login successful');

    // 2. Navigate to campaigns page
    console.log('2. Navigate to campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 90000 });
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/bug4-v2-1-campaigns-list.png', fullPage: true });

    // Look for campaign cards (they use card-based layout, not table rows)
    const campaignCards = await page.locator('[class*="card"], [class*="Campaign"], .rounded-lg.border').all();
    console.log('3. Found', campaignCards.length, 'potential campaign cards');

    // Look for the "..." menu buttons (MoreHorizontal icons)
    const menuButtons = await page.locator('button:has(svg)').filter({ hasText: '' }).all();
    console.log('4. Found', menuButtons.length, 'buttons with icons');

    // Find dropdown trigger button with MoreHorizontal (three dots)
    const moreMenus = await page.locator('[class*="DropdownMenu"], button[aria-haspopup]').all();
    console.log('5. Found', moreMenus.length, 'dropdown menus');

    // Look for any button that might be a menu trigger near campaigns
    const allButtons = await page.locator('button').all();
    console.log('6. Total buttons on page:', allButtons.length);

    // Try to find the "..." button by looking for buttons with only an SVG
    const ellipsisButtons = await page.locator('button svg[class*="lucide-ellipsis"], button svg[class*="more"]').all();
    console.log('7. Ellipsis/More buttons:', ellipsisButtons.length);

    // Look for button with title or aria-label containing "more" or "options"
    const optionButtons = await page.locator('button[title*="more" i], button[title*="option" i], button[aria-label*="more" i], button[aria-label*="option" i]').all();
    console.log('8. Option buttons:', optionButtons.length);

    // Let's try clicking the visible "..." button in the first campaign card
    // From the screenshot, we see "..." at the end of each campaign row
    const firstCampaignMenu = page.locator('button').filter({ has: page.locator('svg') }).nth(10); // Approximate position

    // Actually, let's look for any text that shows the campaign exists
    const campaignTitles = await page.locator('text=Final test').all();
    console.log('9. Campaign titles found:', campaignTitles.length);

    // Look for action menu by finding the "..." icon
    console.log('10. Looking for ... menu near first campaign...');

    // Find the parent container of the first campaign, then find its menu button
    const firstCampaign = page.locator('[class*="card"], .rounded-lg.border').first();
    const campExists = await firstCampaign.count();
    console.log('11. First campaign card exists:', campExists > 0);

    if (campExists > 0) {
      // Click on any "..." button we can find
      const dotsButton = page.locator('button').filter({ has: page.locator('svg.lucide-ellipsis, svg.lucide-more-horizontal') }).first();
      const dotsExists = await dotsButton.count();
      console.log('12. Dots button exists:', dotsExists > 0);

      if (dotsExists === 0) {
        // Try alternative - just click on a small button that might be a menu
        const smallButtons = await page.locator('button.h-8, button.h-9, button.h-10').all();
        console.log('13. Small buttons found:', smallButtons.length);

        // Let's try clicking all visible "..." instances
        const threeDotsText = await page.locator('text=...').all();
        console.log('14. "..." text elements:', threeDotsText.length);
      }

      // Take a screenshot of campaign area
      await page.screenshot({ path: 'screenshots/bug4-v2-2-looking-for-menu.png', fullPage: true });

      // Try to find and click any dropdown trigger
      const anyDropdown = page.locator('[data-radix-dropdown-menu-trigger], [role="button"][aria-haspopup="menu"]').first();
      const anyDropdownExists = await anyDropdown.count();
      console.log('15. Radix dropdown trigger found:', anyDropdownExists > 0);

      // Just try clicking the right side of the first campaign card where the menu should be
      console.log('16. Trying to click menu area...');

      // Look for MoreHorizontal button using a different approach
      const svgButtons = await page.locator('button svg').all();
      console.log('17. Buttons containing SVG:', svgButtons.length);

      // Find all buttons in the campaign section
      const campSectionButtons = await page.locator('.space-y-4 button, [class*="card"] button').all();
      console.log('18. Buttons in campaign cards:', campSectionButtons.length);

      if (campSectionButtons.length > 0) {
        // The menu button is likely one of these - try clicking each
        for (let i = 0; i < Math.min(campSectionButtons.length, 3); i++) {
          const btn = campSectionButtons[i];
          const btnText = await btn.textContent();
          console.log('   Button', i + 1, ':', btnText.substring(0, 30).trim() || '(no text - likely icon button)');
        }

        // Click the first icon-only button (likely the ... menu)
        const iconOnlyBtn = page.locator('[class*="card"] button:not(:has-text("a"))').first();
        const iconBtnExists = await iconOnlyBtn.count();
        console.log('19. Icon-only button in card:', iconBtnExists > 0);

        if (iconBtnExists > 0) {
          await iconOnlyBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/bug4-v2-3-after-menu-click.png', fullPage: true });

          // Check if dropdown appeared
          const dropdownMenu = await page.locator('[role="menu"], [data-radix-menu-content]').count();
          console.log('20. Dropdown menu appeared:', dropdownMenu > 0);

          if (dropdownMenu > 0) {
            // Look for Delete option
            const deleteOption = page.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")');
            const deleteExists = await deleteOption.count();
            console.log('21. Delete option found:', deleteExists > 0);

            if (deleteExists > 0) {
              console.log('22. Clicking Delete...');
              await deleteOption.first().click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: 'screenshots/bug4-v2-4-after-delete-click.png', fullPage: true });

              // Check for confirmation dialog or error
              const dialog = await page.locator('[role="dialog"], [role="alertdialog"]').count();
              console.log('23. Dialog appeared:', dialog > 0);

              const pageText = await page.locator('body').textContent();
              const hasError = pageText.toLowerCase().includes('error') || pageText.toLowerCase().includes('failed');
              console.log('24. Has error text:', hasError);
            }
          }
        }
      }
    }

    // Print all collected console errors
    console.log('\n=== Console Errors ===');
    if (errors.length === 0) {
      console.log('No console errors');
    } else {
      errors.forEach((e, i) => console.log((i + 1) + '.', e.substring(0, 300)));
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'screenshots/bug4-v2-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
