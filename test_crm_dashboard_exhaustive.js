const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function exhaustiveCRMDebug() {
    console.log('=================================');
    console.log('SENOVA CRM DASHBOARD - EXHAUSTIVE DEBUG SESSION');
    console.log('Start Time:', new Date().toISOString());
    console.log('=================================\n');

    const browser = await chromium.launch({
        headless: false,
        args: ['--window-size=1920,1080']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('🔴 Console Error:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('🔴 Page Error:', error.message);
    });

    const results = {
        timestamp: new Date().toISOString(),
        totalTests: 0,
        passed: 0,
        failed: 0,
        errors: [],
        modules: {}
    };

    const screenshotDir = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\crm-dashboard-debug';

    // Ensure screenshot directory exists
    try {
        await fs.mkdir(screenshotDir, { recursive: true });
        console.log('✅ Screenshot directory ready:', screenshotDir);
    } catch (error) {
        console.log('📁 Screenshot directory already exists');
    }

    async function takeScreenshot(name) {
        const filename = `${name}_${Date.now()}.png`;
        const filepath = path.join(screenshotDir, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`📸 Screenshot saved: ${filename}`);
        return filename;
    }

    async function testPage(moduleName, pageName, url, tests) {
        console.log(`\n📍 Testing: ${moduleName} - ${pageName}`);
        console.log(`   URL: ${url}`);

        if (!results.modules[moduleName]) {
            results.modules[moduleName] = { pages: {} };
        }

        const pageResult = {
            url: url,
            status: 'testing',
            screenshots: [],
            elements: {},
            errors: []
        };

        try {
            // Navigate to page
            const response = await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            if (!response) {
                pageResult.status = 'navigation_failed';
                pageResult.errors.push('Failed to navigate to page');
                results.failed++;
                console.log('   ❌ Navigation failed');
            } else if (response.status() >= 400) {
                pageResult.status = `error_${response.status()}`;
                pageResult.errors.push(`HTTP ${response.status()} error`);
                results.failed++;
                console.log(`   ❌ HTTP Error: ${response.status()}`);

                // Take error screenshot
                const screenshot = await takeScreenshot(`${moduleName}_${pageName}_error`);
                pageResult.screenshots.push(screenshot);
            } else {
                pageResult.status = 'loaded';
                console.log('   ✅ Page loaded successfully');

                // Take initial screenshot
                const screenshot = await takeScreenshot(`${moduleName}_${pageName}_loaded`);
                pageResult.screenshots.push(screenshot);

                // Run custom tests for this page
                if (tests && typeof tests === 'function') {
                    await tests(pageResult);
                }

                results.passed++;
            }
        } catch (error) {
            pageResult.status = 'error';
            pageResult.errors.push(error.message);
            results.failed++;
            console.log(`   ❌ Error: ${error.message}`);
        }

        results.modules[moduleName].pages[pageName] = pageResult;
        results.totalTests++;
    }

    // ============= START TESTING =============

    console.log('\n🔐 PHASE 1: AUTHENTICATION');
    console.log('=========================');

    // Test Login Page
    await testPage('Authentication', 'Login', 'http://localhost:3004/login', async (result) => {
        try {
            // Check for form elements
            const emailField = await page.$('input[type="email"], input[name="email"], input#email');
            const passwordField = await page.$('input[type="password"], input[name="password"], input#password');
            const submitButton = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

            result.elements.emailField = emailField ? 'found' : 'missing';
            result.elements.passwordField = passwordField ? 'found' : 'missing';
            result.elements.submitButton = submitButton ? 'found' : 'missing';

            console.log(`   📋 Email field: ${result.elements.emailField}`);
            console.log(`   📋 Password field: ${result.elements.passwordField}`);
            console.log(`   📋 Submit button: ${result.elements.submitButton}`);

            if (emailField && passwordField && submitButton) {
                // Perform login
                console.log('   🔑 Attempting login...');
                await emailField.fill('jwoodcapital@gmail.com');
                await passwordField.fill('D3n1w3n1!');

                const screenshot1 = await takeScreenshot('auth_login_form_filled');
                result.screenshots.push(screenshot1);

                await submitButton.click();
                await page.waitForTimeout(3000);

                // Check if we're on dashboard
                const currentUrl = page.url();
                if (currentUrl.includes('/dashboard')) {
                    console.log('   ✅ Login successful - redirected to dashboard');
                    result.loginSuccess = true;

                    const screenshot2 = await takeScreenshot('auth_login_success_dashboard');
                    result.screenshots.push(screenshot2);
                } else {
                    console.log('   ❌ Login failed - still on:', currentUrl);
                    result.loginSuccess = false;
                    result.errors.push('Login did not redirect to dashboard');

                    const screenshot3 = await takeScreenshot('auth_login_failed');
                    result.screenshots.push(screenshot3);
                }
            }
        } catch (error) {
            console.log(`   ❌ Login test error: ${error.message}`);
            result.errors.push(`Login test error: ${error.message}`);
        }
    });

    // Continue with dashboard testing if login was successful
    const loginResult = results.modules['Authentication']?.pages['Login'];
    if (!loginResult?.loginSuccess) {
        console.log('\n❌ CRITICAL: Cannot proceed without successful login');
        console.log('Attempting direct navigation to dashboard...');

        // Try direct navigation
        await page.goto('http://localhost:3004/dashboard', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        if (!page.url().includes('/dashboard')) {
            console.log('❌ Direct navigation failed - authentication required');
            results.errors.push('Critical: Unable to access dashboard - authentication failed');

            await browser.close();

            // Save results
            const reportPath = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\DEBUG_CRM_DASHBOARD_RESULTS.json';
            await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
            console.log(`\n📊 Results saved to: ${reportPath}`);
            return results;
        }
    }

    console.log('\n📊 PHASE 2: DASHBOARD MODULE');
    console.log('============================');

    // Test Main Dashboard
    await testPage('Dashboard', 'Main', 'http://localhost:3004/dashboard', async (result) => {
        try {
            console.log('   🔍 Analyzing dashboard elements...');

            // Check sidebar navigation
            const sidebarLinks = await page.$$('nav a, [role="navigation"] a, .sidebar a');
            result.elements.sidebarLinks = sidebarLinks.length;
            console.log(`   📋 Sidebar links found: ${sidebarLinks.length}`);

            // Check for main content areas
            const cards = await page.$$('.card, [class*="card"], [class*="Card"]');
            result.elements.cards = cards.length;
            console.log(`   📋 Dashboard cards found: ${cards.length}`);

            // Check for stats/metrics
            const stats = await page.$$('[class*="stat"], [class*="metric"], [class*="number"]');
            result.elements.stats = stats.length;
            console.log(`   📋 Stats/metrics found: ${stats.length}`);

            // Test sidebar links
            for (let i = 0; i < Math.min(sidebarLinks.length, 5); i++) {
                const link = sidebarLinks[i];
                const text = await link.textContent();
                console.log(`   🔗 Testing sidebar link: ${text}`);

                await link.click();
                await page.waitForTimeout(1000);

                const screenshot = await takeScreenshot(`dashboard_sidebar_${text.toLowerCase().replace(/\s+/g, '_')}`);
                result.screenshots.push(screenshot);
            }
        } catch (error) {
            console.log(`   ❌ Dashboard test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    console.log('\n👥 PHASE 3: CONTACTS MODULE');
    console.log('===========================');

    // Test Contacts List
    await testPage('Contacts', 'List', 'http://localhost:3004/dashboard/contacts', async (result) => {
        try {
            await page.waitForTimeout(2000);

            // Check for contacts table/list
            const contactRows = await page.$$('table tr, [role="row"], .contact-item');
            result.elements.contactRows = contactRows.length;
            console.log(`   📋 Contact rows found: ${contactRows.length}`);

            // Check for action buttons
            const newContactBtn = await page.$('button:has-text("New Contact"), button:has-text("Add Contact"), button:has-text("Create Contact")');
            const importBtn = await page.$('button:has-text("Import")');
            const exportBtn = await page.$('button:has-text("Export")');

            result.elements.newContactBtn = newContactBtn ? 'found' : 'missing';
            result.elements.importBtn = importBtn ? 'found' : 'missing';
            result.elements.exportBtn = exportBtn ? 'found' : 'missing';

            console.log(`   📋 New Contact button: ${result.elements.newContactBtn}`);
            console.log(`   📋 Import button: ${result.elements.importBtn}`);
            console.log(`   📋 Export button: ${result.elements.exportBtn}`);

            // Test New Contact button
            if (newContactBtn) {
                await newContactBtn.click();
                await page.waitForTimeout(1000);

                const screenshot = await takeScreenshot('contacts_new_contact_modal');
                result.screenshots.push(screenshot);

                // Close modal if opened
                const closeBtn = await page.$('[aria-label="Close"], button:has-text("Cancel"), button:has-text("Close")');
                if (closeBtn) {
                    await closeBtn.click();
                    await page.waitForTimeout(500);
                }
            }
        } catch (error) {
            console.log(`   ❌ Contacts test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    console.log('\n📧 PHASE 4: EMAIL MODULE');
    console.log('========================');

    // Test Inbox
    await testPage('Email', 'Inbox', 'http://localhost:3004/dashboard/inbox', async (result) => {
        try {
            await page.waitForTimeout(2000);

            // Check for email list
            const emailItems = await page.$$('.email-item, [class*="email"], [class*="message"]');
            result.elements.emailItems = emailItems.length;
            console.log(`   📋 Email items found: ${emailItems.length}`);

            // Check for compose button
            const composeBtn = await page.$('button:has-text("Compose"), button:has-text("New Email"), a[href*="compose"]');
            result.elements.composeBtn = composeBtn ? 'found' : 'missing';
            console.log(`   📋 Compose button: ${result.elements.composeBtn}`);

            // Check for inbox tabs
            const tabs = await page.$$('[role="tab"], .tab, [class*="tab"]');
            result.elements.tabs = tabs.length;
            console.log(`   📋 Inbox tabs found: ${tabs.length}`);

            // Test compose button
            if (composeBtn) {
                await composeBtn.click();
                await page.waitForTimeout(2000);

                const screenshot = await takeScreenshot('email_compose_opened');
                result.screenshots.push(screenshot);
            }
        } catch (error) {
            console.log(`   ❌ Email test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    // Test Email Templates
    await testPage('Email', 'Templates', 'http://localhost:3004/dashboard/email-templates', async (result) => {
        try {
            await page.waitForTimeout(2000);

            // Check for template list
            const templates = await page.$$('.template-item, [class*="template"], table tr');
            result.elements.templates = templates.length;
            console.log(`   📋 Templates found: ${templates.length}`);

            // Check for create template button
            const createBtn = await page.$('button:has-text("Create Template"), button:has-text("New Template")');
            result.elements.createBtn = createBtn ? 'found' : 'missing';
            console.log(`   📋 Create Template button: ${result.elements.createBtn}`);

            if (createBtn) {
                await createBtn.click();
                await page.waitForTimeout(1000);

                const screenshot = await takeScreenshot('email_template_create_modal');
                result.screenshots.push(screenshot);

                // Close modal
                const closeBtn = await page.$('[aria-label="Close"], button:has-text("Cancel")');
                if (closeBtn) {
                    await closeBtn.click();
                }
            }
        } catch (error) {
            console.log(`   ❌ Templates test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    // Test Campaigns
    await testPage('Email', 'Campaigns', 'http://localhost:3004/dashboard/campaigns', async (result) => {
        try {
            await page.waitForTimeout(2000);

            const campaigns = await page.$$('.campaign-item, [class*="campaign"], table tr');
            result.elements.campaigns = campaigns.length;
            console.log(`   📋 Campaigns found: ${campaigns.length}`);

            const createBtn = await page.$('button:has-text("Create Campaign"), button:has-text("New Campaign")');
            result.elements.createBtn = createBtn ? 'found' : 'missing';
            console.log(`   📋 Create Campaign button: ${result.elements.createBtn}`);
        } catch (error) {
            console.log(`   ❌ Campaigns test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    console.log('\n🤖 PHASE 5: AUTOMATION');
    console.log('======================');

    // Test Autoresponders
    await testPage('Automation', 'Autoresponders', 'http://localhost:3004/dashboard/autoresponders', async (result) => {
        try {
            await page.waitForTimeout(2000);

            const autoresponders = await page.$$('.autoresponder-item, [class*="autoresponder"], table tr');
            result.elements.autoresponders = autoresponders.length;
            console.log(`   📋 Autoresponders found: ${autoresponders.length}`);

            const createBtn = await page.$('button:has-text("Create Autoresponder"), button:has-text("New Autoresponder")');
            result.elements.createBtn = createBtn ? 'found' : 'missing';
            console.log(`   📋 Create button: ${result.elements.createBtn}`);
        } catch (error) {
            console.log(`   ❌ Autoresponders test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    // Test CloseBot
    await testPage('Automation', 'CloseBot', 'http://localhost:3004/dashboard/closebot', async (result) => {
        try {
            await page.waitForTimeout(2000);

            const closebotElements = await page.$$('[class*="closebot"], [class*="ai"], [class*="bot"]');
            result.elements.closebotElements = closebotElements.length;
            console.log(`   📋 CloseBot elements found: ${closebotElements.length}`);
        } catch (error) {
            console.log(`   ❌ CloseBot test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    console.log('\n🏢 PHASE 6: OBJECTS (MULTI-TENANT)');
    console.log('===================================');

    await testPage('Objects', 'List', 'http://localhost:3004/dashboard/objects', async (result) => {
        try {
            await page.waitForTimeout(2000);

            const objects = await page.$$('.object-item, [class*="object"], table tr');
            result.elements.objects = objects.length;
            console.log(`   📋 Objects found: ${objects.length}`);

            const createBtn = await page.$('button:has-text("Create Object"), button:has-text("New Object")');
            result.elements.createBtn = createBtn ? 'found' : 'missing';
            console.log(`   📋 Create Object button: ${result.elements.createBtn}`);
        } catch (error) {
            console.log(`   ❌ Objects test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    console.log('\n⚙️ PHASE 7: SETTINGS');
    console.log('====================');

    await testPage('Settings', 'Main', 'http://localhost:3004/dashboard/settings', async (result) => {
        try {
            await page.waitForTimeout(2000);

            // Check for settings sections
            const settingsSections = await page.$$('.settings-section, [class*="setting"], .form-section');
            result.elements.sections = settingsSections.length;
            console.log(`   📋 Settings sections found: ${settingsSections.length}`);

            // Check for tabs/navigation
            const settingsTabs = await page.$$('[role="tab"], .settings-tab, nav a');
            result.elements.tabs = settingsTabs.length;
            console.log(`   📋 Settings tabs found: ${settingsTabs.length}`);

            // Look for Mailgun settings
            const mailgunSection = await page.$(':has-text("Mailgun"), :has-text("Email Settings"), :has-text("Mail Settings")');
            result.elements.mailgunSection = mailgunSection ? 'found' : 'missing';
            console.log(`   📋 Mailgun settings: ${result.elements.mailgunSection}`);
        } catch (error) {
            console.log(`   ❌ Settings test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    console.log('\n📅 PHASE 8: CALENDAR');
    console.log('====================');

    await testPage('Calendar', 'View', 'http://localhost:3004/dashboard/calendar', async (result) => {
        try {
            await page.waitForTimeout(2000);

            // Check for calendar elements
            const calendarElements = await page.$$('.calendar, [class*="calendar"], .fc-view, [class*="event"]');
            result.elements.calendarElements = calendarElements.length;
            console.log(`   📋 Calendar elements found: ${calendarElements.length}`);

            // Check for create event button
            const createEventBtn = await page.$('button:has-text("Create Event"), button:has-text("New Event"), button:has-text("Add Event")');
            result.elements.createEventBtn = createEventBtn ? 'found' : 'missing';
            console.log(`   📋 Create Event button: ${result.elements.createEventBtn}`);
        } catch (error) {
            console.log(`   ❌ Calendar test error: ${error.message}`);
            result.errors.push(error.message);
        }
    });

    console.log('\n📱 PHASE 9: MOBILE RESPONSIVENESS');
    console.log('=================================');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);

    await testPage('Mobile', 'Dashboard', 'http://localhost:3004/dashboard', async (result) => {
        const screenshot = await takeScreenshot('mobile_dashboard_view');
        result.screenshots.push(screenshot);

        // Check for mobile menu
        const mobileMenu = await page.$('[aria-label*="menu"], button:has-text("Menu"), .hamburger, .mobile-menu');
        result.elements.mobileMenu = mobileMenu ? 'found' : 'missing';
        console.log(`   📋 Mobile menu: ${result.elements.mobileMenu}`);

        if (mobileMenu) {
            await mobileMenu.click();
            await page.waitForTimeout(500);

            const menuScreenshot = await takeScreenshot('mobile_menu_opened');
            result.screenshots.push(menuScreenshot);
        }
    });

    await testPage('Mobile', 'Contacts', 'http://localhost:3004/dashboard/contacts', async (result) => {
        const screenshot = await takeScreenshot('mobile_contacts_view');
        result.screenshots.push(screenshot);
    });

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('\n=================================');
    console.log('EXHAUSTIVE DEBUG SESSION COMPLETE');
    console.log('=================================');

    // Calculate final stats
    const passRate = results.totalTests > 0
        ? ((results.passed / results.totalTests) * 100).toFixed(2)
        : 0;

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`   Total Tests: ${results.totalTests}`);
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Pass Rate: ${passRate}%`);
    console.log(`   Errors: ${results.errors.length}`);

    await browser.close();

    // Save JSON results
    const jsonPath = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\DEBUG_CRM_DASHBOARD_RESULTS.json';
    await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Results saved to: ${jsonPath}`);

    return results;
}

// Execute the debug session
exhaustiveCRMDebug().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});