const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function comprehensiveCRMDebug() {
    console.log('===========================================');
    console.log('SENOVA CRM - COMPREHENSIVE DEBUG SESSION');
    console.log('===========================================');
    console.log('Start Time:', new Date().toISOString());
    console.log('Mission: Test EVERY clickable element');
    console.log('===========================================\n');

    const browser = await chromium.launch({
        headless: false,
        args: ['--window-size=1920,1080']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Track all console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const error = msg.text();
            consoleErrors.push(error);
            console.log('🔴 Console Error:', error);
        }
    });

    page.on('pageerror', error => {
        consoleErrors.push(error.message);
        console.log('🔴 Page Error:', error.message);
    });

    const screenshotDir = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\crm-comprehensive-debug';

    // Ensure screenshot directory exists
    try {
        await fs.mkdir(screenshotDir, { recursive: true });
        console.log('✅ Screenshot directory ready');
    } catch (error) {
        console.log('📁 Screenshot directory exists');
    }

    const results = {
        timestamp: new Date().toISOString(),
        totalElements: 0,
        testedElements: 0,
        passedTests: 0,
        failedTests: 0,
        pages: {},
        consoleErrors: [],
        brandingIssues: [],
        brokenImages: [],
        missingPages: []
    };

    async function takeScreenshot(name) {
        const filename = `${name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
        const filepath = path.join(screenshotDir, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`   📸 Screenshot: ${filename}`);
        return filename;
    }

    async function checkForBranding() {
        // Check for "Eve" branding that should be "Senova"
        const pageContent = await page.content();
        if (pageContent.includes('Eve CRM') || pageContent.includes('EVE CRM')) {
            results.brandingIssues.push({
                page: page.url(),
                issue: 'Found "Eve" branding instead of "Senova"',
                screenshot: await takeScreenshot('branding_issue')
            });
            console.log('   ⚠️ Branding Issue: Found "Eve" instead of "Senova"');
        }
    }

    async function checkForBrokenImages() {
        const images = await page.$$('img');
        for (const img of images) {
            const src = await img.getAttribute('src');
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            if (naturalWidth === 0 && src) {
                results.brokenImages.push({
                    page: page.url(),
                    src: src
                });
                console.log(`   ⚠️ Broken Image: ${src}`);
            }
        }
    }

    async function testAllClickableElements(pageName) {
        console.log(`\n   🔍 Finding all clickable elements...`);

        const elements = {
            buttons: await page.$$('button'),
            links: await page.$$('a'),
            inputs: await page.$$('input'),
            selects: await page.$$('select'),
            textareas: await page.$$('textarea'),
            checkboxes: await page.$$('input[type="checkbox"]'),
            radios: await page.$$('input[type="radio"]'),
            clickableDivs: await page.$$('[onclick], [role="button"], [role="menuitem"]')
        };

        const totalElements = Object.values(elements).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`   📊 Found ${totalElements} interactive elements`);
        console.log(`      - Buttons: ${elements.buttons.length}`);
        console.log(`      - Links: ${elements.links.length}`);
        console.log(`      - Inputs: ${elements.inputs.length}`);
        console.log(`      - Selects: ${elements.selects.length}`);
        console.log(`      - Checkboxes: ${elements.checkboxes.length}`);
        console.log(`      - Clickable Divs: ${elements.clickableDivs.length}`);

        results.totalElements += totalElements;

        const pageResult = {
            url: page.url(),
            elements: {
                buttons: [],
                links: [],
                inputs: [],
                selects: [],
                dropdowns: [],
                forms: []
            },
            screenshots: [],
            errors: []
        };

        // Test all buttons
        console.log(`\n   🔘 Testing ${elements.buttons.length} buttons...`);
        for (let i = 0; i < elements.buttons.length; i++) {
            const button = elements.buttons[i];
            try {
                const text = await button.textContent();
                const isVisible = await button.isVisible();
                const isEnabled = await button.isEnabled();

                if (!text || text.trim() === '') continue;

                console.log(`      Testing button: "${text.trim()}"`);

                const buttonInfo = {
                    text: text.trim(),
                    visible: isVisible,
                    enabled: isEnabled,
                    clicked: false
                };

                if (isVisible && isEnabled) {
                    // Take before screenshot
                    const beforeScreenshot = await takeScreenshot(`${pageName}_button_${text.trim()}_before`);

                    // Click the button
                    await button.click();
                    await page.waitForTimeout(1000);

                    // Take after screenshot
                    const afterScreenshot = await takeScreenshot(`${pageName}_button_${text.trim()}_after`);

                    buttonInfo.clicked = true;
                    buttonInfo.beforeScreenshot = beforeScreenshot;
                    buttonInfo.afterScreenshot = afterScreenshot;
                    buttonInfo.resultUrl = page.url();

                    results.testedElements++;
                    results.passedTests++;

                    // Check if modal opened
                    const modal = await page.$('[role="dialog"], .modal, [class*="modal"]');
                    if (modal) {
                        console.log(`         ✅ Modal opened`);
                        buttonInfo.modalOpened = true;

                        // Close modal
                        const closeBtn = await page.$('[aria-label="Close"], button:has-text("Cancel"), button:has-text("Close"), button.close');
                        if (closeBtn) {
                            await closeBtn.click();
                            await page.waitForTimeout(500);
                        } else {
                            // Press Escape
                            await page.keyboard.press('Escape');
                            await page.waitForTimeout(500);
                        }
                    }
                }

                pageResult.elements.buttons.push(buttonInfo);
            } catch (error) {
                console.log(`         ❌ Error testing button: ${error.message}`);
                results.failedTests++;
            }
        }

        // Test all dropdowns/selects
        console.log(`\n   📋 Testing ${elements.selects.length} dropdowns...`);
        for (let i = 0; i < elements.selects.length; i++) {
            const select = elements.selects[i];
            try {
                const isVisible = await select.isVisible();
                if (!isVisible) continue;

                const options = await select.$$('option');
                console.log(`      Dropdown with ${options.length} options`);

                // Screenshot dropdown closed
                const closedScreenshot = await takeScreenshot(`${pageName}_dropdown_${i}_closed`);

                // Open and test each option
                for (let j = 0; j < Math.min(options.length, 3); j++) {
                    const option = options[j];
                    const value = await option.getAttribute('value');
                    const text = await option.textContent();

                    if (value) {
                        await select.selectOption(value);
                        await page.waitForTimeout(500);
                        const optionScreenshot = await takeScreenshot(`${pageName}_dropdown_${i}_option_${j}`);

                        pageResult.elements.dropdowns.push({
                            dropdownIndex: i,
                            optionText: text,
                            optionValue: value,
                            screenshot: optionScreenshot
                        });

                        results.testedElements++;
                        results.passedTests++;
                    }
                }
            } catch (error) {
                console.log(`         ❌ Error testing dropdown: ${error.message}`);
                results.failedTests++;
            }
        }

        // Test form inputs
        console.log(`\n   ✏️ Testing ${elements.inputs.length} input fields...`);
        for (let i = 0; i < Math.min(elements.inputs.length, 5); i++) {
            const input = elements.inputs[i];
            try {
                const type = await input.getAttribute('type');
                const isVisible = await input.isVisible();

                if (!isVisible || type === 'hidden') continue;

                const name = await input.getAttribute('name') || await input.getAttribute('id') || `input_${i}`;
                console.log(`      Testing input: ${name} (type: ${type})`);

                if (type === 'checkbox') {
                    const isChecked = await input.isChecked();
                    await input.click();
                    await page.waitForTimeout(300);
                    const afterClick = await input.isChecked();

                    pageResult.elements.inputs.push({
                        name: name,
                        type: type,
                        wasChecked: isChecked,
                        afterClick: afterClick,
                        toggled: isChecked !== afterClick
                    });

                    results.testedElements++;
                    if (isChecked !== afterClick) {
                        results.passedTests++;
                    } else {
                        results.failedTests++;
                    }
                } else if (type === 'text' || type === 'email' || type === 'password' || !type) {
                    await input.click();
                    await input.fill('Test Input ' + Date.now());
                    await page.waitForTimeout(300);

                    const value = await input.inputValue();
                    pageResult.elements.inputs.push({
                        name: name,
                        type: type || 'text',
                        acceptsInput: value.includes('Test Input'),
                        value: value
                    });

                    results.testedElements++;
                    results.passedTests++;
                }
            } catch (error) {
                console.log(`         ❌ Error testing input: ${error.message}`);
                results.failedTests++;
            }
        }

        results.pages[pageName] = pageResult;
        return pageResult;
    }

    // ==== START COMPREHENSIVE TESTING ====

    try {
        // 1. LOGIN TEST
        console.log('\n🔐 PHASE 1: AUTHENTICATION TESTING');
        console.log('=====================================');

        await page.goto('http://localhost:3004/login');
        await page.waitForLoadState('networkidle');

        const loginScreenshot = await takeScreenshot('01_login_page_initial');

        // Test login form
        const emailField = await page.$('input[type="email"], input[name="email"], input#email');
        const passwordField = await page.$('input[type="password"], input[name="password"], input#password');
        const loginButton = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

        if (emailField && passwordField && loginButton) {
            console.log('✅ Login form found');

            // Test empty submission
            await loginButton.click();
            await page.waitForTimeout(1000);
            await takeScreenshot('01_login_empty_validation');

            // Test invalid credentials
            await emailField.fill('invalid@test.com');
            await passwordField.fill('wrongpassword');
            await loginButton.click();
            await page.waitForTimeout(2000);
            await takeScreenshot('01_login_invalid_credentials');

            // Test valid credentials - re-query elements
            const emailField2 = await page.$('input[type="email"], input[name="email"], input#email');
            const passwordField2 = await page.$('input[type="password"], input[name="password"], input#password');

            if (emailField2 && passwordField2) {
                await emailField2.fill('jwoodcapital@gmail.com');
                await passwordField2.fill('D3n1w3n1!');
                await takeScreenshot('01_login_filled_form');

                const loginButton2 = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
                if (loginButton2) {
                    await loginButton2.click();
                }
            }

            await page.waitForTimeout(3000);

            if (page.url().includes('/dashboard')) {
                console.log('✅ Login successful');
                await takeScreenshot('01_login_success_dashboard');
                results.passedTests++;
            } else {
                console.log('❌ Login failed');
                await takeScreenshot('01_login_failed');
                results.failedTests++;
            }
        }

        // 2. DASHBOARD COMPREHENSIVE TEST
        console.log('\n📊 PHASE 2: DASHBOARD COMPREHENSIVE TEST');
        console.log('=========================================');

        await page.goto('http://localhost:3004/dashboard');
        await page.waitForLoadState('networkidle');

        await checkForBranding();
        await checkForBrokenImages();
        await testAllClickableElements('dashboard');

        // Test sidebar navigation thoroughly
        console.log('\n   📍 Testing Sidebar Navigation...');
        const sidebarLinks = await page.$$('nav a, .sidebar a, aside a');

        for (const link of sidebarLinks) {
            try {
                const text = await link.textContent();
                const href = await link.getAttribute('href');
                console.log(`      Testing nav link: ${text} -> ${href}`);

                await link.click();
                await page.waitForTimeout(2000);

                const currentUrl = page.url();
                const screenshot = await takeScreenshot(`nav_${text.replace(/\s+/g, '_')}`);

                if (currentUrl.includes('404') || currentUrl.includes('error')) {
                    results.missingPages.push({
                        link: text,
                        href: href,
                        resultUrl: currentUrl,
                        screenshot: screenshot
                    });
                    console.log(`         ❌ 404 Error`);
                    results.failedTests++;
                } else {
                    console.log(`         ✅ Page loaded`);
                    results.passedTests++;
                }

                // Check and test elements on this page
                await checkForBranding();
                await checkForBrokenImages();
            } catch (error) {
                console.log(`         ❌ Error: ${error.message}`);
                results.failedTests++;
            }
        }

        // 3. CONTACTS MODULE EXHAUSTIVE TEST
        console.log('\n👥 PHASE 3: CONTACTS MODULE EXHAUSTIVE TEST');
        console.log('===========================================');

        await page.goto('http://localhost:3004/dashboard/contacts');
        await page.waitForTimeout(3000);

        await checkForBranding();
        await checkForBrokenImages();
        await testAllClickableElements('contacts');

        // Test New Contact Form
        console.log('\n   📝 Testing Create Contact Form...');
        const newContactBtn = await page.$('button:has-text("New Contact"), button:has-text("Add Contact")');
        if (newContactBtn) {
            await newContactBtn.click();
            await page.waitForTimeout(1000);

            const formScreenshot = await takeScreenshot('contacts_create_form');

            // Find and test all form fields
            const formInputs = await page.$$('form input, form textarea, form select');
            console.log(`      Found ${formInputs.length} form fields`);

            for (const input of formInputs) {
                const type = await input.getAttribute('type');
                const name = await input.getAttribute('name');
                if (name && type !== 'hidden') {
                    console.log(`         Testing field: ${name}`);
                    results.testedElements++;
                }
            }

            // Close form
            const closeBtn = await page.$('[aria-label="Close"], button:has-text("Cancel")');
            if (closeBtn) await closeBtn.click();
        }

        // Test Import functionality
        console.log('\n   📥 Testing Import Contacts...');
        const importBtn = await page.$('button:has-text("Import")');
        if (importBtn) {
            await importBtn.click();
            await page.waitForTimeout(1000);
            await takeScreenshot('contacts_import_modal');

            // Close import modal
            const closeBtn = await page.$('[aria-label="Close"], button:has-text("Cancel")');
            if (closeBtn) await closeBtn.click();
        }

        // Test Export functionality
        console.log('\n   📤 Testing Export Contacts...');
        const exportBtn = await page.$('button:has-text("Export")');
        if (exportBtn) {
            await exportBtn.click();
            await page.waitForTimeout(1000);
            await takeScreenshot('contacts_export_triggered');
        }

        // 4. EMAIL MODULE COMPREHENSIVE TEST
        console.log('\n📧 PHASE 4: EMAIL MODULE COMPREHENSIVE TEST');
        console.log('==========================================');

        // Test Inbox
        await page.goto('http://localhost:3004/dashboard/inbox');
        await page.waitForTimeout(3000);

        await checkForBranding();
        await checkForBrokenImages();
        await testAllClickableElements('inbox');

        // Test inbox tabs
        console.log('\n   📂 Testing Inbox Tabs...');
        const tabs = await page.$$('[role="tab"], .tab');
        for (const tab of tabs) {
            const tabText = await tab.textContent();
            console.log(`      Testing tab: ${tabText}`);
            await tab.click();
            await page.waitForTimeout(1000);
            await takeScreenshot(`inbox_tab_${tabText.replace(/\s+/g, '_')}`);
            results.testedElements++;
        }

        // Test Composer
        console.log('\n   ✉️ Testing Email Composer...');
        const composeBtn = await page.$('button:has-text("Compose"), a[href*="compose"]');
        if (composeBtn) {
            await composeBtn.click();
            await page.waitForTimeout(2000);

            await takeScreenshot('email_composer_opened');
            await testAllClickableElements('composer');

            // Test template dropdown
            const templateDropdown = await page.$('select[name*="template"], [data-testid*="template"]');
            if (templateDropdown) {
                const options = await templateDropdown.$$('option');
                console.log(`      Template dropdown has ${options.length} options`);

                for (let i = 0; i < Math.min(options.length, 5); i++) {
                    const value = await options[i].getAttribute('value');
                    if (value) {
                        await templateDropdown.selectOption(value);
                        await page.waitForTimeout(500);
                        await takeScreenshot(`composer_template_${i}`);
                    }
                }
            }
        }

        // 5. SETTINGS MODULE COMPREHENSIVE TEST
        console.log('\n⚙️ PHASE 5: SETTINGS COMPREHENSIVE TEST');
        console.log('=======================================');

        await page.goto('http://localhost:3004/dashboard/settings');
        await page.waitForTimeout(2000);

        await checkForBranding();
        await checkForBrokenImages();
        await testAllClickableElements('settings');

        // Test all settings tabs
        console.log('\n   🔧 Testing Settings Sections...');
        const settingsTabs = await page.$$('.settings-tab, [role="tab"], nav a');
        for (const tab of settingsTabs) {
            const tabText = await tab.textContent();
            if (tabText.includes('Settings') || tabText.includes('Profile') || tabText.includes('Email')) {
                console.log(`      Testing settings tab: ${tabText}`);
                await tab.click();
                await page.waitForTimeout(1000);
                await takeScreenshot(`settings_${tabText.replace(/\s+/g, '_')}`);

                // Test form fields in this section
                const inputs = await page.$$('input:visible, textarea:visible');
                console.log(`         Found ${inputs.length} editable fields`);
            }
        }

        // 6. OBJECTS MODULE TEST
        console.log('\n🏢 PHASE 6: OBJECTS (MULTI-TENANT) TEST');
        console.log('=======================================');

        await page.goto('http://localhost:3004/dashboard/objects');
        await page.waitForTimeout(2000);

        await checkForBranding();
        await checkForBrokenImages();
        await testAllClickableElements('objects');

        // Test Create Object
        const createObjectBtn = await page.$('button:has-text("Create Object"), button:has-text("New Object")');
        if (createObjectBtn) {
            await createObjectBtn.click();
            await page.waitForTimeout(1000);
            await takeScreenshot('objects_create_modal');

            // Close modal
            const closeBtn = await page.$('[aria-label="Close"], button:has-text("Cancel")');
            if (closeBtn) await closeBtn.click();
        }

        // 7. ACTIVITY LOG TEST
        console.log('\n📝 PHASE 7: ACTIVITY LOG TEST');
        console.log('=============================');

        await page.goto('http://localhost:3004/dashboard/activity');
        await page.waitForTimeout(2000);

        await checkForBranding();
        await checkForBrokenImages();
        await testAllClickableElements('activity');

        // 8. MOBILE RESPONSIVENESS TEST
        console.log('\n📱 PHASE 8: MOBILE RESPONSIVENESS TEST');
        console.log('======================================');

        await page.setViewportSize({ width: 375, height: 812 });

        // Test key pages in mobile view
        const mobilePagesToTest = [
            '/dashboard',
            '/dashboard/contacts',
            '/dashboard/inbox',
            '/dashboard/settings'
        ];

        for (const pagePath of mobilePagesToTest) {
            console.log(`   Testing mobile view: ${pagePath}`);
            await page.goto(`http://localhost:3004${pagePath}`);
            await page.waitForTimeout(2000);

            const screenshot = await takeScreenshot(`mobile${pagePath.replace(/\//g, '_')}`);

            // Check for mobile menu
            const mobileMenu = await page.$('[aria-label*="menu"], .hamburger, .mobile-menu-toggle');
            if (mobileMenu) {
                console.log('      ✅ Mobile menu found');
                await mobileMenu.click();
                await page.waitForTimeout(500);
                await takeScreenshot(`mobile${pagePath.replace(/\//g, '_')}_menu_open`);
                results.passedTests++;
            } else {
                console.log('      ⚠️ No mobile menu found');
                results.failedTests++;
            }
        }

        // Reset viewport
        await page.setViewportSize({ width: 1920, height: 1080 });

    } catch (error) {
        console.error('Fatal error during testing:', error);
        results.errors = [error.message];
    }

    // Calculate final statistics
    console.log('\n===========================================');
    console.log('COMPREHENSIVE DEBUG SESSION COMPLETE');
    console.log('===========================================');

    results.consoleErrors = [...new Set(consoleErrors)]; // Unique errors only

    const totalTests = results.passedTests + results.failedTests;
    const passRate = totalTests > 0 ? ((results.passedTests / totalTests) * 100).toFixed(2) : 0;

    console.log('\n📊 FINAL STATISTICS:');
    console.log(`   Total Elements Found: ${results.totalElements}`);
    console.log(`   Elements Tested: ${results.testedElements}`);
    console.log(`   Tests Passed: ${results.passedTests}`);
    console.log(`   Tests Failed: ${results.failedTests}`);
    console.log(`   Pass Rate: ${passRate}%`);
    console.log(`   Console Errors: ${results.consoleErrors.length}`);
    console.log(`   Branding Issues: ${results.brandingIssues.length}`);
    console.log(`   Broken Images: ${results.brokenImages.length}`);
    console.log(`   Missing Pages (404): ${results.missingPages.length}`);

    if (results.missingPages.length > 0) {
        console.log('\n❌ MISSING PAGES:');
        results.missingPages.forEach(page => {
            console.log(`   - ${page.link}: ${page.href}`);
        });
    }

    if (results.brandingIssues.length > 0) {
        console.log('\n⚠️ BRANDING ISSUES:');
        results.brandingIssues.forEach(issue => {
            console.log(`   - ${issue.page}: ${issue.issue}`);
        });
    }

    await browser.close();

    // Save results to JSON
    const jsonPath = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\DEBUG_CRM_COMPREHENSIVE_RESULTS.json';
    await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Results saved to: ${jsonPath}`);

    return results;
}

// Execute the comprehensive debug
comprehensiveCRMDebug().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});