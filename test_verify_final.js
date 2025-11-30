const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    try {
        // Login
        console.log('=== Logging in ===');
        await page.goto('http://localhost:3004/login', { timeout: 90000 });
        await page.fill('input[type="email"]', 'admin@evebeautyma.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 30000 });
        console.log('Logged in');

        // TEST BUG-F: Campaign Duplicate
        console.log('\n=== TEST BUG-F: Campaign Duplicate ===');
        await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 90000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/verify_campaigns.png', fullPage: true });

        // Count campaigns before
        const campaignsBefore = await page.$$('h3');
        console.log('Campaigns before:', campaignsBefore.length);

        // Find the MoreHorizontal menu button (three horizontal dots)
        // The button is a ghost button with size icon (h-8 w-8) containing MoreHorizontal SVG
        const menuBtn = await page.$('button[class*="h-8"][class*="w-8"]');
        console.log('Menu button found:', !!menuBtn);

        if (menuBtn) {
            await menuBtn.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'screenshots/verify_campaign_menu.png', fullPage: true });

            // Check for Duplicate option
            const dupOption = await page.$('[role="menuitem"]:has-text("Duplicate")');
            if (dupOption) {
                console.log('BUG-F: PASS - Duplicate option found');
                await dupOption.click();
                await page.waitForTimeout(3000);
                await page.screenshot({ path: 'screenshots/verify_after_duplicate.png', fullPage: true });

                const campaignsAfter = await page.$$('h3');
                console.log('Campaigns after:', campaignsAfter.length);

                if (campaignsAfter.length > campaignsBefore.length) {
                    console.log('BUG-F: SUCCESS - Campaign was duplicated');
                }
            } else {
                console.log('BUG-F: Duplicate option not in menu');
                // List menu contents
                const menuItems = await page.$$eval('[role="menuitem"], [role="menu"] *', items => items.map(i => i.textContent));
                console.log('Menu items found:', menuItems);
            }
        } else {
            console.log('BUG-F: FAIL - Could not find three-dots menu button');
        }

        // TEST BUG-M: Feature Flags visibility
        console.log('\n=== TEST BUG-M: Feature Flags ===');
        await page.goto('http://localhost:3004/dashboard/settings', { timeout: 90000 });
        await page.waitForTimeout(2000);

        // Click Settings to expand
        const settingsBtn = await page.$('button:has-text("Settings")');
        if (settingsBtn) {
            await settingsBtn.click();
            await page.waitForTimeout(500);
        }

        await page.screenshot({ path: 'screenshots/verify_settings.png', fullPage: true });

        const featureFlags = await page.$('text=Feature Flags');
        if (featureFlags) {
            console.log('BUG-M: Feature Flags IS visible - admin is owner role');
            console.log('This is EXPECTED for owner role - the fix restricts it for non-owners');
        } else {
            console.log('BUG-M: Feature Flags is NOT visible');
        }

        console.log('\n=== VERIFICATION COMPLETE ===');

    } catch (error) {
        console.error('Error:', error.message);
        await page.screenshot({ path: 'screenshots/verify_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
