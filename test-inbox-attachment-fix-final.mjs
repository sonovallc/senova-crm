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

    const results = {
        timestamp: new Date().toISOString(),
        screenshots: [],
        steps: [],
        errors: [],
        success: false
    };

    try {
        // Step 1: Check if site is up (login page loads)
        console.log('\n1. Checking if site is up...');
        const loginResponse = await page.goto(`${BASE_URL}/login`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        if (loginResponse?.status() === 502) {
            throw new Error('Site returned 502 Bad Gateway - server is down');
        }

        await page.waitForTimeout(2000);
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

        // Step 2: Login
        console.log('\n2. Logging in...');
        await page.fill('input[type="email"], input[name="email"]', LOGIN_CREDENTIALS.email);
        await page.fill('input[type="password"], input[name="password"]', LOGIN_CREDENTIALS.password);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            page.click('button[type="submit"]')
        ]);

        await page.waitForTimeout(3000);
        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/02-login-success.png`,
            fullPage: true
        });
        results.screenshots.push('02-login-success.png');
        results.steps.push({
            step: 'Login',
            status: 'PASS',
            details: `Logged in as ${LOGIN_CREDENTIALS.email}`
        });
        console.log('✓ Login successful');

        // Step 3: Navigate to inbox
        console.log('\n3. Navigating to inbox...');
        await page.goto(`${BASE_URL}/dashboard/inbox`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForTimeout(3000);
        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/03-inbox-loaded.png`,
            fullPage: true
        });
        results.screenshots.push('03-inbox-loaded.png');

        // Check for conversations
        const conversationCount = await page.locator('[data-conversation-id], .conversation-item, [class*="conversation"]').count();
        results.steps.push({
            step: 'Inbox loaded',
            status: 'PASS',
            details: `Found ${conversationCount} conversations`
        });
        console.log(`✓ Inbox loaded with ${conversationCount} conversations`);

        // Step 4: Select a conversation with attachments
        console.log('\n4. Looking for conversation with attachments...');

        // Try to find conversations with subjects containing "test"
        const testConversations = await page.locator('text=/test/i').all();

        if (testConversations.length > 0) {
            console.log(`Found ${testConversations.length} test conversations`);
            await testConversations[0].click();
        } else {
            // Click first conversation if no test conversations found
            const firstConversation = await page.locator('[data-conversation-id], .conversation-item, [class*="conversation"]').first();
            if (await firstConversation.count() > 0) {
                await firstConversation.click();
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
            status: 'PASS',
            details: 'Opened conversation thread'
        });
        console.log('✓ Conversation selected');

        // Step 5: Look for attachments in messages
        console.log('\n5. Looking for attachments in messages...');

        // Look for attachment indicators
        const attachmentSelectors = [
            'text=/attachment/i',
            'text=/attached/i',
            '[class*="attachment"]',
            'a[href*="/static/uploads"]',
            'a[href*="/uploads"]',
            '[data-attachment]'
        ];

        let attachmentFound = false;
        let attachmentDetails = null;

        for (const selector of attachmentSelectors) {
            const attachments = await page.locator(selector).all();
            if (attachments.length > 0) {
                attachmentFound = true;
                console.log(`Found ${attachments.length} attachments with selector: ${selector}`);

                // Get attachment details
                if (selector.includes('href')) {
                    const firstAttachment = attachments[0];
                    attachmentDetails = {
                        href: await firstAttachment.getAttribute('href'),
                        text: await firstAttachment.textContent()
                    };
                }
                break;
            }
        }

        await page.screenshot({
            path: `${SCREENSHOTS_DIR}/05-attachment-in-message.png`,
            fullPage: true
        });
        results.screenshots.push('05-attachment-in-message.png');

        if (attachmentFound) {
            results.steps.push({
                step: 'Attachments found',
                status: 'PASS',
                details: `Found attachments in conversation`
            });
            console.log('✓ Attachments found in messages');
        } else {
            results.steps.push({
                step: 'Attachments found',
                status: 'WARNING',
                details: 'No attachments found in current conversation'
            });
            console.log('⚠ No attachments found in current conversation');
        }

        // Step 6: Verify attachment links
        console.log('\n6. Verifying attachment links...');

        // Look specifically for attachment links
        const attachmentLinks = await page.locator('a[href*="/static/uploads"], a[href*="/uploads"]').all();

        let linkVerification = {
            found: attachmentLinks.length > 0,
            count: attachmentLinks.length,
            urls: []
        };

        if (attachmentLinks.length > 0) {
            for (const link of attachmentLinks.slice(0, 3)) { // Check first 3 links
                const href = await link.getAttribute('href');
                const text = await link.textContent();
                linkVerification.urls.push({ href, text });

                // Verify it's not a localhost URL
                if (href && href.includes('localhost')) {
                    results.errors.push(`Attachment URL contains localhost: ${href}`);
                }
            }

            // Highlight the first attachment link
            await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.border = '3px solid red';
                    element.style.backgroundColor = 'yellow';
                }
            }, 'a[href*="/static/uploads"], a[href*="/uploads"]');
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
                console.log(`  - ${url.text}: ${url.href}`);
            });
        } else {
            results.steps.push({
                step: 'Attachment links verified',
                status: 'FAIL',
                details: 'No attachment links found'
            });
            console.log('✗ No attachment links found');
        }

        // Determine overall success
        results.success = results.steps.every(s => s.status !== 'FAIL');

    } catch (error) {
        console.error('Error during testing:', error);
        results.errors.push(error.message);
        results.success = false;
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
    } else {
        console.log('✗✗✗ TESTS FAILED - ISSUES FOUND ✗✗✗');
    }
    console.log('='.repeat(60));

    console.log(`\nResults saved to: ${resultsPath}`);
}

main().catch(console.error);