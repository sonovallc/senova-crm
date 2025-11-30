const { chromium } = require('playwright');
const fs = require('fs');

async function debugSenovaCRM() {
    const browser = await chromium.launch({
        headless: false,
        args: ['--window-size=1920,1080']
    });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    const results = {
        timestamp: new Date().toISOString(),
        totalPages: 15,
        tested: [],
        passed: [],
        failed: [],
        issues: {}
    };

    // Pages to test based on navigation
    const pages = [
        // Main pages
        { name: 'Home', url: 'http://localhost:3004/', category: 'Main' },
        { name: 'About', url: 'http://localhost:3004/about', category: 'Main' },
        { name: 'Platform', url: 'http://localhost:3004/platform', category: 'Main' },
        { name: 'Pricing', url: 'http://localhost:3004/pricing', category: 'Main' },
        { name: 'Contact', url: 'http://localhost:3004/contact', category: 'Main' },
        { name: 'Demo', url: 'http://localhost:3004/demo', category: 'Main' },
        { name: 'HIPAA', url: 'http://localhost:3004/hipaa', category: 'Legal' },
        // Solutions pages
        { name: 'CRM', url: 'http://localhost:3004/solutions/crm', category: 'Solutions' },
        { name: 'Audience Intelligence', url: 'http://localhost:3004/solutions/audience-intelligence', category: 'Solutions' },
        { name: 'Patient Identification', url: 'http://localhost:3004/solutions/patient-identification', category: 'Solutions' },
        { name: 'Campaign Activation', url: 'http://localhost:3004/solutions/campaign-activation', category: 'Solutions' },
        { name: 'Analytics', url: 'http://localhost:3004/solutions/analytics', category: 'Solutions' },
        // Legal pages
        { name: 'Privacy Policy', url: 'http://localhost:3004/privacy-policy', category: 'Legal' },
        { name: 'Terms of Service', url: 'http://localhost:3004/terms-of-service', category: 'Legal' },
        { name: 'Security', url: 'http://localhost:3004/security', category: 'Legal' }
    ];

    // Forbidden terms/jargon
    const forbiddenTerms = [
        'DSP',
        'demand side platform',
        'demand-side platform',
        'programmatic',
        'SMB'
    ];

    // Forbidden specific ROI claims
    const forbiddenROI = [
        '3X', '3x',
        '60%',
        '$124K', '$124,000',
        '120%',
        '15X', '15x'
    ];

    console.log('='.repeat(80));
    console.log('SENOVA CRM FINAL DEBUG VERIFICATION');
    console.log('Testing Date:', new Date().toLocaleString());
    console.log('Total Pages to Test:', pages.length);
    console.log('='.repeat(80));

    for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        console.log(`\n[${i+1}/${pages.length}] Testing: ${pageInfo.name} (${pageInfo.category})`);
        console.log('URL:', pageInfo.url);

        const pageResult = {
            name: pageInfo.name,
            url: pageInfo.url,
            category: pageInfo.category,
            issues: [],
            consoleErrors: [],
            status: 'PASS'
        };

        try {
            // Capture console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            // Navigate to page
            const response = await page.goto(pageInfo.url, {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            // Check if page loaded successfully
            if (response.status() === 404) {
                pageResult.issues.push('404 - Page not found');
                pageResult.status = 'FAIL';
                console.log('  ❌ 404 - Page not found');
            } else if (response.status() >= 400) {
                pageResult.issues.push(`HTTP ${response.status()} error`);
                pageResult.status = 'FAIL';
                console.log(`  ❌ HTTP ${response.status()} error`);
            } else {
                console.log('  ✓ Page loaded successfully');

                // Get page content
                const content = await page.content();
                const textContent = await page.evaluate(() => document.body.innerText);

                // Check for forbidden jargon
                console.log('  Checking for forbidden jargon...');
                for (const term of forbiddenTerms) {
                    const regex = new RegExp(term, 'gi');
                    if (regex.test(textContent)) {
                        pageResult.issues.push(`Contains forbidden term: "${term}"`);
                        pageResult.status = 'FAIL';
                        console.log(`    ❌ Found forbidden term: "${term}"`);
                    }
                }

                // Check for specific ROI claims
                console.log('  Checking for specific ROI guarantees...');
                for (const roi of forbiddenROI) {
                    if (textContent.includes(roi)) {
                        pageResult.issues.push(`Contains specific ROI claim: "${roi}"`);
                        pageResult.status = 'FAIL';
                        console.log(`    ❌ Found specific ROI claim: "${roi}"`);
                    }
                }

                // Page-specific checks
                if (pageInfo.name === 'Home') {
                    console.log('  Checking homepage for industry diversity...');
                    const hasMultipleIndustries =
                        textContent.toLowerCase().includes('restaurant') ||
                        textContent.toLowerCase().includes('retail') ||
                        textContent.toLowerCase().includes('home services') ||
                        textContent.toLowerCase().includes('professional services');

                    if (!hasMultipleIndustries) {
                        console.log('    ⚠ May lack industry diversity examples');
                    } else {
                        console.log('    ✓ Contains diverse industry examples');
                    }
                }

                if (pageInfo.name === 'Contact') {
                    console.log('  Checking contact page address...');
                    const correctAddress = '8 The Green #21994, Dover, DE 19901';
                    if (!textContent.includes(correctAddress)) {
                        pageResult.issues.push('Incorrect address - should be: ' + correctAddress);
                        pageResult.status = 'FAIL';
                        console.log('    ❌ Incorrect address');
                    } else {
                        console.log('    ✓ Correct address found');
                    }
                }

                if (pageInfo.name === 'Campaign Activation') {
                    console.log('  Checking for DSP/programmatic language...');
                    if (textContent.toLowerCase().includes('smart advertising') ||
                        textContent.toLowerCase().includes('intelligent advertising')) {
                        console.log('    ✓ Using simplified language');
                    }
                }

                if (pageInfo.name === 'Audience Intelligence') {
                    console.log('  Checking for customer vs patient language...');
                    const hasCustomers = textContent.toLowerCase().includes('customer');
                    const onlyPatients = textContent.toLowerCase().includes('patient') &&
                                        !textContent.toLowerCase().includes('customer');

                    if (onlyPatients) {
                        pageResult.issues.push('Uses "patients" exclusively - should include "customers"');
                        pageResult.status = 'FAIL';
                        console.log('    ❌ Too medical-focused');
                    } else if (hasCustomers) {
                        console.log('    ✓ Uses inclusive "customer" language');
                    }
                }

                // Check console errors
                if (consoleErrors.length > 0) {
                    pageResult.consoleErrors = consoleErrors;
                    pageResult.issues.push(`${consoleErrors.length} console error(s)`);
                    pageResult.status = 'FAIL';
                    console.log(`  ❌ ${consoleErrors.length} console error(s) detected`);
                }

                // Take screenshot
                const screenshotName = `${pageInfo.category.toLowerCase()}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
                await page.screenshot({
                    path: `C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/debug-senova-final/${screenshotName}`,
                    fullPage: false
                });
                console.log(`  📸 Screenshot saved: ${screenshotName}`);
            }

        } catch (error) {
            pageResult.issues.push(`Error: ${error.message}`);
            pageResult.status = 'FAIL';
            console.log(`  ❌ Error: ${error.message}`);
        }

        // Update results
        results.tested.push(pageInfo.name);
        if (pageResult.status === 'PASS') {
            results.passed.push(pageInfo.name);
            console.log(`  ✅ PASS`);
        } else {
            results.failed.push(pageInfo.name);
            results.issues[pageInfo.name] = pageResult.issues;
            console.log(`  ❌ FAIL - ${pageResult.issues.length} issue(s)`);
        }
    }

    // Test navigation elements
    console.log('\n' + '='.repeat(80));
    console.log('TESTING NAVIGATION ELEMENTS');
    console.log('='.repeat(80));

    // Go to homepage to test navigation
    await page.goto('http://localhost:3004/', { waitUntil: 'networkidle' });

    // Check header navigation
    console.log('\nChecking header navigation links...');
    const headerLinks = await page.$$eval('header a', links =>
        links.map(a => ({ text: a.innerText.trim(), href: a.href }))
    );
    console.log(`Found ${headerLinks.length} header links`);

    // Check footer
    console.log('\nChecking footer content...');
    const footerText = await page.$eval('footer', el => el.innerText).catch(() => '');

    if (footerText.includes('DSP') || footerText.includes('programmatic')) {
        console.log('  ❌ Footer contains forbidden jargon');
        results.issues['Footer'] = ['Contains DSP/programmatic jargon'];
    } else {
        console.log('  ✓ Footer is jargon-free');
    }

    // Check for industry-agnostic tagline
    if (footerText.toLowerCase().includes('growing business') ||
        footerText.toLowerCase().includes('any business')) {
        console.log('  ✓ Footer has industry-agnostic messaging');
    } else {
        console.log('  ⚠ Footer may be too industry-specific');
    }

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('FINAL DEBUG SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Pages Tested: ${results.tested.length}/${results.totalPages}`);
    console.log(`Pages Passing: ${results.passed.length}`);
    console.log(`Pages Failing: ${results.failed.length}`);
    console.log(`Pass Rate: ${((results.passed.length / results.tested.length) * 100).toFixed(1)}%`);

    if (results.failed.length > 0) {
        console.log('\nFailed Pages:');
        results.failed.forEach(page => {
            console.log(`  ❌ ${page}`);
            if (results.issues[page]) {
                results.issues[page].forEach(issue => {
                    console.log(`     - ${issue}`);
                });
            }
        });
    }

    if (results.passed.length > 0) {
        console.log('\nPassed Pages:');
        results.passed.forEach(page => {
            console.log(`  ✅ ${page}`);
        });
    }

    // Save results to JSON
    fs.writeFileSync(
        'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/debug-senova-final-results.json',
        JSON.stringify(results, null, 2)
    );

    console.log('\n' + '='.repeat(80));
    if (results.passed.length === results.tested.length) {
        console.log('✅ PRODUCTION READY - All pages passed verification!');
    } else {
        console.log(`❌ NOT PRODUCTION READY - ${results.failed.length} pages need fixes`);
    }
    console.log('='.repeat(80));

    await browser.close();
    return results;
}

// Run the debug
debugSenovaCRM().catch(console.error);