const { chromium } = require('playwright');
const fs = require('fs');

async function comprehensiveTest() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    console.log('='.repeat(80));
    console.log('SENOVA CRM COMPREHENSIVE DEBUG VERIFICATION');
    console.log('Testing Date:', new Date().toLocaleString());
    console.log('='.repeat(80));

    const pages = [
        // Main Pages
        { name: 'Home', url: 'http://localhost:3004/home', category: 'Main' },
        { name: 'About', url: 'http://localhost:3004/about', category: 'Main' },
        { name: 'Platform', url: 'http://localhost:3004/platform', category: 'Main' },
        { name: 'Pricing', url: 'http://localhost:3004/pricing', category: 'Main' },
        { name: 'Contact', url: 'http://localhost:3004/contact', category: 'Main' },
        { name: 'Demo', url: 'http://localhost:3004/demo', category: 'Main' },
        { name: 'HIPAA', url: 'http://localhost:3004/hipaa', category: 'Legal' },
        // Solutions Pages
        { name: 'CRM', url: 'http://localhost:3004/solutions/crm', category: 'Solutions' },
        { name: 'Audience Intelligence', url: 'http://localhost:3004/solutions/audience-intelligence', category: 'Solutions' },
        { name: 'Patient Identification', url: 'http://localhost:3004/solutions/patient-identification', category: 'Solutions' },
        { name: 'Campaign Activation', url: 'http://localhost:3004/solutions/campaign-activation', category: 'Solutions' },
        { name: 'Analytics', url: 'http://localhost:3004/solutions/analytics', category: 'Solutions' },
        // Legal Pages
        { name: 'Privacy Policy', url: 'http://localhost:3004/privacy-policy', category: 'Legal' },
        { name: 'Terms of Service', url: 'http://localhost:3004/terms-of-service', category: 'Legal' },
        { name: 'Security', url: 'http://localhost:3004/security', category: 'Legal' }
    ];

    const results = {
        tested: 0,
        passed: 0,
        failed: 0,
        issues: []
    };

    // Test each page
    for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        console.log(`\n[${i+1}/${pages.length}] Testing: ${pageInfo.name} (${pageInfo.category})`);
        console.log('URL:', pageInfo.url);

        let pageIssues = [];

        try {
            // Navigate to page
            const response = await page.goto(pageInfo.url, {
                waitUntil: 'networkidle',
                timeout: 15000
            });

            // Check response status
            if (response.status() === 404) {
                pageIssues.push('404 - Page not found');
                console.log('  ❌ 404 Error');
            } else if (response.status() >= 500) {
                pageIssues.push(`Server error: ${response.status()}`);
                console.log(`  ❌ Server error: ${response.status()}`);
            } else {
                console.log('  ✓ Page loaded successfully');

                // Get page content
                const text = await page.evaluate(() => document.body?.innerText || '');

                // Check for forbidden jargon
                const forbidden = ['DSP', 'demand side platform', 'demand-side platform', 'programmatic', 'SMB'];
                for (const term of forbidden) {
                    const regex = new RegExp(`\\b${term}\\b`, 'gi');
                    if (regex.test(text)) {
                        pageIssues.push(`Contains forbidden term: "${term}"`);
                        console.log(`  ❌ Found forbidden term: "${term}"`);
                    }
                }

                // Check for specific ROI claims
                const roiClaims = ['3X', '3x', '60%', '$124K', '$124,000', '120%', '15X', '15x'];
                for (const claim of roiClaims) {
                    if (text.includes(claim)) {
                        pageIssues.push(`Specific ROI claim: "${claim}"`);
                        console.log(`  ❌ Found specific ROI: "${claim}"`);
                    }
                }

                // Page-specific validations
                if (pageInfo.name === 'Home') {
                    const hasIndustryDiversity =
                        text.toLowerCase().includes('restaurant') ||
                        text.toLowerCase().includes('retail') ||
                        text.toLowerCase().includes('home services') ||
                        text.toLowerCase().includes('professional services');

                    if (hasIndustryDiversity) {
                        console.log('  ✓ Has diverse industry examples');
                    } else {
                        console.log('  ⚠ May lack industry diversity');
                    }
                }

                if (pageInfo.name === 'Contact') {
                    const correctAddress = '8 The Green #21994, Dover, DE 19901';
                    if (text.includes(correctAddress)) {
                        console.log('  ✓ Correct address found');
                    } else {
                        pageIssues.push('Wrong address');
                        console.log('  ❌ Wrong address');
                    }
                }

                if (pageInfo.name === 'Audience Intelligence') {
                    const hasCustomers = text.toLowerCase().includes('customer');
                    const onlyPatients = text.toLowerCase().includes('patient') && !hasCustomers;

                    if (onlyPatients) {
                        pageIssues.push('Too medical-focused (patients only)');
                        console.log('  ❌ Too medical-focused');
                    } else if (hasCustomers) {
                        console.log('  ✓ Uses inclusive "customer" language');
                    }
                }

                // Take screenshot
                const screenshotPath = `C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/debug-senova-final/${pageInfo.category.toLowerCase()}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`;
                await page.screenshot({ path: screenshotPath, fullPage: false });
                console.log(`  📸 Screenshot saved`);
            }

        } catch (error) {
            pageIssues.push(`Error: ${error.message}`);
            console.log(`  ❌ Error: ${error.message}`);
        }

        // Update results
        results.tested++;
        if (pageIssues.length === 0) {
            results.passed++;
            console.log('  ✅ PASS');
        } else {
            results.failed++;
            results.issues.push({ page: pageInfo.name, issues: pageIssues });
            console.log(`  ❌ FAIL - ${pageIssues.length} issue(s)`);
        }
    }

    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('FINAL DEBUG SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Pages Tested: ${results.tested}/15`);
    console.log(`Pages Passing: ${results.passed}`);
    console.log(`Pages Failing: ${results.failed}`);
    console.log(`Pass Rate: ${((results.passed / results.tested) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
        console.log('\nFailed Pages:');
        results.issues.forEach(item => {
            console.log(`\n❌ ${item.page}:`);
            item.issues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
        });
    }

    console.log('\n' + '='.repeat(80));
    if (results.passed === results.tested) {
        console.log('✅ PRODUCTION READY - All pages passed!');
    } else {
        console.log(`❌ NOT PRODUCTION READY - ${results.failed} pages need fixes`);
    }
    console.log('='.repeat(80));

    // Save results
    fs.writeFileSync(
        'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/DEBUG_REPORT_SENOVA_FINAL.json',
        JSON.stringify(results, null, 2)
    );

    await browser.close();
    return results;
}

comprehensiveTest().catch(console.error);