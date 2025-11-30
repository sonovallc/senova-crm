const { chromium } = require('playwright');

async function quickCheck() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const pages = [
    '/',
    '/platform',
    '/pricing',
    '/about',
    '/contact',
    '/solutions/crm',
    '/solutions/audience-intelligence',
    '/solutions/patient-identification',
    '/solutions/campaign-activation',
    '/solutions/analytics',
    '/industries/medical-spas',
    '/industries/dermatology',
    '/industries/plastic-surgery',
    '/industries/aesthetic-clinics',
    '/privacy-policy',
    '/terms-of-service',
    '/hipaa',
    '/security',
    '/blog',
    '/case-studies',
    '/roi-calculator',
    '/docs'
  ];

  console.log('Quick Site Check - Senova CRM\n');

  let success = 0;
  let failed = 0;
  let placeholder = 0;

  for (const url of pages) {
    try {
      const response = await page.goto(`http://localhost:3004${url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      const status = response ? response.status() : 'no-response';
      const text = await page.evaluate(() => document.body?.innerText || '');

      if (status === 404) {
        console.log(`✗ ${url} - 404 Not Found`);
        failed++;
      } else if (status >= 500) {
        console.log(`✗ ${url} - Server Error ${status}`);
        failed++;
      } else if (text.includes('Coming Soon') || text.includes('under construction')) {
        console.log(`⚠ ${url} - Placeholder page`);
        placeholder++;
      } else {
        console.log(`✓ ${url} - OK`);
        success++;
      }
    } catch (e) {
      console.log(`✗ ${url} - Error: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nSummary: ${success} OK, ${placeholder} Placeholder, ${failed} Failed`);

  await browser.close();
}

quickCheck();