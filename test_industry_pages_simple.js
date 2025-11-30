const { chromium } = require('playwright');

async function testSite() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  const page = await browser.newContext().then(ctx => ctx.newPage());

  // Track console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console Error: ${msg.text()}`);
    }
  });

  // First check if site is running
  console.log('Checking if site is running at http://localhost:3004...');

  try {
    const homeResponse = await page.goto('http://localhost:3004/home', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    console.log(`Homepage Status: ${homeResponse?.status()}`);
    console.log('Site is running!');

    // Test one working page
    console.log('\nTesting working page (restaurants)...');
    const restaurantsResponse = await page.goto('http://localhost:3004/industries/restaurants');
    console.log(`Restaurants page status: ${restaurantsResponse?.status()}`);

    // Test one page with 500 error
    console.log('\nTesting medical-spas page (500 error)...');
    const medicalResponse = await page.goto('http://localhost:3004/industries/medical-spas');
    console.log(`Medical Spas page status: ${medicalResponse?.status()}`);

    // Check page content for error messages
    const pageContent = await page.content();
    if (pageContent.includes('Error') || pageContent.includes('error')) {
      console.log('Error found in page content');
      // Get the error message
      const errorText = await page.locator('text=/error|Error/i').first().textContent().catch(() => null);
      if (errorText) {
        console.log(`Error message: ${errorText}`);
      }
    }

    // Test one new page with 404
    console.log('\nTesting legal-attorneys page (404 error)...');
    const legalResponse = await page.goto('http://localhost:3004/industries/legal-attorneys');
    console.log(`Legal Attorneys page status: ${legalResponse?.status()}`);

    // Check what's actually on the 404 page
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check if it's actually a Next.js 404
    const is404 = await page.locator('text=/404|not found/i').count() > 0;
    if (is404) {
      console.log('This is a 404 page');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
}

testSite().catch(console.error);