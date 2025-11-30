const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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

    console.log('Current URL:', page.url());
    
    const allLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.map(link => ({
        href: link.getAttribute('href'),
        text: link.textContent.trim(),
        visible: link.offsetParent !== null
      }));
    });
    
    console.log('\nAll navigation links found:');
    allLinks.forEach(link => {
      if (link.href && link.href.startsWith('/')) {
        console.log('  href="' + link.href + '" text="' + link.text + '" visible=' + link.visible);
      }
    });
    
    const screenshotPath = path.join(__dirname, 'testing', 'production-readiness', 'nav-inspection.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('\nScreenshot saved: ' + screenshotPath);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
