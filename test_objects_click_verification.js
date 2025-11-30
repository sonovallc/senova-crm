const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3004';
const LOGIN_EMAIL = 'jwoodcapital@gmail.com';
const LOGIN_PASSWORD = 'D3n1w3n1!';

async function runClickVerification() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 200
    });

    const page = await browser.newPage();

    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const errorText = msg.text();
            consoleErrors.push(errorText);
            console.error('Console Error:', errorText);
        }
    });

    try {
        console.log('Starting Objects Click Verification...\n');

        // Login
        console.log('1. Logging in...');
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', LOGIN_EMAIL);
        await page.fill('input[type="password"]', LOGIN_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        // Navigate to Objects
        console.log('2. Navigating to Objects page...');
        await page.goto(`${BASE_URL}/dashboard/objects`);
        await page.waitForTimeout(2000);

        // Test 1: Click on Senova CRM row
        console.log('\n3. Testing click on Senova CRM object...');
        console.log('   Looking for Senova CRM in the table...');

        // Try to click on the Senova CRM row
        const senovaRow = await page.locator('tr:has-text("Senova CRM")').first();
        if (await senovaRow.isVisible()) {
            console.log('   Found Senova CRM row, clicking...');
            await senovaRow.click();
            await page.waitForTimeout(3000);

            const currentUrl = page.url();
            console.log('   Current URL after click:', currentUrl);

            if (currentUrl.includes('/dashboard/objects/')) {
                console.log('   ✅ SUCCESS: Navigated to object detail page');

                // Check for React errors
                const addressErrors = consoleErrors.filter(e =>
                    e.includes('Objects are not valid as a React child')
                );
                if (addressErrors.length === 0) {
                    console.log('   ✅ SUCCESS: No React errors with address rendering');
                } else {
                    console.log('   ❌ FAIL: React error found:', addressErrors[0]);
                }

                // Check for tabs
                console.log('\n4. Checking for tabs...');
                const tabs = ['Information', 'Contacts', 'Users', 'Websites'];
                for (const tab of tabs) {
                    const tabElement = await page.locator(`text="${tab}"`).first();
                    if (await tabElement.isVisible()) {
                        console.log(`   ✅ Tab found: ${tab}`);
                    } else {
                        console.log(`   ❌ Tab not found: ${tab}`);
                    }
                }

                // Navigate back
                await page.goto(`${BASE_URL}/dashboard/objects`);
                await page.waitForTimeout(2000);
            } else {
                console.log('   ❌ FAIL: Did not navigate to detail page');
            }
        } else {
            console.log('   ❌ FAIL: Senova CRM row not found');
        }

        // Test 2: Test Create Object button
        console.log('\n5. Testing Create Object button...');
        const createButton = await page.locator('button:has-text("Create Object")').first();

        if (await createButton.isVisible()) {
            console.log('   Create button is visible, clicking...');
            await createButton.click();
            await page.waitForTimeout(2000);

            // Check if modal or form opened
            const possibleFormSelectors = [
                'input[name="name"]',
                'input[placeholder*="Name"]',
                'input[placeholder*="Object"]',
                'form',
                '[role="dialog"]',
                '.modal',
                '[class*="modal"]'
            ];

            let formFound = false;
            for (const selector of possibleFormSelectors) {
                const element = await page.locator(selector).first();
                if (await element.isVisible().catch(() => false)) {
                    formFound = true;
                    console.log(`   ✅ SUCCESS: Form/modal opened (found: ${selector})`);

                    // Try to close it
                    const closeSelectors = [
                        'button:has-text("Cancel")',
                        'button:has-text("Close")',
                        'button[aria-label="Close"]',
                        'button:has-text("X")',
                        '[aria-label="close"]'
                    ];

                    for (const closeSelector of closeSelectors) {
                        const closeBtn = await page.locator(closeSelector).first();
                        if (await closeBtn.isVisible().catch(() => false)) {
                            await closeBtn.click();
                            console.log('   Closed the form/modal');
                            break;
                        }
                    }
                    break;
                }
            }

            if (!formFound) {
                console.log('   ❌ FAIL: Create form/modal did not open');
                console.log('   Checking page state...');

                // Check if we navigated somewhere else
                const newUrl = page.url();
                if (newUrl !== `${BASE_URL}/dashboard/objects`) {
                    console.log(`   Navigation occurred to: ${newUrl}`);
                }
            }
        } else {
            console.log('   ❌ FAIL: Create button not visible');
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Console Errors: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            consoleErrors.forEach(err => console.log(`  - ${err}`));
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
}

runClickVerification().catch(console.error);