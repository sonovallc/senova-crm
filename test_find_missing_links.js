const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

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

    console.log('Looking for Activity Log, Payments, and AI Tools links...\n');
    
    const activityLogLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.filter(l => l.textContent.toLowerCase().includes('activity')).map(l => ({
        text: l.textContent.trim(),
        href: l.getAttribute('href'),
        visible: l.offsetParent !== null
      }));
    });
    
    const paymentsLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.filter(l => l.textContent.toLowerCase().includes('payment')).map(l => ({
        text: l.textContent.trim(),
        href: l.getAttribute('href'),
        visible: l.offsetParent !== null
      }));
    });
    
    const aiToolsLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.filter(l => l.textContent.toLowerCase().includes('ai')).map(l => ({
        text: l.textContent.trim(),
        href: l.getAttribute('href'),
        visible: l.offsetParent !== null
      }));
    });

    console.log('Activity Log links:', JSON.stringify(activityLogLinks, null, 2));
    console.log('\nPayments links:', JSON.stringify(paymentsLinks, null, 2));
    console.log('\nAI Tools links:', JSON.stringify(aiToolsLinks, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
