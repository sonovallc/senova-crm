const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3004/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', 'admin@evebeautyma.com');
  await page.fill('input[name="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  console.log('Logged in, URL:', page.url());

  // Get all links on the page
  const links = await page.evaluate(() => {
    const allLinks = document.querySelectorAll('a');
    return Array.from(allLinks).map(a => ({
      href: a.getAttribute('href'),
      text: (a.textContent || '').trim().substring(0, 50),
      visible: a.offsetParent !== null
    }));
  });

  console.log('\nAll links on page (' + links.length + '):');
  for (const l of links) {
    console.log('  href:', l.href, '| text:', l.text, '| visible:', l.visible);
  }

  // Get all buttons
  const buttons = await page.evaluate(() => {
    const allBtns = document.querySelectorAll('button');
    return Array.from(allBtns).map(b => ({
      text: (b.textContent || '').trim().substring(0, 50),
      visible: b.offsetParent !== null
    }));
  });

  console.log('\nAll buttons on page (' + buttons.length + '):');
  for (const b of buttons) {
    console.log('  text:', b.text, '| visible:', b.visible);
  }

  // Check the sidebar element specifically
  const sidebarHTML = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    return nav ? nav.innerHTML.substring(0, 3000) : 'NAV NOT FOUND';
  });

  console.log('\nSidebar nav HTML (first 3000 chars):');
  console.log(sidebarHTML);

  // Take a screenshot
  await page.screenshot({ path: 'screenshots/sidebar_debug.png', fullPage: true });
  console.log('\nScreenshot saved: screenshots/sidebar_debug.png');

  await browser.close();
})();
