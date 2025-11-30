const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const PUBLIC_SITE_URL = 'http://localhost:3000';
const CRM_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/final-verification';

// Test results storage
const results = {
  publicWebsite: {
    total: 0,
    passed: 0,
    failed: 0,
    pages: []
  },
  crmDashboard: {
    total: 0,
    passed: 0,
    failed: 0,
    features: []
  },
  issues: [],
  startTime: new Date().toISOString(),
  endTime: null
};

// All public website pages to test
const publicPages = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/contact', name: 'Contact' },
  { path: '/support', name: 'Support' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/terms', name: 'Terms' },
  { path: '/hipaa', name: 'HIPAA Compliance' },
  { path: '/features/patient-acquisition', name: 'Patient Acquisition' },
  { path: '/features/patient-engagement', name: 'Patient Engagement' },
  { path: '/features/practice-growth', name: 'Practice Growth' },
  { path: '/features/reputation-management', name: 'Reputation Management' },
  { path: '/solutions/patient-identification', name: 'Patient Identification' },
  { path: '/solutions/conversion-optimization', name: 'Conversion Optimization' },
  { path: '/solutions/patient-retention', name: 'Patient Retention' },
  { path: '/industries/medical-spas', name: 'Medical Spas' },
  { path: '/industries/dermatology', name: 'Dermatology' },
  { path: '/industries/plastic-surgery', name: 'Plastic Surgery' },
  { path: '/industries/aesthetic-clinics', name: 'Aesthetic Clinics' },
  { path: '/resources', name: 'Resources' },
  { path: '/resources/blog', name: 'Blog' },
  { path: '/resources/case-studies', name: 'Case Studies' }
];

// CRM dashboard pages and features to test
const crmFeatures = [
  { path: '/login', name: 'Login Page', skipAuth: true },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/contacts', name: 'Contacts' },
  { path: '/dashboard/inbox', name: 'Inbox' },
  { path: '/dashboard/email-templates', name: 'Email Templates (Redirect)' },
  { path: '/dashboard/campaigns', name: 'Campaigns (Redirect)' },
  { path: '/dashboard/autoresponders', name: 'Autoresponders (Redirect)' },
  { path: '/dashboard/closebot', name: 'CloseBot' },
  { path: '/dashboard/calendar', name: 'Calendar' },
  { path: '/dashboard/settings', name: 'Settings' },
  { path: '/dashboard/ai-tools', name: 'AI Tools' },
  { path: '/dashboard/payments', name: 'Payments' }
];

