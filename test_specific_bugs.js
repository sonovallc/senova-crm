const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('=== EVE CRM Specific Bugs Test ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // ===== LOGIN =====
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login', { timeout: 90000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bugs_00_login_page.png', fullPage: true });

    // Fill login form
    await page.fill('input[type="email"]', 'admin@evebeautyma.com', { timeout: 10000 });
    await page.fill('input[type="password"]', 'TestPass123!', { timeout: 10000 });
    await page.click('button[type="submit"]', { timeout: 10000 });

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bugs_01_dashboard.png', fullPage: true });
    console.log('✓ Logged in successfully\n');

    // ===== BUG-C: Template Selection =====
    console.log('Step 2: Testing BUG-C - Template Selection...');

    // Navigate to Inbox
    console.log('  Navigating to Inbox...');
    await page.click('text=Inbox', { timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bugs_02_inbox.png', fullPage: true });
    console.log('  ✓ On Inbox page');

    // Look for Compose Email button
    console.log('  Looking for Compose Email button...');
    const composeSelectors = [
      'button:has-text("Compose")',
      'button:has-text("New Email")',
      'button:has-text("Compose Email")',
      'a:has-text("Compose")',
      '[data-action="compose"]'
    ];

    let composeButton = null;
    for (const selector of composeSelectors) {
      composeButton = await page.$(selector);
      if (composeButton) {
        console.log(`  Found compose button with selector: ${selector}`);
        break;
      }
    }

    if (composeButton) {
      await composeButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/bugs_03_compose_modal.png', fullPage: true });
      console.log('  ✓ Clicked Compose Email button');

      // Look for template dropdown
      console.log('  Looking for Template dropdown...');
      const dropdownSelectors = [
        'select:has-text("Template")',
        'select[name*="template"]',
        '[placeholder*="Template"]',
        'button:has-text("Select Template")',
        '.template-select',
        '#template-select'
      ];

      let templateDropdown = null;
      for (const selector of dropdownSelectors) {
        templateDropdown = await page.$(selector);
        if (templateDropdown) {
          console.log(`  Found template dropdown with selector: ${selector}`);
          break;
        }
      }

      if (templateDropdown) {
        // Take screenshot before clicking
        await page.screenshot({ path: 'screenshots/bugs_04_before_template_click.png', fullPage: true });

        // Click the dropdown - use force to handle overlay
        await templateDropdown.click({ force: true });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/bugs_05_template_dropdown_open.png', fullPage: true });
        console.log('  ✓ Opened template dropdown');

        // Check if there are options
        const options = await page.$$('option, [role="option"], .dropdown-item');
        console.log(`  Found ${options.length} dropdown options`);

        if (options.length > 1) {
          // Try to select the first non-empty option
          const tagName = await templateDropdown.evaluate(el => el.tagName.toLowerCase());

          if (tagName === 'select') {
            const optionValues = await page.$$eval('option', opts =>
              opts.filter(o => o.value && o.value !== '').map(o => ({ value: o.value, text: o.textContent }))
            );
            console.log('  Available options:', optionValues);

            if (optionValues.length > 0) {
              await page.selectOption('select', optionValues[0].value);
              await page.waitForTimeout(2000);
              await page.screenshot({ path: 'screenshots/bugs_06_template_selected.png', fullPage: true });
              console.log(`  ✓ Selected template: ${optionValues[0].text}`);

              // Check if we got an error or if content populated
              const currentUrl = page.url();
              if (currentUrl.includes('error') || currentUrl.includes('404')) {
                console.log('  ❌ BUG CONFIRMED: Template selection navigated to error page');
              } else {
                console.log('  ✓ Template selection did not navigate to error');
              }
            }
          } else {
            // For non-select dropdowns, click the first option
            if (options[1]) {
              await options[1].click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: 'screenshots/bugs_06_template_selected.png', fullPage: true });
              console.log('  ✓ Selected a template option');
            }
          }
        } else {
          console.log('  ⚠ No template options available');
        }
      } else {
        console.log('  ⚠ Template dropdown not found');
        // Log all visible elements for debugging
        const allButtons = await page.$$eval('button, select', elements =>
          elements.map(el => ({ tag: el.tagName, text: el.textContent?.substring(0, 50), name: el.name, id: el.id }))
        );
        console.log('  Visible buttons/selects:', JSON.stringify(allButtons, null, 2));
      }
    } else {
      console.log('  ⚠ Compose Email button not found');
      const allButtons = await page.$$eval('button, a', elements =>
        elements.map(el => ({ tag: el.tagName, text: el.textContent?.substring(0, 50), href: el.href }))
      );
      console.log('  Visible buttons/links:', JSON.stringify(allButtons.slice(0, 20), null, 2));
    }
    console.log('');

    // ===== BUG-F & BUG-G: Campaign Duplicate and Delete =====
    console.log('Step 3: Testing BUG-F & BUG-G - Campaign Duplicate and Delete...');

    // Close the compose modal first (if open)
    const closeButton = await page.$('button:has-text("×")');
    if (closeButton) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to Campaigns
    console.log('  Navigating to Email > Campaigns...');
    // First click Email to expand - use force and wait
    const emailNav = await page.$('text=Email');
    if (emailNav) {
      await emailNav.click({ force: true });
      await page.waitForTimeout(1000);
      console.log('  ✓ Clicked Email menu');
    }

    // Then click Campaigns
    const campaignsNav = await page.$('text=Campaigns');
    if (campaignsNav) {
      await campaignsNav.click({ force: true });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/bugs_07_campaigns.png', fullPage: true });
      console.log('  ✓ On Campaigns page');
    } else {
      console.log('  ⚠ Campaigns link not found');
      await page.screenshot({ path: 'screenshots/bugs_07_no_campaigns.png', fullPage: true });
    }

    // Look for "..." menu button
    console.log('  Looking for campaign menu buttons...');
    const menuSelectors = [
      'button:has-text("...")',
      '[aria-label*="menu"]',
      '[data-action="menu"]',
      '.dropdown-toggle',
      'button.btn-icon',
      'button:has(svg)'
    ];

    let menuButtons = [];
    for (const selector of menuSelectors) {
      const buttons = await page.$$(selector);
      if (buttons.length > 0) {
        console.log(`  Found ${buttons.length} buttons with selector: ${selector}`);
        menuButtons = buttons;
        break;
      }
    }

    if (menuButtons.length > 0) {
      // Click the first menu button
      console.log('  Clicking first campaign menu...');
      await menuButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bugs_08_campaign_menu_open.png', fullPage: true });
      console.log('  ✓ Opened campaign menu');

      // Look for Duplicate option
      console.log('  Looking for Duplicate option...');
      const duplicateSelectors = [
        'button:has-text("Duplicate")',
        'a:has-text("Duplicate")',
        '[data-action="duplicate"]',
        '.dropdown-item:has-text("Duplicate")'
      ];

      let duplicateButton = null;
      for (const selector of duplicateSelectors) {
        duplicateButton = await page.$(selector);
        if (duplicateButton) {
          console.log(`  Found Duplicate with selector: ${selector}`);
          break;
        }
      }

      if (duplicateButton) {
        await duplicateButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/bugs_09_duplicate_result.png', fullPage: true });
        console.log('  ✓ Clicked Duplicate - screenshot taken');
      } else {
        console.log('  ⚠ Duplicate option not found in menu');
        // Log menu items
        const menuItems = await page.$$eval('button, a', elements =>
          elements.map(el => el.textContent?.trim()).filter(text => text && text.length < 50)
        );
        console.log('  Visible menu items:', menuItems.slice(0, 20));
      }

      // Re-open menu for Delete test (in case it closed)
      console.log('  Re-opening menu for Delete test...');
      if (menuButtons.length > 0) {
        await menuButtons[0].click();
        await page.waitForTimeout(2000);
      }

      // Look for Delete option
      console.log('  Looking for Delete option...');
      const deleteSelectors = [
        'button:has-text("Delete")',
        'a:has-text("Delete")',
        '[data-action="delete"]',
        '.dropdown-item:has-text("Delete")'
      ];

      let deleteButton = null;
      for (const selector of deleteSelectors) {
        deleteButton = await page.$(selector);
        if (deleteButton) {
          console.log(`  Found Delete with selector: ${selector}`);
          break;
        }
      }

      if (deleteButton) {
        await deleteButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/bugs_10_delete_result.png', fullPage: true });
        console.log('  ✓ Clicked Delete - screenshot taken (check for confirmation dialog)');
      } else {
        console.log('  ⚠ Delete option not found in menu');
      }
    } else {
      console.log('  ⚠ No campaign menu buttons found');
      console.log('  Taking screenshot of campaigns page for debugging...');
      await page.screenshot({ path: 'screenshots/bugs_07b_campaigns_debug.png', fullPage: true });
    }
    console.log('');

    // ===== BUG-B: Unread Status =====
    console.log('Step 4: Testing BUG-B - Unread Status...');

    // Navigate back to Inbox
    console.log('  Navigating back to Inbox...');
    await page.click('text=Inbox', { timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bugs_11_inbox_for_unread.png', fullPage: true });
    console.log('  ✓ On Inbox page');

    // Look for unread indicators
    console.log('  Looking for unread threads...');
    const unreadSelectors = [
      '.unread',
      '[data-unread="true"]',
      '.font-bold',
      '.thread-unread',
      'tr.unread',
      'div.unread'
    ];

    let unreadThreads = [];
    for (const selector of unreadSelectors) {
      const threads = await page.$$(selector);
      if (threads.length > 0) {
        console.log(`  Found ${threads.length} unread indicators with selector: ${selector}`);
        unreadThreads = threads;
        break;
      }
    }

    if (unreadThreads.length > 0) {
      console.log(`  Found ${unreadThreads.length} unread threads`);

      // Click the first unread thread
      await unreadThreads[0].click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/bugs_12_thread_opened.png', fullPage: true });
      console.log('  ✓ Opened unread thread');

      // Wait a bit more and check if unread status changes
      await page.waitForTimeout(3000);

      // Go back to inbox to check status
      await page.click('text=Inbox', { timeout: 10000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bugs_13_inbox_after_read.png', fullPage: true });
      console.log('  ✓ Returned to inbox - check if unread status changed');

      // Check if unread count decreased
      const unreadAfter = await page.$$(unreadSelectors[0]);
      console.log(`  Unread threads after: ${unreadAfter.length} (was ${unreadThreads.length})`);

      if (unreadAfter.length < unreadThreads.length) {
        console.log('  ✓ Unread status changed correctly');
      } else if (unreadAfter.length === unreadThreads.length) {
        console.log('  ❌ BUG CONFIRMED: Unread status did not change after reading');
      }
    } else {
      console.log('  ⚠ No unread threads found (may need to create test data)');
      // Show what threads exist
      const allThreads = await page.$$eval('tr, .thread-item, .email-item', elements =>
        elements.map(el => ({
          classes: el.className,
          text: el.textContent?.substring(0, 100)
        }))
      );
      console.log('  Available threads:', JSON.stringify(allThreads.slice(0, 5), null, 2));
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'screenshots/bugs_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
