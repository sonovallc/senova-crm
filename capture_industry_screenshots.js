const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function captureScreenshots() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots', 'industry-pages-evidence');
  await fs.mkdir(screenshotDir, { recursive: true });

  const pagesToCapture = [
    // Working pages
    { url: '/home', name: '01-homepage' },
    { url: '/industries/restaurants', name: '02-restaurants-working' },
    { url: '/industries/home-services', name: '03-home-services-working' },
    { url: '/industries/retail', name: '04-retail-working' },
    { url: '/industries/professional-services', name: '05-professional-services-working' },

    // Error pages
    { url: '/industries/medical-spas', name: '06-medical-spas-500-error' },
    { url: '/industries/legal-attorneys', name: '07-legal-attorneys-404-error' },
  ];

  for (const pageInfo of pagesToCapture) {
    try {
      console.log(`Capturing ${pageInfo.name}...`);
      const response = await page.goto(`http://localhost:3004${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      const status = response?.status();

      await page.screenshot({
        path: path.join(screenshotDir, `${pageInfo.name}-status-${status}.png`),
        fullPage: status === 200
      });

      console.log(`  ✓ Captured (Status: ${status})`);

    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }

  // Try to capture the navigation dropdown
  console.log('\nCapturing navigation dropdown...');
  try {
    await page.goto('http://localhost:3004/home', { waitUntil: 'networkidle' });

    // Look for Industries in nav
    const industriesLink = page.locator('nav').locator('text=/Industries/i').first();

    if (await industriesLink.isVisible()) {
      await industriesLink.hover();
      await page.waitForTimeout(500); // Wait for dropdown

      await page.screenshot({
        path: path.join(screenshotDir, '08-navigation-dropdown.png'),
        fullPage: false
      });

      console.log('  ✓ Navigation dropdown captured');
    } else {
      console.log('  ✗ Industries dropdown not found');
    }
  } catch (error) {
    console.log(`  ✗ Navigation error: ${error.message}`);
  }

  await browser.close();

  console.log(`\n📸 Screenshots saved to: ${screenshotDir}`);
}

captureScreenshots().catch(console.error);