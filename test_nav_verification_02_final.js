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

  async function testNavLink(linkName, selector, screenshotName, expectedUrlPart) {
    console.log('Testing: ' + linkName);
    try {
      await page.goto('http://localhost:3004/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      
      const linkExists = await page.locator(selector).count() > 0;
      if (!linkExists) {
        throw new Error('Link not found: ' + selector);
      }
      
      await page.click(selector, { timeout: 5000 });
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const screenshotPath = path.join(screenshotDir, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      const urlMatches = currentUrl.includes(expectedUrlPart);
      const pageHasContent = await page.locator('body *').count() > 10;
      
      if (!urlMatches) {
        results.push({ link: linkName, status: 'FAIL', reason: 'Wrong URL', expected: expectedUrlPart, actual: currentUrl });
        allPassed = false;
      } else if (!pageHasContent) {
        results.push({ link: linkName, status: 'FAIL', reason: 'Blank Page', url: currentUrl });
        allPassed = false;
      } else {
        results.push({ link: linkName, status: 'PASS', reason: 'OK', url: currentUrl });
      }
    } catch (error) {
      results.push({ link: linkName, status: 'FAIL', reason: error.message, url: 'N/A' });
      allPassed = false;
    }
  }

  try {
    await page.goto('http://localhost:3004/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    await testNavLink('1. Dashboard', 'a[href="/dashboard"]', '02-nav-dashboard.png', '/dashboard');
    await testNavLink('2. Inbox', 'a[href="/dashboard/inbox"]', '02-nav-inbox.png', '/dashboard/inbox');
    await testNavLink('3. Contacts', 'a[href="/dashboard/contacts"]', '02-nav-contacts.png', '/dashboard/contacts');
    await testNavLink('4. Activity Log', 'a[href="/dashboard/activity-log"]', '02-nav-activity.png', '/dashboard/activity-log');
    await testNavLink('5. Payments', 'a[href="/dashboard/payments"]', '02-nav-payments.png', '/dashboard/payments');
    await testNavLink('6. AI Tools', 'a[href="/dashboard/ai"]', '02-nav-ai-tools.png', '/dashboard/ai');

    console.log('
=== RESULTS ===');
    results.forEach((r) => console.log(r.link + ': ' + r.status));
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    console.log('
Passed: ' + passCount + '/' + results.length);
    console.log('OVERALL: ' + (allPassed ? 'PASS' : 'FAIL'));

    fs.writeFileSync(
      path.join(screenshotDir, '02-nav-verification-results.json'),
      JSON.stringify({ overall: allPassed ? 'PASS' : 'FAIL', results: results }, null, 2)
    );

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();