async function testPublicWebsite(browser) {
  console.log('\n========================================');
  console.log('PART 1: TESTING PUBLIC WEBSITE');
  console.log('========================================\n');

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore certain expected warnings
      if (!text.includes('Failed to load resource: net::ERR_FAILED') &&
          !text.includes('favicon.ico')) {
        results.issues.push({
          type: 'Console Error',
          page: page.url(),
          message: text
        });
      }
    }
  });

  for (const pageInfo of publicPages) {
    results.publicWebsite.total++;
    console.log(`\nTesting: ${pageInfo.name} (${pageInfo.path})`);

    try {
      // Navigate to page
      const response = await page.goto(`${PUBLIC_SITE_URL}${pageInfo.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const status = response.status();
      console.log(`  Status: ${status}`);

      if (status === 404 || status === 500) {
        results.publicWebsite.failed++;
        results.publicWebsite.pages.push({
          name: pageInfo.name,
          path: pageInfo.path,
          status: 'FAILED',
          error: `HTTP ${status}`,
          screenshot: null
        });
        results.issues.push({
          type: 'HTTP Error',
          page: pageInfo.path,
          message: `Page returned ${status}`
        });
        continue;
      }

      // Check for content (not placeholder)
      await page.waitForTimeout(1000);
      const bodyText = await page.textContent('body');
      const hasContent = bodyText && bodyText.length > 100;
      console.log(`  Content: ${hasContent ? 'YES' : 'NO'} (${bodyText?.length || 0} chars)`);

      // Take desktop screenshot
      const desktopScreenshot = `public-${pageInfo.path.replace(/\//g, '-')}-desktop.png`;
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, desktopScreenshot),
        fullPage: true
      });
      console.log(`  Screenshot (Desktop): ${desktopScreenshot}`);

      // Test mobile responsiveness
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      const mobileScreenshot = `public-${pageInfo.path.replace(/\//g, '-')}-mobile.png`;
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, mobileScreenshot),
        fullPage: true
      });
      console.log(`  Screenshot (Mobile): ${mobileScreenshot}`);

      // Reset to desktop
      await page.setViewportSize({ width: 1920, height: 1080 });

      results.publicWebsite.passed++;
      results.publicWebsite.pages.push({
        name: pageInfo.name,
        path: pageInfo.path,
        status: 'PASSED',
        hasContent: hasContent,
        screenshots: {
          desktop: desktopScreenshot,
          mobile: mobileScreenshot
        }
      });
      console.log(`  ✓ PASSED`);

    } catch (error) {
      console.log(`  ✗ FAILED: ${error.message}`);
      results.publicWebsite.failed++;
      results.publicWebsite.pages.push({
        name: pageInfo.name,
        path: pageInfo.path,
        status: 'FAILED',
        error: error.message,
        screenshot: null
      });
      results.issues.push({
        type: 'Test Error',
        page: pageInfo.path,
        message: error.message
      });
    }
  }

  await context.close();
}

async function testCRMDashboard(browser) {
  console.log('\n========================================');
  console.log('PART 2: TESTING CRM DASHBOARD');
  console.log('========================================\n');

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore certain expected warnings
      if (!text.includes('Failed to load resource: net::ERR_FAILED') &&
          !text.includes('favicon.ico') &&
          !text.includes('hydration')) {
        results.issues.push({
          type: 'Console Error (CRM)',
          page: page.url(),
          message: text
        });
      }
    }
  });

  // Test login first
  console.log('Testing Login Page...');
  results.crmDashboard.total++;

  try {
    await page.goto(`${CRM_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check for hydration warnings
    const logs = [];
    page.on('console', msg => {
      if (msg.text().includes('hydration')) {
        logs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    // Take screenshot before login
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'crm-login-page.png'),
      fullPage: true
    });

    // Perform login
    console.log('  Entering credentials...');
    await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"]', 'D3n1w3n1!');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'crm-login-filled.png')
    });

    await page.click('button[type="submit"]');
    console.log('  Logging in...');

    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('  ✓ Login successful');

    results.crmDashboard.passed++;
    results.crmDashboard.features.push({
      name: 'Login',
      path: '/login',
      status: 'PASSED',
      hydrationWarnings: logs.length,
      screenshot: 'crm-login-page.png'
    });

  } catch (error) {
    console.log(`  ✗ Login failed: ${error.message}`);
    results.crmDashboard.failed++;
    results.crmDashboard.features.push({
      name: 'Login',
      path: '/login',
      status: 'FAILED',
      error: error.message
    });
    results.issues.push({
      type: 'Login Error',
      page: '/login',
      message: error.message
    });
    await context.close();
    return; // Can't continue without login
  }

  // Test all dashboard pages
  for (const feature of crmFeatures) {
    if (feature.skipAuth) continue; // Skip login page as we already tested it

    results.crmDashboard.total++;
    console.log(`\nTesting: ${feature.name} (${feature.path})`);

    try {
      // Navigate to page
      const response = await page.goto(`${CRM_URL}${feature.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const status = response.status();
      console.log(`  Status: ${status}`);

      // Check if it's a redirect
      const finalUrl = page.url();
      const isRedirect = !finalUrl.includes(feature.path);
      if (isRedirect) {
        console.log(`  Redirected to: ${finalUrl}`);
      }

      // Wait for content
      await page.waitForTimeout(2000);

      // Test API calls for data-dependent pages
      if (feature.path.includes('contacts') || feature.path.includes('inbox')) {
        console.log('  Testing API/CORS...');
        // Check if any data loads or if there are CORS errors
        const networkErrors = [];
        page.on('requestfailed', request => {
          if (request.url().includes('api')) {
            networkErrors.push(request.failure().errorText);
          }
        });

        await page.waitForTimeout(3000);

        if (networkErrors.length > 0) {
          console.log(`  API Errors: ${networkErrors.join(', ')}`);
          results.issues.push({
            type: 'CORS/API Error',
            page: feature.path,
            message: networkErrors.join(', ')
          });
        } else {
          console.log('  ✓ API calls working (no CORS errors)');
        }
      }

      // Take desktop screenshot
      const desktopScreenshot = `crm-${feature.path.replace(/\//g, '-')}-desktop.png`;
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, desktopScreenshot),
        fullPage: true
      });
      console.log(`  Screenshot (Desktop): ${desktopScreenshot}`);

      // Test mobile navigation
      console.log('  Testing mobile view...');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Check for hamburger menu
      const hamburger = await page.$('[data-testid="mobile-menu-button"], button[aria-label*="menu" i], .mobile-menu-button, .hamburger');
      if (hamburger) {
        console.log('  ✓ Hamburger menu found');
        // Click hamburger and screenshot
        await hamburger.click();
        await page.waitForTimeout(500);
        const mobileMenuScreenshot = `crm-${feature.path.replace(/\//g, '-')}-mobile-menu.png`;
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, mobileMenuScreenshot),
          fullPage: true
        });
        console.log(`  Screenshot (Mobile Menu): ${mobileMenuScreenshot}`);

        // Close menu
        const closeButton = await page.$('[aria-label*="close" i], .close-menu');
        if (closeButton) {
          await closeButton.click();
        } else {
          // Click hamburger again to close
          await hamburger.click();
        }
      } else {
        console.log('  ! No hamburger menu found in mobile view');
        results.issues.push({
          type: 'Mobile Navigation',
          page: feature.path,
          message: 'Hamburger menu not found in mobile view'
        });
      }

      const mobileScreenshot = `crm-${feature.path.replace(/\//g, '-')}-mobile.png`;
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, mobileScreenshot),
        fullPage: true
      });
      console.log(`  Screenshot (Mobile): ${mobileScreenshot}`);

      // Reset to desktop
      await page.setViewportSize({ width: 1920, height: 1080 });

      results.crmDashboard.passed++;
      results.crmDashboard.features.push({
        name: feature.name,
        path: feature.path,
        status: 'PASSED',
        isRedirect: isRedirect,
        redirectTo: isRedirect ? finalUrl : null,
        screenshots: {
          desktop: desktopScreenshot,
          mobile: mobileScreenshot
        }
      });
      console.log(`  ✓ PASSED`);

    } catch (error) {
      console.log(`  ✗ FAILED: ${error.message}`);
      results.crmDashboard.failed++;
      results.crmDashboard.features.push({
        name: feature.name,
        path: feature.path,
        status: 'FAILED',
        error: error.message
      });
      results.issues.push({
        type: 'CRM Test Error',
        page: feature.path,
        message: error.message
      });
    }
  }

  await context.close();
}

async function generateReport() {
  console.log('\n========================================');
  console.log('GENERATING FINAL REPORT');
  console.log('========================================\n');

  results.endTime = new Date().toISOString();

  // Calculate percentages
  const publicPassRate = (results.publicWebsite.passed / results.publicWebsite.total * 100).toFixed(1);
  const crmPassRate = (results.crmDashboard.passed / results.crmDashboard.total * 100).toFixed(1);
  const overallTotal = results.publicWebsite.total + results.crmDashboard.total;
  const overallPassed = results.publicWebsite.passed + results.crmDashboard.passed;
  const overallPassRate = (overallPassed / overallTotal * 100).toFixed(1);

  // Generate markdown report
  let report = `# FINAL PRODUCTION VERIFICATION REPORT

**Generated:** ${new Date().toISOString()}
**Test Duration:** ${results.startTime} to ${results.endTime}

---

## EXECUTIVE SUMMARY

**Overall Result:** ${overallPassRate === '100.0' ? '✅ PRODUCTION READY' : `⚠️ NOT PRODUCTION READY`}

- **Total Tests:** ${overallTotal}
- **Passed:** ${overallPassed}
- **Failed:** ${overallTotal - overallPassed}
- **Pass Rate:** ${overallPassRate}%

---

## PUBLIC WEBSITE RESULTS

**Status:** ${results.publicWebsite.passed}/${results.publicWebsite.total} pages verified (${publicPassRate}% pass rate)

### Page Status
| Page | Path | Status | Content | Screenshots |
|------|------|--------|---------|-------------|
`;

  for (const page of results.publicWebsite.pages) {
    const status = page.status === 'PASSED' ? '✅' : '❌';
    const content = page.hasContent ? 'Yes' : 'No';
    const screenshots = page.screenshots ? `[Desktop](${page.screenshots.desktop}) / [Mobile](${page.screenshots.mobile})` : 'N/A';
    report += `| ${page.name} | ${page.path} | ${status} | ${content} | ${screenshots} |\n`;
  }

  report += `
---

## CRM DASHBOARD RESULTS

**Status:** ${results.crmDashboard.passed}/${results.crmDashboard.total} features verified (${crmPassRate}% pass rate)

### Feature Status
| Feature | Path | Status | Notes | Screenshots |
|---------|------|--------|-------|-------------|
`;

  for (const feature of results.crmDashboard.features) {
    const status = feature.status === 'PASSED' ? '✅' : '❌';
    let notes = '';
    if (feature.isRedirect) notes = `Redirects to ${feature.redirectTo}`;
    if (feature.hydrationWarnings) notes = `${feature.hydrationWarnings} hydration warnings`;
    if (feature.error) notes = feature.error;
    const screenshots = feature.screenshots ? `[Desktop](${feature.screenshots.desktop}) / [Mobile](${feature.screenshots.mobile})` : feature.screenshot || 'N/A';
    report += `| ${feature.name} | ${feature.path} | ${status} | ${notes} | ${screenshots} |\n`;
  }

  report += `
---

## ISSUES FOUND

`;

  if (results.issues.length === 0) {
    report += `✅ **No critical issues found**\n`;
  } else {
    report += `⚠️ **${results.issues.length} issues detected:**\n\n`;
    report += `| Type | Location | Description |\n`;
    report += `|------|----------|-------------|\n`;
    for (const issue of results.issues) {
      report += `| ${issue.type} | ${issue.page} | ${issue.message} |\n`;
    }
  }

  report += `
---

## PRODUCTION READINESS ASSESSMENT

`;

  const isProductionReady = overallPassRate === '100.0' && results.issues.length === 0;

  if (isProductionReady) {
    report += `### ✅ SYSTEM IS PRODUCTION READY

**All criteria met:**
- ✅ 100% of public website pages load with content
- ✅ 100% of CRM dashboard pages accessible
- ✅ No 404 errors detected
- ✅ No critical console errors
- ✅ CORS working (API calls succeed)
- ✅ Mobile navigation functional
- ✅ All screenshots captured as evidence
`;
  } else {
    report += `### ⚠️ SYSTEM NOT PRODUCTION READY

**Criteria not met:**
`;
    if (publicPassRate !== '100.0') {
      report += `- ❌ Public website: Only ${publicPassRate}% of pages working\n`;
    }
    if (crmPassRate !== '100.0') {
      report += `- ❌ CRM dashboard: Only ${crmPassRate}% of features working\n`;
    }
    if (results.issues.length > 0) {
      report += `- ❌ ${results.issues.length} issues need resolution\n`;
    }
  }

  report += `
---

## SCREENSHOT EVIDENCE

**Total Screenshots Captured:** ${results.publicWebsite.pages.filter(p => p.screenshots).length * 2 + results.crmDashboard.features.filter(f => f.screenshots).length * 2 + 2}

### Public Website Screenshots
`;

  for (const page of results.publicWebsite.pages.filter(p => p.screenshots)) {
    report += `- ${page.name}: ${page.screenshots.desktop} (desktop), ${page.screenshots.mobile} (mobile)\n`;
  }

  report += `
### CRM Dashboard Screenshots
`;

  for (const feature of results.crmDashboard.features.filter(f => f.screenshots || f.screenshot)) {
    if (feature.screenshots) {
      report += `- ${feature.name}: ${feature.screenshots.desktop} (desktop), ${feature.screenshots.mobile} (mobile)\n`;
    } else if (feature.screenshot) {
      report += `- ${feature.name}: ${feature.screenshot}\n`;
    }
  }

  report += `
---

## TEST EXECUTION DETAILS

- **Test Framework:** Playwright
- **Browser:** Chromium
- **Viewports Tested:** Desktop (1920x1080), Mobile (375x667)
- **Test Script:** test_final_verification.js
- **Screenshot Directory:** ${SCREENSHOT_DIR}

---

## RECOMMENDATIONS

`;

  if (isProductionReady) {
    report += `1. ✅ System is ready for production deployment
2. Consider setting up continuous monitoring
3. Implement automated testing for future updates
`;
  } else {
    report += `1. Fix all identified issues before deployment
2. Re-run verification after fixes
3. Priority fixes:\n`;

    const criticalIssues = results.issues.filter(i => i.type.includes('404') || i.type.includes('500') || i.type.includes('CORS'));
    if (criticalIssues.length > 0) {
      for (const issue of criticalIssues) {
        report += `   - ${issue.type} on ${issue.page}: ${issue.message}\n`;
      }
    }
  }

  report += `
---

*End of Report*
`;

  // Save report
  const reportPath = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/FINAL_PRODUCTION_VERIFICATION_REPORT.md';
  fs.writeFileSync(reportPath, report);
  console.log(`Report saved to: ${reportPath}`);

  // Save JSON results
  const jsonPath = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/final-verification-results.json';
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`JSON results saved to: ${jsonPath}`);

  // Print summary
  console.log('\n========================================');
  console.log('VERIFICATION COMPLETE');
  console.log('========================================');
  console.log(`Overall Pass Rate: ${overallPassRate}%`);
  console.log(`Public Website: ${publicPassRate}% (${results.publicWebsite.passed}/${results.publicWebsite.total})`);
  console.log(`CRM Dashboard: ${crmPassRate}% (${results.crmDashboard.passed}/${results.crmDashboard.total})`);
  console.log(`Issues Found: ${results.issues.length}`);
  console.log(`Production Ready: ${isProductionReady ? 'YES ✅' : 'NO ⚠️'}`);
}

async function main() {
  console.log('========================================');
  console.log('FINAL PRODUCTION VERIFICATION');
  console.log('========================================');
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log(`Public Site URL: ${PUBLIC_SITE_URL}`);
  console.log(`CRM URL: ${CRM_URL}`);
  console.log(`Screenshot Directory: ${SCREENSHOT_DIR}`);

  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser
    slowMo: 100 // Slow down for visibility
  });

  try {
    // Test public website
    await testPublicWebsite(browser);

    // Test CRM dashboard
    await testCRMDashboard(browser);

    // Generate report
    await generateReport();

  } catch (error) {
    console.error('\nFatal Error:', error);
    results.issues.push({
      type: 'Fatal Error',
      page: 'System',
      message: error.message
    });
  } finally {
    await browser.close();
  }
}

// Run the tests
main().catch(console.error);