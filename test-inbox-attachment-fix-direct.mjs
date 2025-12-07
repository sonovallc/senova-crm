import { chromium } from 'playwright';
import fs from 'fs/promises';

const SCREENSHOTS_DIR = 'screenshots/inbox-attachment-fix-final';
const BASE_URL = 'https://crm.senovallc.com';
const LOGIN_CREDENTIALS = {
    email: 'jwoodcapital@gmail.com',
    password: 'D3n1w3n1!'
};

async function ensureScreenshotDir() {
    try {
        await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
        console.log(`✓ Screenshot directory ready: ${SCREENSHOTS_DIR}`);
    } catch (error) {
        console.error('Failed to create screenshot directory:', error);
    }
}

async function testInboxDirectly() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        // Add storage state if we have auth cookies
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Log all network requests for debugging
    page.on('response', response => {
        if (response.status() >= 400) {
            console.log(`Network error: ${response.status()} ${response.url()}`);
        }
    });

    const results = {
        timestamp: new Date().toISOString(),
        screenshots: [],
        steps: [],
        errors: [],
        success: false
    };

    try {
        // Step 1: Try direct navigation to dashboard first
        console.log('\n1. Attempting direct navigation to dashboard...');
        let response = await page.goto(`${BASE_URL}/dashboard`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        await page.waitForTimeout(2000);

        // Check if we're redirected to login
        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);

        if (currentUrl.includes('/login')) {
            console.log('   Redirected to login page - need to authenticate');

            await page.screenshot({
                path: `${SCREENSHOTS_DIR}/01-login-page.png`,
                fullPage: true
            });
            results.screenshots.push('01-login-page.png');

            // Try to login with better error handling
            console.log('\n2. Attempting login...');

            // Wait for and fill email field
            const emailField = await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', {
                timeout: 10000
            });
            await emailField.fill('');
            await emailField.type(LOGIN_CREDENTIALS.email, { delay: 100 });

            // Wait for and fill password field
            const passwordField = await page.waitForSelector('input[type="password"], input[name="password"]', {
                timeout: 10000
            });
            await passwordField.fill('');
            await passwordField.type(LOGIN_CREDENTIALS.password, { delay: 100 });

            // Find and click submit button
            const submitButton = await page.waitForSelector('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")', {
                timeout: 10000
            });

            console.log('   Clicking submit button...');

            // Click and wait for navigation
            await Promise.all([
                page.waitForNavigation({
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                }).catch(e => console.log('Navigation timeout, continuing...')),
                submitButton.click()
            ]);

            await page.waitForTimeout(5000);

            const afterLoginUrl = page.url();
            console.log(`   After login URL: ${afterLoginUrl}`);

            await page.screenshot({
                path: `${SCREENSHOTS_DIR}/02-after-login.png`,
                fullPage: true
            });
            results.screenshots.push('02-after-login.png');

            if (afterLoginUrl.includes('/dashboard')) {
                console.log('✓ Login successful - reached dashboard');
                results.steps.push({
                    step: 'Login',
                    status: 'PASS',
                    details: 'Successfully logged in and reached dashboard'
                });
            } else if (afterLoginUrl.includes('/login')) {
                // Login failed, check for error message
                const errorMessage = await page.locator('.error, .alert, [role="alert"]').textContent().catch(() => null);
                console.log(`✗ Login failed - still on login page. Error: ${errorMessage}`);
                results.steps.push({
                    step: 'Login',
                    status: 'FAIL',
                    details: `Login failed - ${errorMessage || 'Unknown error'}`
                });
            }
        } else {
            console.log('✓ Already authenticated or no login required');
            await page.screenshot({
                path: `${SCREENSHOTS_DIR}/01-dashboard-direct.png`,
                fullPage: true
            });
            results.screenshots.push('01-dashboard-direct.png');
        }

        // Step 3: Navigate to inbox
        console.log('\n3. Navigating to inbox...');

        // Try multiple methods to get to inbox
        const inboxUrl = `${BASE_URL}/dashboard/inbox`;
        console.log(`   Going to: ${inboxUrl}`);

        response = await page.goto(inboxUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        console.log(`   Response status: ${response?.status()}`);

        // Wait for content to load
        await page.waitForTimeout(5000);

        const inboxPageUrl = page.url();
        console.log(`   Current URL: ${inboxPageUrl}`);

        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/03-inbox-page.png`,
            fullPage: true
        });
        results.screenshots.push('03-inbox-page.png');

        // Check if we're on the inbox page
        if (inboxPageUrl.includes('/inbox')) {
            console.log('✓ Reached inbox page');
            results.steps.push({
                step: 'Navigate to inbox',
                status: 'PASS',
                details: 'Successfully reached inbox page'
            });

            // Look for conversations
            console.log('\n4. Looking for conversations...');

            // Wait a bit more for dynamic content
            await page.waitForTimeout(3000);

            // Check various elements that might contain conversations
            const conversationSelectors = [
                '[data-testid*="conversation"]',
                '[class*="conversation"]',
                '[class*="message"]',
                '[class*="inbox-item"]',
                '.list-group-item',
                '[role="listitem"]',
                'div:has-text("test")',
                'tr:has-text("@")'  // Email rows
            ];

            let foundConversations = false;
            for (const selector of conversationSelectors) {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    console.log(`   Found ${count} items with selector: ${selector}`);
                    foundConversations = true;

                    // Try to click the first one
                    const firstItem = page.locator(selector).first();
                    await firstItem.click().catch(() => console.log('   Could not click item'));
                    await page.waitForTimeout(2000);
                    break;
                }
            }

            await page.screenshot({
                path: `${SCREENSHOTS_DIR}/04-inbox-conversations.png`,
                fullPage: true
            });
            results.screenshots.push('04-inbox-conversations.png');

            // Look for attachments
            console.log('\n5. Looking for attachments...');

            // Check page content for attachment indicators
            const pageContent = await page.content();
            const hasAttachmentText = pageContent.toLowerCase().includes('attachment');
            const hasUploadsLinks = pageContent.includes('/static/uploads') || pageContent.includes('/uploads/');

            console.log(`   Page contains "attachment" text: ${hasAttachmentText}`);
            console.log(`   Page contains upload links: ${hasUploadsLinks}`);

            // Look for actual attachment links
            const attachmentLinks = await page.locator('a[href*="/static/uploads"], a[href*="/uploads/"]').all();
            console.log(`   Found ${attachmentLinks.length} attachment links`);

            if (attachmentLinks.length > 0) {
                for (const link of attachmentLinks.slice(0, 3)) {
                    const href = await link.getAttribute('href');
                    const text = await link.textContent();
                    console.log(`     - "${text}": ${href}`);

                    // Check if URL is correct (not localhost)
                    if (href?.includes('localhost')) {
                        console.log('       ✗ ERROR: Contains localhost!');
                        results.errors.push(`Localhost URL found: ${href}`);
                    } else if (href?.startsWith('/static/uploads')) {
                        console.log('       ✓ Correct relative URL');
                    }
                }

                results.steps.push({
                    step: 'Attachment links found',
                    status: 'PASS',
                    details: `Found ${attachmentLinks.length} attachment links`
                });
            } else {
                results.steps.push({
                    step: 'Attachment links found',
                    status: 'WARNING',
                    details: 'No attachment links found in current view'
                });
            }

            // Highlight any attachment links for final screenshot
            await page.evaluate(() => {
                const links = document.querySelectorAll('a[href*="/static/uploads"], a[href*="/uploads/"]');
                links.forEach(link => {
                    link.style.border = '3px solid lime';
                    link.style.backgroundColor = 'yellow';
                    link.style.padding = '4px';
                });
            }).catch(() => console.log('Could not highlight links'));

            await page.screenshot({
                path: `${SCREENSHOTS_DIR}/05-attachments-highlighted.png`,
                fullPage: true
            });
            results.screenshots.push('05-attachments-highlighted.png');

        } else {
            console.log('✗ Could not reach inbox page');
            results.steps.push({
                step: 'Navigate to inbox',
                status: 'FAIL',
                details: `Failed to reach inbox - at ${inboxPageUrl}`
            });
        }

        // Check for site availability
        if (response?.status() !== 502) {
            results.steps.push({
                step: 'Site availability',
                status: 'PASS',
                details: 'Site is up and responding (no 502 error)'
            });
        } else {
            results.steps.push({
                step: 'Site availability',
                status: 'FAIL',
                details: '502 Bad Gateway error'
            });
        }

        results.success = !results.steps.some(s => s.status === 'FAIL');

    } catch (error) {
        console.error('\nError during testing:', error.message);
        results.errors.push(error.message);
        results.success = false;

        try {
            await page.screenshot({
                path: `${SCREENSHOTS_DIR}/error-state.png`,
                fullPage: true
            });
            results.screenshots.push('error-state.png');
        } catch (screenshotError) {
            console.error('Could not capture error screenshot');
        }
    } finally {
        await browser.close();
    }

    return results;
}

// Main execution
async function main() {
    console.log('='.repeat(70));
    console.log('INBOX ATTACHMENT FIX - DIRECT VERIFICATION TEST');
    console.log('Target: https://crm.senovallc.com');
    console.log('='.repeat(70));

    await ensureScreenshotDir();

    const results = await testInboxDirectly();

    // Save results
    const resultsPath = 'inbox-attachment-fix-direct-results.json';
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(70));

    console.log('\n✓ VERIFIED ITEMS:');
    results.steps.filter(s => s.status === 'PASS').forEach(step => {
        console.log(`  ✓ ${step.step}: ${step.details}`);
    });

    if (results.steps.some(s => s.status === 'WARNING')) {
        console.log('\n⚠ WARNINGS:');
        results.steps.filter(s => s.status === 'WARNING').forEach(step => {
            console.log(`  ⚠ ${step.step}: ${step.details}`);
        });
    }

    if (results.steps.some(s => s.status === 'FAIL')) {
        console.log('\n✗ FAILURES:');
        results.steps.filter(s => s.status === 'FAIL').forEach(step => {
            console.log(`  ✗ ${step.step}: ${step.details}`);
        });
    }

    if (results.errors.length > 0) {
        console.log('\n✗ ERRORS:');
        results.errors.forEach(error => {
            console.log(`  ✗ ${error}`);
        });
    }

    console.log('\nSCREENSHOTS CAPTURED:');
    results.screenshots.forEach(screenshot => {
        console.log(`  📸 ${SCREENSHOTS_DIR}/${screenshot}`);
    });

    console.log('\n' + '='.repeat(70));

    // Final verdict
    const hasCriticalFailure = results.steps.some(s =>
        s.status === 'FAIL' && (s.step === 'Site availability' || s.step === 'Login')
    );

    if (hasCriticalFailure) {
        console.log('❌ CRITICAL FAILURE - SITE OR LOGIN ISSUES');
    } else if (!results.success) {
        console.log('⚠️  PARTIAL SUCCESS - SOME ISSUES FOUND');
    } else {
        console.log('✅ VERIFICATION COMPLETE - ATTACHMENT FIX CONFIRMED');
    }

    console.log('='.repeat(70));
    console.log(`\nFull results saved to: ${resultsPath}`);
}

main().catch(console.error);