const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const screenshotDir = path.join(__dirname, 'testing', 'production-readiness');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = [];
  let allPassed = true;

  async function testNavLink(linkName, selector, screenshotName, expectedUrlPath) {
    console.log('Testing: ' + linkName);
    try {
      await page.goto('http://localhost:3004/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      
      const linkExists = await page.locator(selector).count() > 0;
      if (!linkExists) {
        throw new Error('Navigation link not found in sidebar');
      }
      
      await page.click(selector, { timeout: 5000 });
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const screenshotPath = path.join(screenshotDir, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      const title = await page.title();
      const hasErrorTitle = title.toLowerCase().includes('error') || title.toLowerCase().includes('not found');
      const urlMatches = currentUrl.includes(expectedUrlPath);
      const pageHasContent = await page.locator('body *').count() > 10;
      
      if (hasErrorTitle) {
        console.log('FAIL: Error in page title');
        results.push({ link: linkName, status: 'FAIL', reason: 'Error in page title', url: currentUrl });
        allPassed = false;
      } else if (!urlMatches) {
        console.log('FAIL: URL does not match expected path');
        results.push({ link: linkName, status: 'FAIL', reason: 'Wrong URL: ' + currentUrl, url: currentUrl });
        allPassed = false;
      } else if (!pageHasContent) {
        console.log('FAIL: Page appears blank');
        results.push({ link: linkName, status: 'FAIL', reason: 'Blank Page', url: currentUrl });
        allPassed = false;
      } else {
        console.log('PASS');
        results.push({ link: linkName, status: 'PASS', reason: 'OK', url: currentUrl });
      }
    } catch (error) {
      console.log('FAIL: ' + error.message);
      results.push({ link: linkName, status: 'FAIL', reason: error.message, url: 'N/A' });
      allPassed = false;
      try {
        const screenshotPath = path.join(screenshotDir, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch (e) {}
    }
  }

  try {
    console.log('=== EVE CRM Navigation Verification #2 (Fixed) ===\n');
    
    await page.goto('http://localhost:3004/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/login')) {
      console.log('Logging in...\n');
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    await testNavLink('1. Dashboard', 'a[href="/dashboard"]', '02-nav-dashboard.png', '/dashboard');
    await testNavLink('2. Contacts', 'a[href="/contacts"]', '02-nav-contacts.png', '/contacts');
    await testNavLink('3. Inbox', 'a[href="/inbox"]', '02-nav-inbox.png', '/inbox');
    await testNavLink('4. Email > Compose', 'a[href="/email/compose"]', '02-nav-email-compose.png', '/email/compose');
    await testNavLink('5. Email > Templates', 'a[href="/email/templates"]', '02-nav-email-templates.png', '/email/templates');
    await testNavLink('6. Email > Campaigns', 'a[href="/email/campaigns"]', '02-nav-email-campaigns.png', '/email/campaigns');
    await testNavLink('7. Email > Autoresponders', 'a[href="/email/autoresponders"]', '02-nav-email-autoresponders.png', '/email/autoresponders');
    await testNavLink('8. Settings > Users', 'a[href="/settings/users"]', '02-nav-settings-users.png', '/settings/users');
    await testNavLink('9. Settings > Tags', 'a[href="/settings/tags"]', '02-nav-settings-tags.png', '/settings/tags');
    await testNavLink('10. Settings > Fields', 'a[href="/settings/fields"]', '02-nav-settings-fields.png', '/settings/fields');
    await testNavLink('11. Settings > Email', 'a[href="/settings/email"]', '02-nav-settings-email.png', '/settings/email');
    await testNavLink('12. Settings > Mailgun', 'a[href="/settings/mailgun"]', '02-nav-settings-mailgun.png', '/settings/mailgun');
    await testNavLink('13. Settings > Closebot', 'a[href="/settings/closebot"]', '02-nav-settings-closebot.png', '/settings/closebot');
    await testNavLink('14. Activity Log', 'a[href="/activity"]', '02-nav-activity.png', '/activity');
    await testNavLink('15. Payments', 'a[href="/payments"]', '02-nav-payments.png', '/payments');
    await testNavLink('16. AI Tools', 'a[href="/ai-tools"]', '02-nav-ai-tools.png', '/ai-tools');

    console.log('\n========================================');
    console.log('VERIFICATION #2 SUMMARY');
    console.log('========================================\n');
    
    results.forEach((r) => {
      const icon = r.status === 'PASS' ? 'PASS' : 'FAIL';
      console.log(r.link + ': ' + icon + (r.status === 'FAIL' ? ' - ' + r.reason : ''));
    });
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    console.log('\n========================================');
    console.log('Total Pages Tested: ' + results.length);
    console.log('Passed: ' + passCount);
    console.log('Failed: ' + failCount);
    console.log('\nOVERALL RESULT: ' + (allPassed ? 'PASS' : 'FAIL'));
    console.log('========================================\n');

    fs.writeFileSync(
      path.join(screenshotDir, '02-nav-verification-results.json'),
      JSON.stringify({ 
        timestamp: new Date().toISOString(),
        overall: allPassed ? 'PASS' : 'FAIL', 
        totalPages: results.length,
        passed: passCount,
        failed: failCount,
        results: results 
      }, null, 2)
    );

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
