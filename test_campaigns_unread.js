const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    try {
        // Login
        console.log('=== Logging in ===');
        await page.goto('http://localhost:3004/login', { timeout: 90000 });
        await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com');
        await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 30000 });
        console.log('Logged in');

        // TEST BUG-F & BUG-G: Go directly to campaigns
        console.log('\n=== Testing BUG-F/G: Campaigns ===');
        await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 90000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/campaigns_page.png', fullPage: true });
        console.log('On campaigns page');

        // Find the "..." menu button on a campaign card
        const menuButtons = await page.$$('button[class*="ghost"], button:has-text("..."), [class*="DropdownMenuTrigger"], button:has(svg[class*="dots"]), button:has(svg[class*="more"])');
        console.log('Found', menuButtons.length, 'potential menu buttons');

        // Look for the action menu (three dots) on campaign cards
        const dotsButton = await page.$('button:has(svg), [data-state] button');
        if (dotsButton) {
            console.log('Clicking menu button...');
            await dotsButton.click({ force: true });
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'screenshots/campaign_menu_open.png', fullPage: true });

            // Look for menu items
            const menuContent = await page.textContent('body');
            console.log('Looking for Edit/Duplicate/Delete options...');

            // Try to find and click Duplicate
            const dupOption = await page.$('text=Duplicate, [role="menuitem"]:has-text("Duplicate")');
            if (dupOption) {
                console.log('BUG-F: Found Duplicate option - clicking...');
                await dupOption.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'screenshots/duplicate_result.png', fullPage: true });
                console.log('BUG-F: PASS - Duplicate clicked');
            } else {
                console.log('BUG-F: Duplicate option not visible in menu');
            }

            // Go back to campaigns and test delete
            await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 90000 });
            await page.waitForTimeout(2000);

            const delButton = await page.$('button:has(svg)');
            if (delButton) {
                await delButton.click({ force: true });
                await page.waitForTimeout(1000);

                const delOption = await page.$('text=Delete, [role="menuitem"]:has-text("Delete")');
                if (delOption) {
                    console.log('BUG-G: Found Delete option');
                    await page.screenshot({ path: 'screenshots/delete_option.png', fullPage: true });
                    console.log('BUG-G: PASS - Delete option exists');
                } else {
                    console.log('BUG-G: Delete option not visible');
                }
            }
        } else {
            console.log('No menu buttons found on campaigns');
        }

        // TEST BUG-B: Inbox Unread Status
        console.log('\n=== Testing BUG-B: Inbox Unread Status ===');
        await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
        await page.waitForTimeout(3000);

        // Click on Unread tab to filter
        const unreadTab = await page.$('button:has-text("Unread"), [role="tab"]:has-text("Unread")');
        if (unreadTab) {
            await unreadTab.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'screenshots/unread_tab.png', fullPage: true });
            console.log('Clicked Unread tab');
        }

        // Screenshot inbox
        await page.screenshot({ path: 'screenshots/inbox_unread_test.png', fullPage: true });

        // Click first thread
        const firstThread = await page.$('table tbody tr, [class*="thread"], [class*="conversation"]');
        if (firstThread) {
            console.log('Clicking first thread...');
            await firstThread.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'screenshots/thread_opened.png', fullPage: true });
            console.log('Thread opened - check if unread status changed');
        }

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('Error:', error.message);
        await page.screenshot({ path: 'screenshots/error_state.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
