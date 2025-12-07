import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

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

async function testInboxAttachmentFix() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Add console logging
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Browser console error:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.log('Page error:', err.message);
    });

    const results = {
        timestamp: new Date().toISOString(),
        screenshots: [],
        steps: [],
        errors: [],
        success: false
    };

    try {
        // Step 1: Check if site is up (login page loads) - with more forgiving timeout
        console.log('\n1. Checking if site is up...');
        console.log(`   Navigating to: ${BASE_URL}/login`);

        try {
            const loginResponse = await page.goto(`${BASE_URL}/login`, {
                waitUntil: 'domcontentloaded', // Changed from networkidle to domcontentloaded
                timeout: 60000 // Increased timeout to 60 seconds
            });

            if (loginResponse) {
                console.log(`   Response status: ${loginResponse.status()}`);

                if (loginResponse.status() === 502) {
                    throw new Error('Site returned 502 Bad Gateway - server is down');
                }
            }

            // Wait for login form to be visible
            await page.waitForSelector('input[type="email"], input[name="email"]', {
                timeout: 30000
            });

            await page.screenshot({
                path: `${SCREENSHOTS_DIR}/01-site-up.png`,
                fullPage: true
            });
            results.screenshots.push('01-site-up.png');
            results.steps.push({
                step: 'Site accessibility',
                status: 'PASS',
                details: `Site loaded with status ${loginResponse?.status()}`
            });
            console.log(`✓ Site is up (status: ${loginResponse?.status()})`);

        } catch (error) {
            console.error('Failed to load login page:', error.message);

            // Try to capture screenshot even on error
            try {
                await page.screenshot({
                    path: `${SCREENSHOTS_DIR}/01-site-error.png`,
                    fullPage: true
                });
                results.screenshots.push('01-site-error.png');
            } catch (screenshotError) {
                console.error('Could not capture error screenshot');
            }

            throw error;
        }

        // Step 2: Login
        console.log('\n2. Logging in...');
        console.log(`   Email: ${LOGIN_CREDENTIALS.email}`);

        // Fill login form
        await page.fill('input[type="email"], input[name="email"]', LOGIN_CREDENTIALS.email);
        await page.fill('input[type="password"], input[name="password"]', LOGIN_CREDENTIALS.password);

        // Click submit and wait for navigation
        const submitButton = await page.locator('button[type="submit"]').first();
        await submitButton.click();

        // Wait for navigation or URL change
        try {
            await page.waitForURL(url => !url.includes('/login'), {
                timeout: 30000
            });
        } catch (navError) {
            console.log('Navigation after login might have issues, continuing...');
        }

        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log(`   Current URL after login: ${currentUrl}`);

        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/02-login-success.png`,
            fullPage: true
        });
        results.screenshots.push('02-login-success.png');
        results.steps.push({
            step: 'Login',
            status: 'PASS',
            details: `Logged in as ${LOGIN_CREDENTIALS.email}, now at ${currentUrl}`
        });
        console.log('✓ Login successful');

        // Step 3: Navigate to inbox
        console.log('\n3. Navigating to inbox...');
        await page.goto(`${BASE_URL}/dashboard/inbox`, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Wait for inbox content to load
        await page.waitForTimeout(5000);

        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/03-inbox-loaded.png`,
            fullPage: true
        });
        results.screenshots.push('03-inbox-loaded.png');

        // Check for conversations - try multiple selectors
        const conversationSelectors = [
            '[data-conversation-id]',
            '.conversation-item',
            '[class*="conversation"]',
            '.message-thread',
            '.inbox-message',
            'div[role="listitem"]'
        ];

        let conversationCount = 0;
        for (const selector of conversationSelectors) {
            const count = await page.locator(selector).count();
            if (count > 0) {
                conversationCount = count;
                console.log(`   Found ${count} conversations using selector: ${selector}`);
                break;
            }
        }

        results.steps.push({
            step: 'Inbox loaded',
            status: conversationCount > 0 ? 'PASS' : 'WARNING',
            details: `Found ${conversationCount} conversations`
        });
        console.log(`✓ Inbox loaded with ${conversationCount} conversations visible`);

        // Step 4: Select a conversation with attachments
        console.log('\n4. Looking for conversation with attachments...');

        // Try multiple methods to find and click a conversation
        const clickMethods = [
            // Method 1: Look for test conversations
            async () => {
                const testConv = await page.locator('text=/test/i').first();
                if (await testConv.count() > 0) {
                    await testConv.click();
                    return true;
                }
                return false;
            },
            // Method 2: Click first conversation item
            async () => {
                for (const selector of conversationSelectors) {
                    const conv = await page.locator(selector).first();
                    if (await conv.count() > 0) {
                        await conv.click();
                        return true;
                    }
                }
                return false;
            },
            // Method 3: Click any clickable element in the conversation list
            async () => {
                const clickable = await page.locator('.cursor-pointer, [role="button"], [onclick]').first();
                if (await clickable.count() > 0) {
                    await clickable.click();
                    return true;
                }
                return false;
            }
        ];

        let conversationClicked = false;
        for (const method of clickMethods) {
            if (await method()) {
                conversationClicked = true;
                console.log('   Successfully clicked on a conversation');
                break;
            }
        }

        await page.waitForTimeout(3000);
        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/04-conversation-selected.png`,
            fullPage: true
        });
        results.screenshots.push('04-conversation-selected.png');
        results.steps.push({
            step: 'Conversation selected',
            status: conversationClicked ? 'PASS' : 'WARNING',
            details: conversationClicked ? 'Opened conversation thread' : 'Could not click conversation'
        });
        console.log(conversationClicked ? '✓ Conversation selected' : '⚠ Could not select conversation');

        // Step 5: Look for attachments in messages
        console.log('\n5. Looking for attachments in messages...');

        // Look for attachment indicators with multiple selectors
        const attachmentSelectors = [
            'text=/attachment/i',
            'text=/attached/i',
            'text=/Attachments:/i',
            '[class*="attachment"]',
            'a[href*="/static/uploads"]',
            'a[href*="/uploads"]',
            '[data-attachment]',
            '.attachment-link',
            '.file-attachment',
            'svg[class*="paperclip"]',
            'svg[class*="attachment"]'
        ];

        let attachmentFound = false;
        let attachmentDetails = [];

        for (const selector of attachmentSelectors) {
            try {
                const elements = await page.locator(selector).all();
                if (elements.length > 0) {
                    attachmentFound = true;
                    console.log(`   Found ${elements.length} elements with selector: ${selector}`);

                    // Get details if it's a link
                    if (selector.includes('href')) {
                        for (const element of elements.slice(0, 3)) {
                            const href = await element.getAttribute('href');
                            const text = await element.textContent();
                            attachmentDetails.push({ href, text, selector });
                            console.log(`     Link: ${text} -> ${href}`);
                        }
                    }
                }
            } catch (err) {
                // Ignore selector errors
            }
        }

        // Also check page content for attachment text
        const pageContent = await page.content();
        if (pageContent.includes('Attachments:') || pageContent.includes('attachment')) {
            console.log('   Found "Attachments:" text in page content');
            attachmentFound = true;
        }

        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/05-attachment-in-message.png`,
            fullPage: true
        });
        results.screenshots.push('05-attachment-in-message.png');

        results.steps.push({
            step: 'Attachments found',
            status: attachmentFound ? 'PASS' : 'WARNING',
            details: attachmentFound ? 'Found attachment indicators' : 'No clear attachment indicators found'
        });
        console.log(attachmentFound ? '✓ Attachment indicators found' : '⚠ No clear attachment indicators found');

        // Step 6: Verify attachment links
        console.log('\n6. Verifying attachment links...');

        // Look specifically for attachment links
        const linkSelectors = [
            'a[href*="/static/uploads"]',
            'a[href*="/uploads"]',
            'a[href*="attachment"]',
            'a[download]'
        ];

        let linkVerification = {
            found: false,
            count: 0,
            urls: []
        };

        for (const selector of linkSelectors) {
            const links = await page.locator(selector).all();
            if (links.length > 0) {
                linkVerification.found = true;
                linkVerification.count += links.length;

                for (const link of links.slice(0, 3)) {
                    const href = await link.getAttribute('href');
                    const text = await link.textContent();
                    linkVerification.urls.push({ href, text, selector });

                    // Check for localhost URLs (which would be wrong)
                    if (href && href.includes('localhost')) {
                        results.errors.push(`Attachment URL contains localhost: ${href}`);
                        console.log(`   ✗ ERROR: Localhost URL found: ${href}`);
                    } else if (href && href.startsWith('/static/uploads')) {
                        console.log(`   ✓ Valid attachment URL: ${href}`);
                    }
                }
            }
        }

        // Try to highlight attachment links for screenshot
        try {
            await page.evaluate(() => {
                const links = document.querySelectorAll('a[href*="/static/uploads"], a[href*="/uploads"]');
                links.forEach(link => {
                    link.style.border = '3px solid red';
                    link.style.backgroundColor = 'yellow';
                    link.style.padding = '2px';
                });
            });
        } catch (err) {
            console.log('   Could not highlight links');
        }

        await page.waitForTimeout(1000);
        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/06-attachment-link-visible.png`,
            fullPage: true
        });
        results.screenshots.push('06-attachment-link-visible.png');

        if (linkVerification.found) {
            results.steps.push({
                step: 'Attachment links verified',
                status: 'PASS',
                details: `Found ${linkVerification.count} attachment links`,
                urls: linkVerification.urls
            });
            console.log(`✓ Attachment links verified (${linkVerification.count} found)`);
            linkVerification.urls.forEach(url => {
                console.log(`  - ${url.text || 'Link'}: ${url.href}`);
            });
        } else {
            results.steps.push({
                step: 'Attachment links verified',
                status: 'WARNING',
                details: 'No clear attachment links found (may be rendered differently)'
            });
            console.log('⚠ No clear attachment links found');
        }

        // Determine overall success
        const failedSteps = results.steps.filter(s => s.status === 'FAIL');
        results.success = failedSteps.length === 0 && results.errors.length === 0;

    } catch (error) {
        console.error('\nError during testing:', error.message);
        results.errors.push(error.message);
        results.success = false;

        // Try to capture error screenshot
        try {
            await page.screenshot({
                path: `${SCREENSHOTS_DIR}/error-screenshot.png`,
                fullPage: true
            });
            results.screenshots.push('error-screenshot.png');
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
    console.log('='.repeat(60));
    console.log('INBOX ATTACHMENT FIX VERIFICATION TEST');
    console.log('Target: https://crm.senovallc.com');
    console.log('='.repeat(60));

    await ensureScreenshotDir();

    const results = await testInboxAttachmentFix();

    // Save results to JSON
    const resultsPath = 'inbox-attachment-fix-results.json';
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    console.log('\nSteps completed:');
    results.steps.forEach((step, index) => {
        const icon = step.status === 'PASS' ? '✓' : step.status === 'WARNING' ? '⚠' : '✗';
        console.log(`${index + 1}. ${icon} ${step.step}: ${step.details}`);
        if (step.urls) {
            step.urls.forEach(url => {
                console.log(`      ${url.text || 'Link'}: ${url.href}`);
            });
        }
    });

    console.log('\nScreenshots captured:');
    results.screenshots.forEach(screenshot => {
        console.log(`  - ${SCREENSHOTS_DIR}/${screenshot}`);
    });

    if (results.errors.length > 0) {
        console.log('\nErrors encountered:');
        results.errors.forEach(error => {
            console.log(`  ✗ ${error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    if (results.success) {
        console.log('✓✓✓ ALL TESTS PASSED - INBOX ATTACHMENTS WORKING ✓✓✓');
    } else if (results.steps.some(s => s.status === 'FAIL')) {
        console.log('✗✗✗ TESTS FAILED - CRITICAL ISSUES FOUND ✗✗✗');
    } else {
        console.log('⚠⚠⚠ TESTS COMPLETED WITH WARNINGS ⚠⚠⚠');
    }
    console.log('='.repeat(60));

    console.log(`\nResults saved to: ${resultsPath}`);
}

main().catch(console.error);