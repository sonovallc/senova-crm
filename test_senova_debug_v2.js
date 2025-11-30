const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testSenovaCRM() {
    console.log('=' + '='.repeat(78));
    console.log('SENOVA CRM EXHAUSTIVE DEBUG VERIFICATION');
    console.log('=' + '='.repeat(78));
    console.log('Start Time:', new Date().toISOString());

    const screenshotsDir = path.join(__dirname, 'screenshots', 'debug-senova');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const pages = [
        // Main Navigation Pages
        { name: 'Homepage', url: 'http://localhost:3004/', category: 'main' },
        { name: 'Platform', url: 'http://localhost:3004/platform', category: 'main' },
        { name: 'Pricing', url: 'http://localhost:3004/pricing', category: 'main' },
        { name: 'Demo', url: 'http://localhost:3004/demo', category: 'main' },
        { name: 'Contact', url: 'http://localhost:3004/contact', category: 'main' },
        { name: 'About', url: 'http://localhost:3004/about', category: 'main' },

        // Legal/Compliance Pages
        { name: 'HIPAA', url: 'http://localhost:3004/hipaa', category: 'legal' },
        { name: 'Security', url: 'http://localhost:3004/security', category: 'legal' },
        { name: 'Privacy Policy', url: 'http://localhost:3004/privacy-policy', category: 'legal' },
        { name: 'Terms of Service', url: 'http://localhost:3004/terms-of-service', category: 'legal' },

        // Solution Pages
        { name: 'CRM Solution', url: 'http://localhost:3004/solutions/crm', category: 'solution' },
        { name: 'Audience Intelligence', url: 'http://localhost:3004/solutions/audience-intelligence', category: 'solution' },
        { name: 'Patient Identification', url: 'http://localhost:3004/solutions/patient-identification', category: 'solution' },
        { name: 'Campaign Activation', url: 'http://localhost:3004/solutions/campaign-activation', category: 'solution' },
        { name: 'Analytics', url: 'http://localhost:3004/solutions/analytics', category: 'solution' },

        // Industry Pages
        { name: 'Medical Spas', url: 'http://localhost:3004/industries/medical-spas', category: 'industry' },
        { name: 'Dermatology', url: 'http://localhost:3004/industries/dermatology', category: 'industry' },
        { name: 'Plastic Surgery', url: 'http://localhost:3004/industries/plastic-surgery', category: 'industry' },
        { name: 'Aesthetic Clinics', url: 'http://localhost:3004/industries/aesthetic-clinics', category: 'industry' }
    ];

    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    const results = [];
    const violations = {
        soc2Certified: [],
        smb: [],
        roiGuarantees: [],
        addressIssues: [],
        comingSoon: [],
        httpErrors: []
    };

    // Test each page
    for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        console.log('\n[' + (i + 1) + '/' + pages.length + '] Testing: ' + pageInfo.name);
        console.log('  URL: ' + pageInfo.url);

        const result = {
            name: pageInfo.name,
            url: pageInfo.url,
            category: pageInfo.category,
            status: 'PASS',
            errors: [],
            violations: [],
            screenshots: []
        };

        try {
            // Navigate to page
            const response = await page.goto(pageInfo.url, {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            const httpStatus = response.status();
            console.log('  HTTP Status: ' + httpStatus);

            // Check for HTTP errors
            if (httpStatus >= 400) {
                result.status = 'FAIL';
                result.errors.push('HTTP ' + httpStatus + ' error');
                violations.httpErrors.push({ page: pageInfo.name, status: httpStatus });
                console.log('  ❌ HTTP Error');
            } else {
                // Get page text content
                const textContent = await page.evaluate(() => document.body.innerText || '');

                // Check for SOC 2 Certified (should be Compliant)
                if (textContent.includes('SOC 2 Certified')) {
                    result.status = 'FAIL';
                    result.violations.push('Contains "SOC 2 Certified" - should be "SOC 2 Compliant"');
                    violations.soc2Certified.push(pageInfo.name);
                    console.log('  ❌ Found "SOC 2 Certified"');
                } else {
                    console.log('  ✓ No "SOC 2 Certified" found');
                }

                // Check for SMB terminology
                if (textContent.includes('SMB')) {
                    result.status = 'FAIL';
                    result.violations.push('Contains "SMB" - should use "Accessible Pricing"');
                    violations.smb.push(pageInfo.name);
                    console.log('  ❌ Found "SMB" terminology');
                } else {
                    console.log('  ✓ No "SMB" found');
                }

                // Check for specific ROI guarantees
                const roiPatterns = [
                    '$100K', '$127K', '$180K',
                    '60% increase', '67% increase', '80% increase',
                    '3X ROI', '3.2X ROI'
                ];

                for (const pattern of roiPatterns) {
                    if (textContent.includes(pattern)) {
                        result.status = 'FAIL';
                        result.violations.push('Contains ROI guarantee: ' + pattern);
                        violations.roiGuarantees.push({ page: pageInfo.name, pattern });
                        console.log('  ❌ Found ROI guarantee: ' + pattern);
                    }
                }

                // Check for Coming Soon badges
                if (textContent.includes('Coming Soon')) {
                    result.status = 'FAIL';
                    result.violations.push('Contains "Coming Soon" badge');
                    violations.comingSoon.push(pageInfo.name);
                    console.log('  ❌ Found "Coming Soon"');
                } else {
                    console.log('  ✓ No "Coming Soon" found');
                }

                // Special check for Contact page address
                if (pageInfo.name === 'Contact') {
                    if (!textContent.includes('8 The Green #21994')) {
                        result.status = 'FAIL';
                        result.violations.push('Missing correct address format');
                        violations.addressIssues.push('Contact page missing #21994');
                        console.log('  ❌ Incorrect address format');
                    } else {
                        console.log('  ✓ Correct address format');
                    }
                }

                // Take screenshot
                const screenshotName = pageInfo.category + '-' +
                    pageInfo.name.toLowerCase().replace(/\s+/g, '-') + '-' +
                    Date.now() + '.png';
                await page.screenshot({
                    path: path.join(screenshotsDir, screenshotName),
                    fullPage: true
                });
                result.screenshots.push(screenshotName);
                console.log('  ✓ Screenshot saved: ' + screenshotName);
            }

        } catch (error) {
            result.status = 'FAIL';
            result.errors.push(error.message);
            console.log('  ❌ Error: ' + error.message);
        }

        results.push(result);
    }

    await browser.close();

    // Generate summary
    const totalPages = results.length;
    const passedPages = results.filter(r => r.status === 'PASS').length;
    const failedPages = results.filter(r => r.status === 'FAIL').length;
    const passRate = ((passedPages / totalPages) * 100).toFixed(2);

    console.log('\n' + '='.repeat(79));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(79));
    console.log('Total Pages Tested: ' + totalPages);
    console.log('Passed: ' + passedPages);
    console.log('Failed: ' + failedPages);
    console.log('Pass Rate: ' + passRate + '%');

    console.log('\n' + '='.repeat(79));
    console.log('CRITICAL VIOLATIONS BREAKDOWN');
    console.log('='.repeat(79));
    console.log('SOC 2 "Certified" violations: ' + violations.soc2Certified.length);
    if (violations.soc2Certified.length > 0) {
        console.log('  Pages: ' + violations.soc2Certified.join(', '));
    }

    console.log('SMB terminology violations: ' + violations.smb.length);
    if (violations.smb.length > 0) {
        console.log('  Pages: ' + violations.smb.join(', '));
    }

    console.log('ROI guarantee violations: ' + violations.roiGuarantees.length);
    if (violations.roiGuarantees.length > 0) {
        violations.roiGuarantees.forEach(v => {
            console.log('  ' + v.page + ': ' + v.pattern);
        });
    }

    console.log('Address format issues: ' + violations.addressIssues.length);
    if (violations.addressIssues.length > 0) {
        violations.addressIssues.forEach(issue => {
            console.log('  ' + issue);
        });
    }

    console.log('Coming Soon badges: ' + violations.comingSoon.length);
    if (violations.comingSoon.length > 0) {
        console.log('  Pages: ' + violations.comingSoon.join(', '));
    }

    console.log('HTTP errors: ' + violations.httpErrors.length);
    if (violations.httpErrors.length > 0) {
        violations.httpErrors.forEach(e => {
            console.log('  ' + e.page + ': HTTP ' + e.status);
        });
    }

    // Save results to JSON
    const jsonResults = {
        summary: {
            totalPages,
            passedPages,
            failedPages,
            passRate: passRate + '%',
            timestamp: new Date().toISOString()
        },
        violations,
        detailedResults: results
    };

    fs.writeFileSync(
        path.join(__dirname, 'senova-debug-results.json'),
        JSON.stringify(jsonResults, null, 2)
    );

    console.log('\n' + '='.repeat(79));
    console.log('PRODUCTION READINESS VERDICT');
    console.log('='.repeat(79));

    if (passRate === '100.00') {
        console.log('✅ PRODUCTION READY - All tests passed!');
        console.log('   All pages load successfully');
        console.log('   No content violations found');
        console.log('   All compliance requirements met');
    } else {
        console.log('❌ NOT PRODUCTION READY');
        console.log('   Pass Rate: ' + passRate + '%');
        console.log('   ' + failedPages + ' pages have issues that must be fixed');
        console.log('   See violations breakdown above for details');
    }

    console.log('\nTest results saved to: senova-debug-results.json');
    console.log('Screenshots saved to: ' + screenshotsDir);
    console.log('End Time:', new Date().toISOString());
    console.log('=' + '='.repeat(78));

    return passRate === '100.00';
}

// Run the test
testSenovaCRM()
    .then(isReady => {
        process.exit(isReady ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });