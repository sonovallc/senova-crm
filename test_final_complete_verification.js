const { chromium } = require('playwright');

async function testSenovaCRM() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    publicPages: {},
    dashboardPages: {},
    bugVerifications: {},
    errors: [],
    warnings: [],
    totalTests: 0,
    passed: 0,
    failed: 0
  };

  // Monitor console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push({
        time: new Date().toISOString(),
        url: page.url(),
        text: msg.text()
      });
    }
    if (msg.type() === 'warning' && (msg.text().includes('hydration') || msg.text().includes('key'))) {
      results.warnings.push({
        time: new Date().toISOString(),
        url: page.url(),
        text: msg.text()
      });
    }
  });

  // Helper function to test a page
  async function testPage(url, name, category) {
    console.log(`\n=== Testing ${name} (${url}) ===`);
    results.totalTests++;

    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(2000);

      const status = response.status();
      console.log(`  Status: ${status}`);

      // Take screenshot
      await page.screenshot({
        path: `screenshots/final-verify/${name.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.png`,
        fullPage: true
      });

      // Count interactive elements
      const buttons = await page.$$('button');
      const links = await page.$$('a');
      const inputs = await page.$$('input');
      const selects = await page.$$('select');

      console.log(`  Found: ${buttons.length} buttons, ${links.length} links, ${inputs.length} inputs, ${selects.length} selects`);

      // Test a few buttons if they exist
      if (buttons.length > 0) {
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
          try {
            const btnText = await buttons[i].innerText();
            console.log(`  Testing button: "${btnText}"`);

            const isDisabled = await buttons[i].isDisabled();
            if (!isDisabled) {
              await buttons[i].click({ timeout: 2000 }).catch(() => {});
              await page.waitForTimeout(1000);
            }
          } catch (e) {
            // Button might have navigated away or opened modal
          }
        }
      }

      const result = {
        status,
        passed: status === 200,
        elements: {
          buttons: buttons.length,
          links: links.length,
          inputs: inputs.length,
          selects: selects.length
        },
        errors: results.errors.filter(e => e.url === url).length,
        warnings: results.warnings.filter(w => w.url === url).length
      };

      results[category][name] = result;

      if (result.passed) {
        results.passed++;
        console.log(`  ✅ PASSED`);
      } else {
        results.failed++;
        console.log(`  ❌ FAILED`);
      }

      return result;

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      results.failed++;
      results[category][name] = {
        status: 'ERROR',
        passed: false,
        error: error.message
      };
      return { passed: false, error: error.message };
    }
  }

  try {
    console.log('Starting FINAL COMPLETE VERIFICATION of Senova CRM...');
    console.log('=' .repeat(60));

    // PHASE 1: Public Website Pages
    console.log('\n📄 PHASE 1: PUBLIC WEBSITE VERIFICATION');
    console.log('-' .repeat(40));

    const publicPages = [
      { url: 'http://localhost:3004/', name: 'Home' },
      { url: 'http://localhost:3004/features', name: 'Features' },
      { url: 'http://localhost:3004/platform', name: 'Platform' },
      { url: 'http://localhost:3004/pricing', name: 'Pricing' },
      { url: 'http://localhost:3004/about', name: 'About' },
      { url: 'http://localhost:3004/contact', name: 'Contact' },
      { url: 'http://localhost:3004/login', name: 'Login' },
      { url: 'http://localhost:3004/register', name: 'Register' }
    ];

    for (const pageInfo of publicPages) {
      await testPage(pageInfo.url, pageInfo.name, 'publicPages');
    }

    // Test some industry pages
    console.log('\n📄 Testing Industry Pages...');
    const industries = ['medical-spas', 'dermatology', 'plastic-surgery', 'restaurants'];
    for (const industry of industries) {
      await testPage(`http://localhost:3004/industries/${industry}`, `Industry-${industry}`, 'publicPages');
    }

    // Test some solution pages
    console.log('\n📄 Testing Solution Pages...');
    const solutions = ['lead-management', 'customer-engagement', 'analytics', 'automation'];
    for (const solution of solutions) {
      await testPage(`http://localhost:3004/solutions/${solution}`, `Solution-${solution}`, 'publicPages');
    }

    // PHASE 2: CRM Dashboard (Login Required)
    console.log('\n🔐 PHASE 2: CRM DASHBOARD VERIFICATION');
    console.log('-' .repeat(40));

    // Navigate to login
    console.log('Logging into CRM...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Fill login form
    const emailInput = await page.$('input[type="email"], input[name="email"], #email');
    const passwordInput = await page.$('input[type="password"], input[name="password"], #password');

    if (emailInput && passwordInput) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('Password123!');

      await page.screenshot({ path: 'screenshots/final-verify/login-filled.png' });

      // Submit login
      const submitBtn = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      if (submitBtn) {
        await submitBtn.click();
        console.log('Login submitted, waiting for navigation...');

        // Wait for navigation or error
        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        console.log(`Current URL after login: ${currentUrl}`);

        if (currentUrl.includes('/dashboard') || currentUrl.includes('/app')) {
          console.log('✅ Login successful!');

          // Test dashboard pages
          const dashboardPages = [
            { url: `${currentUrl}`, name: 'Dashboard-Main' },
            { url: 'http://localhost:3004/dashboard/contacts', name: 'Contacts' },
            { url: 'http://localhost:3004/dashboard/email', name: 'Email' },
            { url: 'http://localhost:3004/dashboard/email/compose', name: 'Email-Compose' },
            { url: 'http://localhost:3004/dashboard/email/templates', name: 'Email-Templates' },
            { url: 'http://localhost:3004/dashboard/email/campaigns', name: 'Email-Campaigns' },
            { url: 'http://localhost:3004/dashboard/settings', name: 'Settings' },
            { url: 'http://localhost:3004/dashboard/settings/profile', name: 'Settings-Profile' },
            { url: 'http://localhost:3004/dashboard/settings/billing', name: 'Settings-Billing' }
          ];

          for (const pageInfo of dashboardPages) {
            await testPage(pageInfo.url, pageInfo.name, 'dashboardPages');
          }

          // Test Create Contact functionality
          console.log('\n📝 Testing Create Contact...');
          await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);

          const createBtn = await page.$('button:has-text("Create Contact"), button:has-text("Add Contact"), button:has-text("New Contact")');
          if (createBtn) {
            await createBtn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'screenshots/final-verify/create-contact-modal.png' });

            // Fill form if modal opened
            const nameInput = await page.$('input[name="name"], #name');
            const emailInputModal = await page.$('input[name="email"], #email');
            if (nameInput && emailInputModal) {
              await nameInput.fill('Test User Final');
              await emailInputModal.fill('testfinal@example.com');
              console.log('  Filled contact form');
            }
          }

          // Test Email Composer
          console.log('\n✉️ Testing Email Composer...');
          await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);

          const toField = await page.$('input[name="to"], #to');
          const subjectField = await page.$('input[name="subject"], #subject');
          if (toField && subjectField) {
            await toField.fill('test@example.com');
            await subjectField.fill('Final Verification Test Email');
            console.log('  Filled email composer');
          }

        } else {
          console.log('❌ Login failed or redirected to unexpected page');
          results.bugVerifications['Login'] = { passed: false, error: 'Login failed' };
        }

      } else {
        console.log('❌ Could not find login submit button');
      }
    } else {
      console.log('❌ Could not find login form fields');
    }

    // PHASE 3: Bug Verification
    console.log('\n🐛 PHASE 3: BUG FIX VERIFICATION');
    console.log('-' .repeat(40));

    // Check /features page (was 404)
    console.log('Checking /features page (was 404)...');
    const featuresResult = await testPage('http://localhost:3004/features', 'Features-BugCheck', 'bugVerifications');
    results.bugVerifications['Features-404-Fixed'] = featuresResult.passed;

    // Check for console errors
    console.log('\nChecking for console errors...');
    console.log(`  Total errors: ${results.errors.length}`);
    console.log(`  Total warnings: ${results.warnings.length}`);
    results.bugVerifications['No-Console-Errors'] = results.errors.length === 0;
    results.bugVerifications['No-Hydration-Warnings'] = results.warnings.filter(w => w.text.includes('hydration')).length === 0;
    results.bugVerifications['No-Duplicate-Keys'] = results.warnings.filter(w => w.text.includes('key')).length === 0;

    // Check backend health
    console.log('\nChecking backend API health...');
    try {
      const apiResponse = await page.evaluate(async () => {
        const response = await fetch('http://localhost:8000/health');
        return { status: response.status, ok: response.ok };
      });
      console.log(`  Backend API status: ${apiResponse.status}`);
      results.bugVerifications['Backend-API-Healthy'] = apiResponse.ok;
    } catch (e) {
      console.log(`  Backend API error: ${e.message}`);
      results.bugVerifications['Backend-API-Healthy'] = false;
    }

    // Calculate final scores
    const totalPages = Object.keys(results.publicPages).length + Object.keys(results.dashboardPages).length;
    const passedPages = Object.values(results.publicPages).filter(p => p.passed).length +
                       Object.values(results.dashboardPages).filter(p => p.passed).length;

    const bugFixesTotal = Object.keys(results.bugVerifications).length;
    const bugFixesPassed = Object.values(results.bugVerifications).filter(b => b === true).length;

    results.summary = {
      totalPages,
      passedPages,
      failedPages: totalPages - passedPages,
      pageSuccessRate: ((passedPages / totalPages) * 100).toFixed(1) + '%',
      bugFixesTotal,
      bugFixesPassed,
      bugFixesFailed: bugFixesTotal - bugFixesPassed,
      bugFixSuccessRate: ((bugFixesPassed / bugFixesTotal) * 100).toFixed(1) + '%',
      overallHealthScore: (((passedPages / totalPages) + (bugFixesPassed / bugFixesTotal)) / 2 * 100).toFixed(1) + '%',
      productionReady: passedPages === totalPages && bugFixesPassed === bugFixesTotal
    };

    console.log('\n' + '=' .repeat(60));
    console.log('FINAL VERIFICATION COMPLETE');
    console.log('=' .repeat(60));
    console.log(`Pages Tested: ${totalPages}`);
    console.log(`Pages Passed: ${passedPages}`);
    console.log(`Bug Fixes Verified: ${bugFixesPassed}/${bugFixesTotal}`);
    console.log(`Overall Health Score: ${results.summary.overallHealthScore}`);
    console.log(`Production Ready: ${results.summary.productionReady ? '✅ YES' : '❌ NO'}`);

    return results;

  } catch (error) {
    console.error('Fatal error during verification:', error);
    results.fatalError = error.message;
    return results;
  } finally {
    await browser.close();
  }
}

// Run the test
testSenovaCRM().then(results => {
  console.log('\nSaving results to file...');
  require('fs').writeFileSync(
    'debug-final-complete-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('Results saved to debug-final-complete-results.json');
  process.exit(results.summary?.productionReady ? 0 : 1);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});