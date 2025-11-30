const { chromium } = require('playwright');

async function test() {
  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Step 1: Navigate to admin login');
    await page.goto('http://localhost:3004/admin/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    console.log('Step 2: Login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    console.log('Step 3: Wait for dashboard');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('Step 4: Navigate to campaigns');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('domcontentloaded');

    console.log('Step 5: Wait 5 seconds for API');
    await page.waitForTimeout(5000);

    console.log('Step 6: Take screenshot');
    await page.screenshot({ 
      path: 'screenshots/campaigns-verify.png', 
      fullPage: true 
    });

    console.log('Step 7: Check content');
    const text = await page.evaluate(() => document.body.innerText);
    const hasNetworkError = text.includes('Network Error');

    console.log('\n==========================================');
    console.log('VERIFICATION RESULT');
    console.log('==========================================');
    console.log('Has "Network Error":', hasNetworkError);
    console.log('\nPage content preview:');
    console.log(text.substring(0, 500));
    console.log('==========================================\n');

  } catch (error) {
    console.error('\nTEST FAILED:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

test();
