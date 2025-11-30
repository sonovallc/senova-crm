const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch({ headless: false }); // Non-headless to observe
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  try {
    // Login
    console.log('=== LOGGING IN ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful, on:', page.url());

    // Take screenshot of initial dashboard
    await page.screenshot({ path: 'screenshots/nav_debug_01_dashboard.png', fullPage: true });

    // Get all anchor elements and their properties
    console.log('\n=== ANALYZING SIDEBAR LINKS ===\n');

    const linksInfo = await page.evaluate(() => {
      const links = document.querySelectorAll('nav a, aside a, [class*="sidebar"] a');
      return Array.from(links).map(link => ({
        href: link.getAttribute('href'),
        text: link.textContent?.trim(),
        tagName: link.tagName,
        className: link.className,
        parentClasses: link.parentElement?.className || '',
        computedPointerEvents: window.getComputedStyle(link).pointerEvents,
        computedDisplay: window.getComputedStyle(link).display,
        computedVisibility: window.getComputedStyle(link).visibility,
        hasOnClick: link.onclick !== null,
        rect: link.getBoundingClientRect(),
      }));
    });

    console.log('Found', linksInfo.length, 'links in sidebar area\n');
    for (const link of linksInfo) {
      console.log(`Link: ${link.text}`);
      console.log(`  href: ${link.href}`);
      console.log(`  pointerEvents: ${link.computedPointerEvents}`);
      console.log(`  display: ${link.computedDisplay}`);
      console.log(`  rect: x=${link.rect.x.toFixed(0)}, y=${link.rect.y.toFixed(0)}, w=${link.rect.width.toFixed(0)}, h=${link.rect.height.toFixed(0)}`);
      console.log('');
    }

    // Check for overlays
    console.log('=== CHECKING FOR OVERLAYS ===\n');
    const overlays = await page.evaluate(() => {
      const fixedElements = document.querySelectorAll('.fixed, [style*="position: fixed"], [style*="position:fixed"]');
      return Array.from(fixedElements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        rect: el.getBoundingClientRect(),
        zIndex: window.getComputedStyle(el).zIndex,
        pointerEvents: window.getComputedStyle(el).pointerEvents,
      }));
    });

    console.log('Found', overlays.length, 'fixed/overlay elements');
    for (const o of overlays) {
      console.log(`  ${o.tagName}.${o.className.slice(0, 50)} - z:${o.zIndex}, pointer:${o.pointerEvents}`);
    }

    // Try clicking with detailed debugging
    console.log('\n=== TRYING CLICK ON CONTACTS ===\n');

    const contactsLink = await page.$('a[href="/dashboard/contacts"]');
    if (contactsLink) {
      // Add click listener to see if click actually fires
      await page.evaluate(() => {
        const link = document.querySelector('a[href="/dashboard/contacts"]');
        if (link) {
          link.addEventListener('click', (e) => {
            console.log('CLICK EVENT FIRED on contacts link!', e.defaultPrevented ? 'PREVENTED' : 'NOT PREVENTED');
          }, true);
        }
      });

      console.log('Clicking contacts link...');
      await contactsLink.click();
      await page.waitForTimeout(3000);

      console.log('URL after click:', page.url());
      await page.screenshot({ path: 'screenshots/nav_debug_02_after_click.png', fullPage: true });

      // Try using keyboard navigation
      console.log('\nTrying keyboard navigation (Tab + Enter)...');
      await page.goto('http://localhost:3004/dashboard');
      await page.waitForLoadState('networkidle');

      // Focus on the contacts link and press Enter
      await contactsLink.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      console.log('URL after Enter:', page.url());
    }

    // Keep browser open for 5 seconds to observe
    await page.waitForTimeout(5000);

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
