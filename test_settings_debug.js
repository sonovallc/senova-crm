const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    console.log('=== LOGGING IN ===\n');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful\n');

    // Navigate to fresh dashboard
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check what buttons exist
    console.log('=== CHECKING BUTTONS ===\n');
    const buttons = await page.$$eval('button', btns =>
      btns.map(b => ({ text: b.textContent.trim(), visible: b.offsetParent !== null }))
    );
    console.log('Buttons found:', buttons.length);
    buttons.forEach(b => console.log(`  - "${b.text}" (visible: ${b.visible})`));

    // Find and click Settings button
    console.log('\n=== CLICKING SETTINGS ===\n');
    const settingsBtn = await page.$('button:has-text("Settings")');
    if (settingsBtn) {
      console.log('Settings button found, clicking...');
      await settingsBtn.click();
      await page.waitForTimeout(1000);

      // Check what links exist now
      console.log('\n=== LINKS AFTER CLICKING SETTINGS ===\n');
      const links = await page.$$eval('a', links =>
        links.map(l => ({ href: l.getAttribute('href'), text: l.textContent.trim() }))
      );
      console.log('Links found:', links.length);
      links.forEach(l => console.log(`  - ${l.href} | "${l.text}"`));

      // Take screenshot
      await page.screenshot({ path: 'screenshots/settings_expanded.png', fullPage: true });
      console.log('\nScreenshot saved: screenshots/settings_expanded.png');

      // Specifically look for Settings submenu links
      console.log('\n=== LOOKING FOR SETTINGS SUBMENU LINKS ===\n');
      const settingsLinks = [
        '/dashboard/settings/users',
        '/dashboard/settings/tags',
        '/dashboard/settings/fields',
        '/dashboard/settings/email',
        '/dashboard/settings/integrations/mailgun',
        '/dashboard/settings/integrations/closebot',
      ];

      for (const href of settingsLinks) {
        const link = await page.$(`a[href="${href}"]`);
        if (link) {
          const text = await link.textContent();
          console.log(`[FOUND] ${href} - "${text.trim()}"`);
        } else {
          console.log(`[NOT FOUND] ${href}`);
        }
      }

    } else {
      console.log('ERROR: Settings button NOT found!');
    }

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }
}

runTests();
