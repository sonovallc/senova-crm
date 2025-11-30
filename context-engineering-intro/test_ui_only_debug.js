const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration - UI only, no backend required
const BASE_URL = 'http://localhost:3004';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'debug-ui-only');

// Color for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Create screenshots directory
async function ensureScreenshotsDir() {
    try {
        await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
        console.log(`${colors.cyan}📁 Screenshots directory created: ${SCREENSHOTS_DIR}${colors.reset}`);
    } catch (error) {
        console.error(`Error creating screenshots directory: ${error.message}`);
    }
}

// Take screenshot with proper naming
async function takeScreenshot(page, name) {
    try {
        const timestamp = Date.now();
        const filename = `${name}-${timestamp}.png`;
        const filepath = path.join(SCREENSHOTS_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`${colors.blue}📸 Screenshot: ${filename}${colors.reset}`);
        return filename;
    } catch (error) {
        console.error(`Error taking screenshot: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log(`${colors.magenta}${'='.repeat(80)}`);
    console.log('UI-ONLY EXHAUSTIVE DEBUG - SENOVA CRM');
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    await ensureScreenshotsDir();

    const browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Track console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('ERR_CONNECTION_REFUSED')) { // Ignore backend errors
                consoleErrors.push(text);
                console.log(`${colors.red}Console Error: ${text}${colors.reset}`);
            }
        }
    });

    const testResults = {
        totalPages: 0,
        successfulLoads: 0,
        elementsFound: 0,
        buttonsTested: 0,
        linksTested: 0,
        formsTested: 0,
        dropdownsTested: 0,
        issues: []
    };

    console.log(`\n${colors.cyan}TESTING PUBLIC PAGES${colors.reset}\n`);

    // Test public pages
    const publicPages = [
        '/',
        '/about',
        '/features',
        '/pricing',
        '/contact',
        '/login',
        '/register',
        '/industries/medical-spas',
        '/industries/dermatology',
        '/industries/plastic-surgery',
        '/industries/restaurants',
        '/industries/home-services',
        '/industries/retail',
        '/industries/professional-services'
    ];

    for (const path of publicPages) {
        console.log(`\n${colors.yellow}Testing: ${path}${colors.reset}`);
        testResults.totalPages++;

        try {
            await page.goto(`${BASE_URL}${path}`, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });

            testResults.successfulLoads++;
            console.log(`✅ Page loaded`);

            // Take screenshot
            await takeScreenshot(page, `page${path.replace(/\//g, '-')}`);

            // Count all interactive elements
            const buttons = await page.locator('button:visible').count();
            const links = await page.locator('a:visible').count();
            const inputs = await page.locator('input:visible').count();
            const selects = await page.locator('select:visible').count();
            const textareas = await page.locator('textarea:visible').count();

            console.log(`  📊 Found: ${buttons} buttons, ${links} links, ${inputs} inputs`);

            testResults.elementsFound += buttons + links + inputs + selects + textareas;

            // Test navigation dropdowns
            const dropdownButtons = await page.locator('button:has-text("Platform"), button:has-text("Solutions"), button:has-text("Industries")').all();

            for (const dropdown of dropdownButtons) {
                try {
                    const text = await dropdown.textContent();
                    await dropdown.click({ timeout: 2000 });
                    console.log(`  ✅ Clicked dropdown: ${text?.trim()}`);
                    await page.waitForTimeout(500);

                    // Check if dropdown opened
                    const dropdownMenu = page.locator('[role="menu"]:visible, .dropdown-menu:visible');
                    if (await dropdownMenu.count() > 0) {
                        const items = await dropdownMenu.locator('a, button').count();
                        console.log(`    📋 Dropdown has ${items} items`);
                        await takeScreenshot(page, `dropdown-${text?.toLowerCase()}-open`);

                        // Close dropdown
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(300);
                    }
                    testResults.dropdownsTested++;
                } catch (error) {
                    console.log(`  ⚠️ Could not test dropdown: ${error.message}`);
                }
            }

            // Test mobile menu if visible
            try {
                const mobileMenuBtn = page.locator('#mobile-menu-button').first();
                if (await mobileMenuBtn.isVisible({ timeout: 1000 })) {
                    await mobileMenuBtn.click();
                    console.log(`  📱 Opened mobile menu`);
                    await page.waitForTimeout(500);
                    await takeScreenshot(page, `mobile-menu${path.replace(/\//g, '-')}`);

                    // Close mobile menu
                    await mobileMenuBtn.click();
                    await page.waitForTimeout(300);
                }
            } catch (error) {
                // Mobile menu might not be visible on desktop
            }

            // Test forms on specific pages
            if (path === '/login' || path === '/register' || path === '/contact') {
                const forms = await page.locator('form:visible').count();
                if (forms > 0) {
                    console.log(`  📝 Found ${forms} form(s)`);
                    testResults.formsTested += forms;

                    // Test form validation
                    const submitBtn = page.locator('button[type="submit"]:visible').first();
                    if (await submitBtn.isVisible()) {
                        await submitBtn.click();
                        await page.waitForTimeout(1000);

                        // Check for validation messages
                        const validationMsgs = await page.locator('.error, .invalid-feedback, [role="alert"]').count();
                        if (validationMsgs > 0) {
                            console.log(`    ✅ Form validation working (${validationMsgs} messages)`);
                            await takeScreenshot(page, `form-validation${path.replace(/\//g, '-')}`);
                        }
                    }
                }
            }

            // Check page title and meta
            const title = await page.title();
            console.log(`  📄 Page title: "${title}"`);

            // Check for critical elements
            const hasHeader = await page.locator('header, nav').count() > 0;
            const hasFooter = await page.locator('footer').count() > 0;
            const hasContent = await page.locator('main, .content, #content').count() > 0;

            if (!hasHeader) testResults.issues.push(`${path}: Missing header/nav`);
            if (!hasFooter) testResults.issues.push(`${path}: Missing footer`);
            if (!hasContent) testResults.issues.push(`${path}: Missing main content area`);

            console.log(`  ✓ Header: ${hasHeader ? 'Yes' : 'No'}, Footer: ${hasFooter ? 'Yes' : 'No'}, Content: ${hasContent ? 'Yes' : 'No'}`);

        } catch (error) {
            console.log(`${colors.red}❌ Error loading page: ${error.message}${colors.reset}`);
            testResults.issues.push(`${path}: Failed to load - ${error.message}`);
            await takeScreenshot(page, `error${path.replace(/\//g, '-')}`);
        }
    }

    // Test login flow (UI only)
    console.log(`\n${colors.cyan}TESTING LOGIN UI FLOW${colors.reset}\n`);

    try {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Fill form with test data
        await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
        await page.fill('input[type="password"], input[name="password"]', 'TestPassword123!');
        await takeScreenshot(page, 'login-form-filled');

        // Try to submit (will fail without backend but tests UI)
        const loginBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
        if (await loginBtn.isVisible()) {
            await loginBtn.click();
            console.log(`✅ Login button clickable`);
            await page.waitForTimeout(2000);

            // Check for any error messages or loading states
            const hasLoader = await page.locator('.loader, .spinner, [role="progressbar"]').count() > 0;
            const hasError = await page.locator('.error, .alert, [role="alert"]').count() > 0;

            console.log(`  Loading indicator: ${hasLoader ? 'Yes' : 'No'}`);
            console.log(`  Error messages: ${hasError ? 'Yes' : 'No'}`);

            await takeScreenshot(page, 'login-after-submit');
        }
    } catch (error) {
        console.log(`⚠️ Could not test login UI: ${error.message}`);
    }

    // Generate summary report
    console.log(`\n${colors.magenta}${'='.repeat(80)}`);
    console.log('TEST SUMMARY');
    console.log(`${'='.repeat(80)}${colors.reset}\n`);

    const successRate = Math.round((testResults.successfulLoads / testResults.totalPages) * 100);

    console.log(`📊 Pages Tested: ${testResults.totalPages}`);
    console.log(`✅ Successful Loads: ${testResults.successfulLoads} (${successRate}%)`);
    console.log(`🔘 Total Elements Found: ${testResults.elementsFound}`);
    console.log(`🔽 Dropdowns Tested: ${testResults.dropdownsTested}`);
    console.log(`📝 Forms Tested: ${testResults.formsTested}`);
    console.log(`⚠️ Console Errors: ${consoleErrors.length}`);
    console.log(`❌ Issues Found: ${testResults.issues.length}`);

    if (testResults.issues.length > 0) {
        console.log(`\n${colors.yellow}Issues:${colors.reset}`);
        testResults.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    if (consoleErrors.length > 0) {
        console.log(`\n${colors.yellow}Console Errors:${colors.reset}`);
        consoleErrors.slice(0, 5).forEach(error => console.log(`  - ${error.substring(0, 100)}...`));
    }

    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        environment: BASE_URL,
        summary: {
            totalPages: testResults.totalPages,
            successfulLoads: testResults.successfulLoads,
            successRate: successRate + '%',
            elementsFound: testResults.elementsFound,
            dropdownsTested: testResults.dropdownsTested,
            formsTested: testResults.formsTested
        },
        issues: testResults.issues,
        consoleErrors: consoleErrors,
        screenshotsLocation: SCREENSHOTS_DIR
    };

    const reportPath = path.join(__dirname, 'debug-ui-only-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n${colors.green}📄 Detailed report saved to: ${reportPath}${colors.reset}`);

    await browser.close();

    console.log(`\n${colors.green}✅ UI Debug Session Complete${colors.reset}\n`);

    // Exit with appropriate code
    process.exit(successRate >= 80 ? 0 : 1);
}

main().catch(console.error);