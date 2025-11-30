const { chromium } = require('playwright');

async function quickCheck() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newContext().then(c => c.newPage());

    console.log('='.repeat(60));
    console.log('SENOVA CRM QUICK DEBUG CHECK');
    console.log('='.repeat(60));

    const pages = [
        { name: 'Home', url: 'http://localhost:3004/home' },
        { name: 'About', url: 'http://localhost:3004/about' },
        { name: 'Platform', url: 'http://localhost:3004/platform' },
        { name: 'Pricing', url: 'http://localhost:3004/pricing' },
        { name: 'Contact', url: 'http://localhost:3004/contact' },
        { name: 'Campaign Activation', url: 'http://localhost:3004/solutions/campaign-activation' }
    ];

    let passCount = 0;
    let failCount = 0;
    const issues = [];

    for (const pageInfo of pages) {
        console.log(`\nChecking: ${pageInfo.name}`);
        console.log('URL:', pageInfo.url);

        try {
            const response = await page.goto(pageInfo.url, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            if (response.status() === 404) {
                console.log('  ❌ 404 - Page not found');
                failCount++;
                issues.push(`${pageInfo.name}: 404 error`);
                continue;
            }

            if (response.status() >= 500) {
                console.log(`  ❌ Server error: ${response.status()}`);
                failCount++;
                issues.push(`${pageInfo.name}: Server error ${response.status()}`);
                continue;
            }

            // Get page text content
            const text = await page.evaluate(() => document.body?.innerText || '');

            // Check for forbidden terms
            const forbidden = ['DSP', 'demand side platform', 'programmatic', 'SMB'];
            let hasIssue = false;

            for (const term of forbidden) {
                if (text.toLowerCase().includes(term.toLowerCase())) {
                    console.log(`  ❌ Contains forbidden term: "${term}"`);
                    issues.push(`${pageInfo.name}: Contains "${term}"`);
                    hasIssue = true;
                }
            }

            // Check for specific ROI claims
            const roiClaims = ['3X', '60%', '$124K', '15X'];
            for (const claim of roiClaims) {
                if (text.includes(claim)) {
                    console.log(`  ❌ Contains specific ROI claim: "${claim}"`);
                    issues.push(`${pageInfo.name}: Specific ROI "${claim}"`);
                    hasIssue = true;
                }
            }

            // Page-specific checks
            if (pageInfo.name === 'Contact' && !text.includes('8 The Green #21994')) {
                console.log('  ❌ Wrong address on contact page');
                issues.push('Contact: Wrong address');
                hasIssue = true;
            }

            if (hasIssue) {
                failCount++;
            } else {
                console.log('  ✅ Page passes checks');
                passCount++;
            }

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            failCount++;
            issues.push(`${pageInfo.name}: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`Pages Tested: ${pages.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Pass Rate: ${((passCount / pages.length) * 100).toFixed(1)}%`);

    if (issues.length > 0) {
        console.log('\nISSUES FOUND:');
        issues.forEach(issue => console.log(`  - ${issue}`));
    }

    console.log('='.repeat(60));

    await browser.close();
}

quickCheck().catch(console.error);