const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots', 'navigation-final');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results = [];
  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('=== COMPREHENSIVE NAVIGATION TEST ===\n');

    console.log('Test 1: Login');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, '00-login.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '00-after-login.png'), fullPage: true });
    console.log('Login successful\n');

    const navigationTests = [
      { name: 'Dashboard Home', url: '/dashboard', expectedHeading: 'Dashboard', screenshot: '01-dashboard.png' },
      { name: 'Email > Compose', url: '/dashboard/email/compose', expectedHeading: 'Compose Email', screenshot: '02-compose.png' },
      { name: 'Email > Inbox', url: '/dashboard/inbox', expectedHeading: 'Inbox', screenshot: '03-inbox.png' },
      { name: 'Email > Templates', url: '/dashboard/email/templates', expectedHeading: 'Email Templates', screenshot: '04-templates.png' },
      { name: 'Email > Campaigns', url: '/dashboard/email/campaigns', expectedHeading: 'Email Campaigns', screenshot: '05-campaigns.png' },
      { name: 'Email > Autoresponders', url: '/dashboard/email/autoresponders', expectedHeading: 'Autoresponders', screenshot: '06-autoresponders.png' },
      { name: 'Contacts', url: '/dashboard/contacts', expectedHeading: 'Contacts', screenshot: '07-contacts.png' },
      { name: 'Settings > Email (Mailgun)', url: '/dashboard/settings/email', expectedHeading: 'Mailgun Settings', screenshot: '08-settings-email.png', critical: true },
      { name: 'Settings > Integrations > Closebot', url: '/dashboard/settings/integrations/closebot', expectedHeading: 'Closebot AI Integration', screenshot: '09-closebot.png' }
    ];

    for (let i = 0; i < navigationTests.length; i++) {
      const test = navigationTests[i];
      console.log('Test ' + (i + 2) + ': ' + test.name);
      
      try {
        const response = await page.goto('http://localhost:3004' + test.url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const currentUrl = page.url();
        const httpCode = response.status();
        const pageContent = await page.textContent('body');
        const is404 = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Page not found');

        let headingFound = false;
        try {
          const heading = await page.textContent('h1, h2');
          headingFound = heading && heading.includes(test.expectedHeading);
        } catch (e) {
          headingFound = false;
        }

        await page.screenshot({ path: path.join(screenshotsDir, test.screenshot), fullPage: true });

        const passed = !is404 && headingFound && httpCode === 200;
        const status = passed ? 'PASS' : 'FAIL';

        results.push({
          name: test.name,
          status,
          httpCode,
          url: currentUrl,
          expectedUrl: test.url,
          headingFound,
          is404,
          critical: test.critical || false
        });

        console.log('  ' + (passed ? 'PASS' : 'FAIL') + ' - HTTP ' + httpCode);
        console.log('  Heading found: ' + (headingFound ? 'Yes' : 'No'));
        if (test.critical) {
          console.log('  CRITICAL TEST - BUG-016 VERIFICATION');
        }
        console.log('');

      } catch (error) {
        console.log('  FAIL - Error: ' + error.message);
        results.push({ name: test.name, status: 'FAIL', httpCode: 'ERROR', error: error.message, critical: test.critical || false });
        console.log('');
      }
    }

    if (consoleErrors.length > 0) {
      console.log('Console Errors: ' + consoleErrors.length);
    }

    console.log('\n=== REPORT ===\n');
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;

    console.log('Total Links Tested: ' + totalTests);
    console.log('Pass Rate: ' + passedTests + '/' + totalTests);
    console.log('Failed Links: ' + failedTests);
    console.log('Console Errors: ' + consoleErrors.length);
    console.log('');

    console.log('=== RESULTS ===\n');
    results.forEach(result => {
      const critical = result.critical ? ' [BUG-016]' : '';
      console.log((result.status === 'PASS' ? 'PASS' : 'FAIL') + ' - ' + result.name + ': HTTP ' + result.httpCode + critical);
      if (result.status === 'FAIL') {
        console.log('  Is 404: ' + (result.is404 ? 'Yes' : 'No'));
      }
    });

    console.log('\n=== BUG-016 VERIFICATION ===');
    const bug016Test = results.find(r => r.critical);
    if (bug016Test && bug016Test.status === 'PASS') {
      console.log('BUG-016 FIXED: Settings > Email page loads correctly');
    } else if (bug016Test) {
      console.log('BUG-016 STILL EXISTS: Settings > Email returns 404');
    }

    console.log('\n=== VERDICT ===');
    if (failedTests === 0) {
      console.log('ALL TESTS PASSED');
    } else {
      console.log(failedTests + ' TEST(S) FAILED');
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
})();
