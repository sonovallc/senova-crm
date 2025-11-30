const { chromium } = require('playwright');

const URLS_TO_TEST = [
  '/dashboard',
  '/dashboard/contacts',
  '/dashboard/inbox',
  '/dashboard/email/compose',
  '/dashboard/email/templates',
  '/dashboard/email/campaigns',
  '/dashboard/email/autoresponders',
  '/dashboard/activity-log',
  '/dashboard/payments',
  '/dashboard/ai',
  '/dashboard/settings/users',
  '/dashboard/settings/tags',
  '/dashboard/settings/fields',
  '/dashboard/settings/email',
  '/dashboard/settings/feature-flags',
  '/dashboard/settings/integrations/mailgun',
  '/dashboard/settings/integrations/closebot',
];

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  try {
    // Login first
    console.log('=== LOGGING IN ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful\n');

    // Test 1: Direct URL navigation
    console.log('=== TEST 1: DIRECT URL NAVIGATION ===\n');
    for (const url of URLS_TO_TEST) {
      try {
        await page.goto(`http://localhost:3004${url}`, { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        const finalUrl = new URL(page.url()).pathname;

        if (finalUrl === url || finalUrl.startsWith(url)) {
          console.log(`[PASS] ${url}`);
          passed++;
        } else if (finalUrl === '/login') {
          console.log(`[FAIL] ${url} - Redirected to login`);
          failed++;
        } else {
          console.log(`[FAIL] ${url} - Got ${finalUrl}`);
          failed++;
        }
      } catch (err) {
        console.log(`[FAIL] ${url} - ${err.message.substring(0, 50)}`);
        failed++;
      }
    }

    // Test 2: Click navigation from sidebar
    console.log('\n=== TEST 2: CLICK NAVIGATION FROM SIDEBAR ===\n');

    // Go to dashboard first
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForLoadState('networkidle');

    // Test clicking Contacts link
    console.log('Testing click on Contacts link...');
    const contactsLink = await page.$('a[href="/dashboard/contacts"]');
    if (contactsLink) {
      const box = await contactsLink.boundingBox();
      console.log(`  Link found at: x=${box?.x}, y=${box?.y}, w=${box?.width}, h=${box?.height}`);

      // Check if link is visible
      const isVisible = await contactsLink.isVisible();
      console.log(`  Link visible: ${isVisible}`);

      // Check link attributes
      const href = await contactsLink.getAttribute('href');
      console.log(`  Link href: ${href}`);

      // Try clicking with force
      await contactsLink.click({ force: true });
      await page.waitForTimeout(2000);

      const afterUrl = page.url();
      console.log(`  After click URL: ${afterUrl}`);

      if (afterUrl.includes('/dashboard/contacts')) {
        console.log('  [PASS] Click navigation works!');
      } else {
        console.log('  [FAIL] Click navigation did not work');

        // Check for any overlays or intercepting elements
        const overlay = await page.$('.fixed.inset-0, [class*="overlay"], [class*="modal"]');
        if (overlay) {
          console.log('  Note: Found overlay element that may be blocking clicks');
        }

        // Try JavaScript click
        console.log('  Trying JavaScript click...');
        await contactsLink.evaluate(el => el.click());
        await page.waitForTimeout(2000);
        console.log(`  After JS click URL: ${page.url()}`);
      }
    } else {
      console.log('  [FAIL] Contacts link not found in DOM');
    }

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Direct URL Navigation: ${passed}/${URLS_TO_TEST.length} passed (${((passed/URLS_TO_TEST.length)*100).toFixed(0)}%)`);
  console.log('========================================');
}

runTests().catch(console.error);
