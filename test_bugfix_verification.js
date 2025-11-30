const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testBugfixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  if (\!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const results = { test1: false, test2: false, test3: false, test4: false };
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));

  try {
    await page.goto('http://localhost:3004/auth/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123\!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('[TEST 1] Loading campaigns page...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-bugfix-01-campaigns-page.png'), fullPage: true });
    results.test1 = (await page.locator('h1:has-text("Email Campaigns")').count()) > 0;
    console.log('Test 1:', results.test1 ? 'PASS' : 'FAIL');

    console.log('[TEST 2] Clicking Create Campaign...');
    await page.locator('button:has-text("Create Campaign")').first().click();
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-bugfix-02-wizard-no-error.png'), fullPage: true });
    const buildError = await page.locator('text=Build Error').count();
    const syntaxError = await page.locator('text=Unexpected token').count();
    results.test2 = buildError === 0 && syntaxError === 0;
    console.log('Test 2 (BUG-003):', results.test2 ? 'PASS - No build error' : 'FAIL - Build error present');
    console.log('URL:', page.url());

    console.log('[TEST 3] Checking variable hints...');
    const content = await page.content();
    results.test3 = content.includes('contact_name') && content.includes('{{');
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-bugfix-03-variable-hints.png'), fullPage: true });
    console.log('Test 3:', results.test3 ? 'PASS' : 'PARTIAL');

    console.log('[TEST 4] Checking console errors...');
    const errors = consoleMessages.filter(m => m.text.includes('@radix-ui/react-progress') || m.text.includes('JSX'));
    results.test4 = errors.length === 0;
    console.log('Test 4 (BUG-004):', results.test4 ? 'PASS' : 'FAIL', '- Errors:', errors.length);
    if (\!results.test4) errors.slice(0, 5).forEach(e => console.log('  ERROR:', e.text));

    console.log('\n=== SUMMARY ===');
    console.log('BUG-003 (JSX Syntax):', results.test2 ? 'FIXED' : 'NOT FIXED');
    console.log('BUG-004 (Dependency):', results.test4 ? 'FIXED' : 'NOT FIXED');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

testBugfixes().catch(console.error);
