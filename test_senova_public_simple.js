const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Simplified list focusing on core pages first
const CORE_PAGES = [
  { url: '/', name: 'Home' },
  { url: '/home', name: 'Home Alt' },
  { url: '/platform', name: 'Platform' },
  { url: '/pricing', name: 'Pricing' },
  { url: '/about', name: 'About' },
  { url: '/contact', name: 'Contact' },
  { url: '/solutions/crm', name: 'CRM Solution' },
  { url: '/login', name: 'Login' },
  { url: '/register', name: 'Register' }
];

async function testSenovaPages() {
  console.log('=====================================');
  console.log('SENOVA CRM WEBSITE - SIMPLIFIED AUDIT');
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: false,
    timeout: 30000
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots', 'senova-simple');
  await fs.mkdir(screenshotsDir, { recursive: true });

  const results = [];

  for (const testPage of CORE_PAGES) {
    const fullUrl = `http://localhost:3004${testPage.url}`;
    console.log(`\nTesting: ${testPage.name} (${testPage.url})`);

    const result = {
      url: testPage.url,
      name: testPage.name,
      status: 'UNKNOWN',
      issues: []
    };

    // Capture console messages
    const messages = [];
    const errorHandler = msg => {
      if (msg.type() === 'error') {
        messages.push(msg.text());
      }
    };
    page.on('console', errorHandler);

    try {
      // Try to navigate with shorter timeout
      const response = await page.goto(fullUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      if (!response) {
        console.log('  ❌ No response received');
        result.status = 'NO_RESPONSE';
      } else if (response.status() === 404) {
        console.log('  ❌ 404 Page Not Found');
        result.status = '404';
        result.issues.push('Page not found');
      } else if (response.status() >= 500) {
        console.log(`  ❌ Server Error (${response.status()})`);
        result.status = 'SERVER_ERROR';
        result.issues.push(`Server error ${response.status()}`);
      } else if (response.status() === 200) {
        console.log('  ✅ Page loaded successfully (200)');
        result.status = 'SUCCESS';

        // Wait a bit for content to load
        await page.waitForTimeout(2000);

        // Take screenshot
        try {
          const screenshotName = `${testPage.url.replace(/\//g, '_').substring(1) || 'home'}.png`;
          await page.screenshot({
            path: path.join(screenshotsDir, screenshotName),
            fullPage: false // Just viewport for speed
          });
          console.log('  📸 Screenshot captured');
        } catch (e) {
          console.log('  ⚠ Screenshot failed');
        }

        // Quick content check
        const title = await page.title();
        console.log(`  📄 Page title: "${title}"`);

        // Check for basic elements
        const hasHeader = await page.$('header');
        const hasFooter = await page.$('footer');
        const hasMain = await page.$('main, #main, .main');

        console.log(`  🔍 Structure: Header=${!!hasHeader}, Footer=${!!hasFooter}, Main=${!!hasMain}`);

        // Check for purple/green colors (simplified)
        const hasPurple = await page.evaluate(() => {
          const body = document.body;
          const bgColor = window.getComputedStyle(body).backgroundColor;
          return bgColor.includes('128') || bgColor.includes('purple');
        });

        if (hasPurple) {
          console.log('  ⚠ Purple color detected in background');
          result.issues.push('Purple color present');
        }

        // Check console errors
        if (messages.length > 0) {
          console.log(`  ⚠ Console errors: ${messages.length}`);
          result.issues.push(`${messages.length} console errors`);
        }

        // Special test for login page
        if (testPage.url === '/login') {
          const emailInput = await page.$('input[type="email"]');
          const passwordInput = await page.$('input[type="password"]');
          const submitButton = await page.$('button[type="submit"]');

          console.log(`  📝 Login form: Email=${!!emailInput}, Password=${!!passwordInput}, Submit=${!!submitButton}`);

          if (emailInput && passwordInput) {
            try {
              await emailInput.fill('admin@evebeautyma.com');
              await passwordInput.fill('TestPass123!');
              console.log('  ✅ Login form filled successfully');
            } catch (e) {
              console.log('  ⚠ Could not fill login form');
            }
          }
        }

        // Special test for contact page
        if (testPage.url === '/contact') {
          const contactForm = await page.$('form');
          console.log(`  📝 Contact form present: ${!!contactForm}`);
        }

      } else {
        console.log(`  ⚠ Unexpected status: ${response.status()}`);
        result.status = `STATUS_${response.status()}`;
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message.substring(0, 100)}`);
      result.status = 'ERROR';
      result.issues.push(error.message.substring(0, 50));
    }

    // Clean up listeners
    page.removeAllListeners('console');

    results.push(result);
  }

  // Summary
  console.log('\n=====================================');
  console.log('SUMMARY');
  console.log('=====================================\n');

  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const notFound = results.filter(r => r.status === '404').length;
  const errors = results.filter(r => r.status === 'ERROR' || r.status === 'SERVER_ERROR').length;

  console.log(`Total Pages Tested: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ 404 Not Found: ${notFound}`);
  console.log(`⚠ Errors: ${errors}`);

  console.log('\nPage Details:');
  results.forEach(r => {
    const icon = r.status === 'SUCCESS' ? '✅' : '❌';
    const issueText = r.issues.length > 0 ? ` [${r.issues.join(', ')}]` : '';
    console.log(`${icon} ${r.name}: ${r.status}${issueText}`);
  });

  await browser.close();

  return results;
}

testSenovaPages()
  .then(results => {
    const successful = results.filter(r => r.status === 'SUCCESS').length;
    console.log(`\n✅ Test Complete: ${successful}/${results.length} pages working`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });