const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1500 });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));

  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(3000);

    console.log('Go to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/simple-inbox.png', fullPage: true });

    console.log('Click on Dolores Fay thread...');
    await page.click('text=Dolores Fay');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/simple-thread.png', fullPage: true });

    console.log('Click Archive button...');
    await page.click('button:has-text("Archive")');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/simple-after-archive.png', fullPage: true });

    console.log('\nRESULT:');
    console.log('Errors:', errors.length);
    console.log('Fix Successful:', errors.length === 0 ? 'YES' : 'NO');
    
    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach(e => console.log(' -', e));
    }

  } catch (e) {
    console.error('Error:', e.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/simple-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
