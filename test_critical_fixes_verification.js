const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🔍 CRITICAL FIXES VERIFICATION - Starting...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots', 'critical-fixes-verification');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = {
    navigation: {},
    emailSubmenu: null,
    cors: {},
    variablesDropdown: null,
    timestamp: new Date().toISOString()
  };

  try {
    // ==========================================
    // STEP 1: LOGIN
    // ==========================================
    console.log('📍 STEP 1: Logging in...');

    // Go to login page directly
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });

    // Fill in credentials
    console.log('Filling login credentials...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');

    // Click Sign In button
    await page.click('button:has-text("Sign in")');
    await page.waitForTimeout(3000);

    // Verify we're logged in (should be on dashboard)
    const afterLoginUrl = page.url();
    console.log('After login URL:', afterLoginUrl);
    await page.screenshot({ path: path.join(screenshotDir, '02-dashboard-after-login.png'), fullPage: true });

    if (afterLoginUrl.includes('/dashboard')) {
      console.log('✅ Logged in successfully\n');
    } else {
      console.log('⚠️  Login may have failed, current URL:', afterLoginUrl);
    }

    // ==========================================
    // STEP 2: TEST NAVIGATION FIXES (NAV-001 to NAV-007)
    // ==========================================
    console.log('📍 STEP 2: Testing Navigation Fixes (NAV-001 to NAV-007)...\n');

    const navLinks = [
      { name: 'Inbox', selector: 'a[href="/dashboard/inbox"]', bugId: 'NAV-001' },
      { name: 'Activity Log', selector: 'a[href="/dashboard/activity"]', bugId: 'NAV-002' },
      { name: 'Payments', selector: 'a[href="/dashboard/payments"]', bugId: 'NAV-003' },
      { name: 'AI Tools', selector: 'a[href="/dashboard/ai-tools"]', bugId: 'NAV-004' },
      { name: 'Settings', selector: 'a[href="/dashboard/settings"]', bugId: 'NAV-005' },
      { name: 'Feature Flags', selector: 'a[href="/dashboard/feature-flags"]', bugId: 'NAV-006' },
      { name: 'Deleted Contacts', selector: 'a[href="/dashboard/contacts/deleted"]', bugId: 'NAV-007' }
    ];

    for (const link of navLinks) {
      console.log(`  Testing ${link.name} (${link.bugId})...`);

      try {
        // Go back to dashboard first
        await page.goto('http://localhost:3004/dashboard');
        await page.waitForTimeout(1000);

        // Find and click the link
        const linkElement = await page.$(link.selector);
        if (!linkElement) {
          console.log(`    ❌ FAIL: Link element not found in sidebar`);
          results.navigation[link.bugId] = {
            name: link.name,
            status: 'FAIL',
            reason: 'Link element not found in sidebar',
            screenshot: null
          };
          continue;
        }

        await linkElement.click();
        await page.waitForTimeout(2000);

        // Check URL
        const currentUrl = page.url();
        const expectedPath = link.selector.match(/href="([^"]+)"/)[1];

        // Take screenshot
        const screenshotName = `nav-${link.bugId.toLowerCase()}-${link.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage: true });

        // Check for 404
        const bodyText = await page.textContent('body');
        const is404 = bodyText.includes('404') || bodyText.includes('Not Found') || bodyText.includes('Page not found');

        if (currentUrl.includes(expectedPath) && !is404) {
          console.log(`    ✅ PASS: Navigated successfully to ${currentUrl}`);
          results.navigation[link.bugId] = {
            name: link.name,
            status: 'PASS',
            url: currentUrl,
            screenshot: screenshotName
          };
        } else if (is404) {
          console.log(`    ❌ FAIL: Page shows 404 error`);
          results.navigation[link.bugId] = {
            name: link.name,
            status: 'FAIL',
            reason: '404 Page Not Found',
            url: currentUrl,
            screenshot: screenshotName
          };
        } else {
          console.log(`    ❌ FAIL: URL mismatch (expected ${expectedPath}, got ${currentUrl})`);
          results.navigation[link.bugId] = {
            name: link.name,
            status: 'FAIL',
            reason: `URL mismatch`,
            url: currentUrl,
            screenshot: screenshotName
          };
        }

      } catch (error) {
        console.log(`    ❌ FAIL: Error - ${error.message}`);
        results.navigation[link.bugId] = {
          name: link.name,
          status: 'FAIL',
          reason: error.message,
          screenshot: null
        };
      }
    }

    console.log('\n');

    // ==========================================
    // STEP 3: TEST EMAIL SUBMENU EXPANSION (NAV-008)
    // ==========================================
    console.log('📍 STEP 3: Testing Email Submenu Expansion (NAV-008)...\n');

    try {
      await page.goto('http://localhost:3004/dashboard');
      await page.waitForTimeout(1000);

      // Take before screenshot
      await page.screenshot({ path: path.join(screenshotDir, 'nav-008-email-before-expand.png'), fullPage: true });

      // Find Email link
      const emailLink = await page.$('a:has-text("Email")');
      if (!emailLink) {
        console.log('  ❌ FAIL: Email link not found in sidebar');
        results.emailSubmenu = {
          status: 'FAIL',
          reason: 'Email link not found in sidebar',
          screenshot: null
        };
      } else {
        await emailLink.click();
        await page.waitForTimeout(1000);

        // Take after screenshot
        await page.screenshot({ path: path.join(screenshotDir, 'nav-008-email-after-expand.png'), fullPage: true });

        // Check for submenu items
        const composeVisible = await page.isVisible('a[href="/dashboard/email/compose"]');
        const templatesVisible = await page.isVisible('a[href="/dashboard/email/templates"]');
        const campaignsVisible = await page.isVisible('a[href="/dashboard/email/campaigns"]');
        const autorespondersVisible = await page.isVisible('a[href="/dashboard/email/autoresponders"]');

        const allVisible = composeVisible && templatesVisible && campaignsVisible && autorespondersVisible;

        if (allVisible) {
          console.log('  ✅ PASS: Email submenu expanded successfully');
          console.log('    - Compose: visible');
          console.log('    - Templates: visible');
          console.log('    - Campaigns: visible');
          console.log('    - Autoresponders: visible');
          results.emailSubmenu = {
            status: 'PASS',
            submenuItems: {
              compose: composeVisible,
              templates: templatesVisible,
              campaigns: campaignsVisible,
              autoresponders: autorespondersVisible
            },
            screenshot: 'nav-008-email-after-expand.png'
          };
        } else {
          console.log('  ❌ FAIL: Not all submenu items are visible');
          console.log(`    - Compose: ${composeVisible}`);
          console.log(`    - Templates: ${templatesVisible}`);
          console.log(`    - Campaigns: ${campaignsVisible}`);
          console.log(`    - Autoresponders: ${autorespondersVisible}`);
          results.emailSubmenu = {
            status: 'FAIL',
            reason: 'Not all submenu items visible',
            submenuItems: {
              compose: composeVisible,
              templates: templatesVisible,
              campaigns: campaignsVisible,
              autoresponders: autorespondersVisible
            },
            screenshot: 'nav-008-email-after-expand.png'
          };
        }
      }
    } catch (error) {
      console.log(`  ❌ FAIL: Error - ${error.message}`);
      results.emailSubmenu = {
        status: 'FAIL',
        reason: error.message,
        screenshot: null
      };
    }

    console.log('\n');

    // ==========================================
    // STEP 4: TEST CORS FIX (CORS-001)
    // ==========================================
    console.log('📍 STEP 4: Testing CORS Fix (CORS-001)...\n');

    // Monitor console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Test Campaigns
    console.log('  Testing CORS on Email Campaigns page...');
    try {
      await page.goto('http://localhost:3004/dashboard/email/campaigns');
      await page.waitForTimeout(3000);

      await page.screenshot({ path: path.join(screenshotDir, 'cors-001-campaigns.png'), fullPage: true });

      const campaignsCorsErrors = consoleMessages.filter(msg =>
        msg.text.toLowerCase().includes('cors') ||
        msg.text.toLowerCase().includes('access-control-allow-origin')
      );

      if (campaignsCorsErrors.length === 0) {
        console.log('    ✅ PASS: No CORS errors on Campaigns page');
        results.cors.campaigns = {
          status: 'PASS',
          screenshot: 'cors-001-campaigns.png'
        };
      } else {
        console.log('    ❌ FAIL: CORS errors detected');
        campaignsCorsErrors.forEach(err => console.log(`      - ${err.text}`));
        results.cors.campaigns = {
          status: 'FAIL',
          errors: campaignsCorsErrors.map(e => e.text),
          screenshot: 'cors-001-campaigns.png'
        };
      }
    } catch (error) {
      console.log(`    ❌ FAIL: Error - ${error.message}`);
      results.cors.campaigns = {
        status: 'FAIL',
        reason: error.message,
        screenshot: null
      };
    }

    // Clear console messages
    consoleMessages.length = 0;

    // Test Autoresponders
    console.log('  Testing CORS on Autoresponders page...');
    try {
      await page.goto('http://localhost:3004/dashboard/email/autoresponders');
      await page.waitForTimeout(3000);

      await page.screenshot({ path: path.join(screenshotDir, 'cors-001-autoresponders.png'), fullPage: true });

      const autorespondersCorsErrors = consoleMessages.filter(msg =>
        msg.text.toLowerCase().includes('cors') ||
        msg.text.toLowerCase().includes('access-control-allow-origin')
      );

      if (autorespondersCorsErrors.length === 0) {
        console.log('    ✅ PASS: No CORS errors on Autoresponders page');
        results.cors.autoresponders = {
          status: 'PASS',
          screenshot: 'cors-001-autoresponders.png'
        };
      } else {
        console.log('    ❌ FAIL: CORS errors detected');
        autorespondersCorsErrors.forEach(err => console.log(`      - ${err.text}`));
        results.cors.autoresponders = {
          status: 'FAIL',
          errors: autorespondersCorsErrors.map(e => e.text),
          screenshot: 'cors-001-autoresponders.png'
        };
      }
    } catch (error) {
      console.log(`    ❌ FAIL: Error - ${error.message}`);
      results.cors.autoresponders = {
        status: 'FAIL',
        reason: error.message,
        screenshot: null
      };
    }

    console.log('\n');

    // ==========================================
    // STEP 5: TEST VARIABLES DROPDOWN (COMPOSER-001)
    // ==========================================
    console.log('📍 STEP 5: Testing Variables Dropdown (COMPOSER-001)...\n');

    try {
      await page.goto('http://localhost:3004/dashboard/email/compose');
      await page.waitForTimeout(2000);

      // Take before screenshot
      await page.screenshot({ path: path.join(screenshotDir, 'composer-001-before-dropdown.png'), fullPage: true });

      // Find the Insert Variable button using data-testid
      const variableButton = await page.$('[data-testid="insert-variable-button"]');

      if (!variableButton) {
        console.log('  ❌ FAIL: Insert Variable button not found (data-testid attribute missing)');
        results.variablesDropdown = {
          status: 'FAIL',
          reason: 'Insert Variable button not found (data-testid attribute missing)',
          screenshot: null
        };
      } else {
        console.log('  ✅ Found Insert Variable button with data-testid attribute');

        // Click the button
        await variableButton.click();
        await page.waitForTimeout(1000);

        // Take after screenshot
        await page.screenshot({ path: path.join(screenshotDir, 'composer-001-after-dropdown.png'), fullPage: true });

        // Check for dropdown options
        const expectedVariables = [
          'Contact Name',
          'First Name',
          'Last Name',
          'Email',
          'Phone',
          'Company'
        ];

        const visibleVariables = [];
        const missingVariables = [];

        for (const varName of expectedVariables) {
          const isVisible = await page.isVisible(`text="${varName}"`);
          if (isVisible) {
            visibleVariables.push(varName);
          } else {
            missingVariables.push(varName);
          }
        }

        if (missingVariables.length === 0) {
          console.log('  ✅ PASS: All variable options are visible');
          visibleVariables.forEach(v => console.log(`    - ${v}`));
          results.variablesDropdown = {
            status: 'PASS',
            visibleVariables,
            screenshot: 'composer-001-after-dropdown.png'
          };
        } else {
          console.log('  ❌ FAIL: Some variable options are missing');
          console.log('    Visible:', visibleVariables);
          console.log('    Missing:', missingVariables);
          results.variablesDropdown = {
            status: 'FAIL',
            reason: 'Some variable options are missing',
            visibleVariables,
            missingVariables,
            screenshot: 'composer-001-after-dropdown.png'
          };
        }
      }
    } catch (error) {
      console.log(`  ❌ FAIL: Error - ${error.message}`);
      results.variablesDropdown = {
        status: 'FAIL',
        reason: error.message,
        screenshot: null
      };
    }

    console.log('\n');

    // ==========================================
    // GENERATE SUMMARY
    // ==========================================
    console.log('📊 VERIFICATION SUMMARY\n');
    console.log('=' .repeat(60));

    // Navigation fixes
    console.log('\n🔗 NAVIGATION FIXES (NAV-001 to NAV-007):');
    const navResults = Object.values(results.navigation);
    const navPass = navResults.filter(r => r.status === 'PASS').length;
    const navFail = navResults.filter(r => r.status === 'FAIL').length;
    console.log(`  Total: ${navResults.length} | PASS: ${navPass} | FAIL: ${navFail}`);
    navResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} ${r.name}: ${r.status}`);
      if (r.status === 'FAIL') {
        console.log(`     Reason: ${r.reason}`);
      }
    });

    // Email submenu
    console.log('\n📧 EMAIL SUBMENU EXPANSION (NAV-008):');
    if (results.emailSubmenu) {
      const icon = results.emailSubmenu.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} ${results.emailSubmenu.status}`);
      if (results.emailSubmenu.status === 'FAIL') {
        console.log(`     Reason: ${results.emailSubmenu.reason}`);
      }
    }

    // CORS
    console.log('\n🌐 CORS FIX (CORS-001):');
    if (results.cors.campaigns) {
      const icon = results.cors.campaigns.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} Campaigns: ${results.cors.campaigns.status}`);
    }
    if (results.cors.autoresponders) {
      const icon = results.cors.autoresponders.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} Autoresponders: ${results.cors.autoresponders.status}`);
    }

    // Variables dropdown
    console.log('\n📝 VARIABLES DROPDOWN (COMPOSER-001):');
    if (results.variablesDropdown) {
      const icon = results.variablesDropdown.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} ${results.variablesDropdown.status}`);
      if (results.variablesDropdown.status === 'FAIL') {
        console.log(`     Reason: ${results.variablesDropdown.reason}`);
      }
    }

    console.log('\n' + '='.repeat(60));

    // Overall assessment
    const totalTests = navResults.length + 3; // nav + email submenu + cors (2 pages) + variables
    const totalPass = navPass +
                     (results.emailSubmenu?.status === 'PASS' ? 1 : 0) +
                     (results.cors.campaigns?.status === 'PASS' ? 1 : 0) +
                     (results.cors.autoresponders?.status === 'PASS' ? 1 : 0) +
                     (results.variablesDropdown?.status === 'PASS' ? 1 : 0);
    const totalFail = totalTests - totalPass;
    const passRate = ((totalPass / totalTests) * 100).toFixed(1);

    console.log(`\n🎯 OVERALL: ${totalPass}/${totalTests} tests passed (${passRate}%)`);

    if (totalFail === 0) {
      console.log('\n✅ ALL CRITICAL FIXES VERIFIED - PRODUCTION READY!');
    } else {
      console.log(`\n⚠️  ${totalFail} ISSUES REMAINING - NOT PRODUCTION READY`);
    }

    // Save results
    fs.writeFileSync(
      path.join(__dirname, 'CRITICAL_FIXES_VERIFICATION_RESULTS.json'),
      JSON.stringify(results, null, 2)
    );

    console.log(`\n📁 Results saved to: CRITICAL_FIXES_VERIFICATION_RESULTS.json`);
    console.log(`📸 Screenshots saved to: ${screenshotDir}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Verification complete!');
  }
})();
