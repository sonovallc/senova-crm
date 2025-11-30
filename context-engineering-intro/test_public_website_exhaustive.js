const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Screenshot directory
const SCREENSHOT_DIR = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\public-website-debug';

// All 22 pages to test
const PAGES_TO_TEST = [
  // Core Pages (5)
  { name: 'home', url: '/' },
  { name: 'platform', url: '/platform' },
  { name: 'pricing', url: '/pricing' },
  { name: 'about', url: '/about' },
  { name: 'contact', url: '/contact' },

  // Solution Pages (5)
  { name: 'crm', url: '/solutions/crm' },
  { name: 'audience-intelligence', url: '/solutions/audience-intelligence' },
  { name: 'patient-identification', url: '/solutions/patient-identification' },
  { name: 'campaign-activation', url: '/solutions/campaign-activation' },
  { name: 'analytics', url: '/solutions/analytics' },

  // Industry Pages (4)
  { name: 'medical-spas', url: '/industries/medical-spas' },
  { name: 'dermatology', url: '/industries/dermatology' },
  { name: 'plastic-surgery', url: '/industries/plastic-surgery' },
  { name: 'aesthetic-clinics', url: '/industries/aesthetic-clinics' },

  // Legal Pages (4)
  { name: 'privacy-policy', url: '/privacy-policy' },
  { name: 'terms-of-service', url: '/terms-of-service' },
  { name: 'hipaa', url: '/hipaa' },
  { name: 'security', url: '/security' },

  // Placeholder Pages (4)
  { name: 'blog', url: '/blog' },
  { name: 'case-studies', url: '/case-studies' },
  { name: 'roi-calculator', url: '/roi-calculator' },
  { name: 'docs', url: '/docs' }
];

const testResults = {
  totalPages: 22,
  pagesLoaded: 0,
  pagesFailed: 0,
  totalElements: 0,
  elementsClicked: 0,
  elementsFailed: 0,
  brokenLinks: [],
  brokenImages: [],
  contentViolations: [],
  consoleErrors: [],
  mobileIssues: [],
  pageDetails: {}
};

async function testPage(page, pageInfo, index) {
  const pageResult = {
    url: pageInfo.url,
    name: pageInfo.name,
    loadStatus: 'pending',
    screenshots: [],
    clickableElements: [],
    errors: [],
    consoleErrors: [],
    contentViolations: [],
    brokenImages: [],
    testResults: []
  };

  console.log(`\n[${index + 1}/22] Testing ${pageInfo.name} (${pageInfo.url})...`);

  // Capture console errors
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleMessages.push(`Page error: ${error.message}`);
  });

  try {
    // Navigate to page
    console.log(`  → Navigating to http://localhost:3004${pageInfo.url}`);
    const response = await page.goto(`http://localhost:3004${pageInfo.url}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check response status
    if (response && response.status() === 404) {
      pageResult.loadStatus = '404';
      pageResult.errors.push('Page returned 404 Not Found');
      testResults.pagesFailed++;
    } else if (response && response.status() >= 500) {
      pageResult.loadStatus = `Error ${response.status()}`;
      pageResult.errors.push(`Page returned server error ${response.status()}`);
      testResults.pagesFailed++;
    } else {
      pageResult.loadStatus = 'success';
      testResults.pagesLoaded++;
    }

    // Screenshot full page
    const fullPageScreenshot = path.join(SCREENSHOT_DIR, `${pageInfo.name}_full-page_loaded.png`);
    await page.screenshot({ path: fullPageScreenshot, fullPage: true });
    pageResult.screenshots.push(`${pageInfo.name}_full-page_loaded.png`);
    console.log(`  ✓ Screenshot: full page`);

    // Check for content violations
    const pageContent = await page.content();

    // Check for "Eve" branding (should be "Senova")
    if (pageContent.includes('Eve CRM') || pageContent.includes('Eve AI')) {
      const violations = pageContent.match(/Eve\s+(CRM|AI|Platform)/gi) || [];
      violations.forEach(v => {
        pageResult.contentViolations.push(`Found "${v}" - should be "Senova"`);
        testResults.contentViolations.push({ page: pageInfo.name, violation: v });
      });
    }

    // Check for "SOC 2 Certified" (should be "SOC 2 Compliant")
    if (pageContent.includes('SOC 2 Certified')) {
      pageResult.contentViolations.push('Found "SOC 2 Certified" - should be "SOC 2 Compliant"');
      testResults.contentViolations.push({ page: pageInfo.name, violation: 'SOC 2 Certified' });
    }

    // Check for specific claims
    const dollarClaims = pageContent.match(/\$\d+[KkMm]/g) || [];
    const percentClaims = pageContent.match(/\d+%|\d+X\s+ROI/g) || [];

    dollarClaims.forEach(claim => {
      pageResult.contentViolations.push(`Specific dollar claim found: ${claim}`);
      testResults.contentViolations.push({ page: pageInfo.name, violation: claim });
    });

    percentClaims.forEach(claim => {
      pageResult.contentViolations.push(`Specific percentage claim found: ${claim}`);
      testResults.contentViolations.push({ page: pageInfo.name, violation: claim });
    });

    // Find all clickable elements
    const links = await page.$$('a');
    const buttons = await page.$$('button');
    const clickableSpans = await page.$$('span[onclick], span[role="button"]');
    const clickableDivs = await page.$$('div[onclick], div[role="button"]');

    console.log(`  → Found ${links.length} links, ${buttons.length} buttons`);
    testResults.totalElements += links.length + buttons.length + clickableSpans.length + clickableDivs.length;

    // Test logo click (should go to home)
    try {
      const logo = await page.$('img[alt*="Senova"], img[alt*="logo"], a[href="/"] img, .logo');
      if (logo) {
        await logo.click();
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        if (currentUrl.endsWith('/')) {
          pageResult.testResults.push({ element: 'logo', result: 'success', destination: 'home' });
        } else {
          pageResult.testResults.push({ element: 'logo', result: 'failed', error: `Logo didn't navigate to home: ${currentUrl}` });
        }
        // Go back to original page
        await page.goto(`http://localhost:3004${pageInfo.url}`, { waitUntil: 'networkidle' });
      }
    } catch (e) {
      console.log(`  ! Logo test error: ${e.message}`);
    }

    // Test all links
    for (let i = 0; i < Math.min(links.length, 10); i++) {  // Test first 10 links to avoid timeout
      try {
        const link = links[i];
        const href = await link.getAttribute('href');
        const text = await link.innerText().catch(() => '');

        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          console.log(`  → Testing link ${i + 1}/${links.length}: ${href}`);

          // Click and capture
          await link.click({ timeout: 5000 });
          await page.waitForTimeout(1000);

          const screenshotName = `${pageInfo.name}_link-${i + 1}_clicked.png`;
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, screenshotName) });
          pageResult.screenshots.push(screenshotName);

          const newUrl = page.url();
          pageResult.clickableElements.push({
            type: 'link',
            text: text.substring(0, 50),
            href: href,
            clicked: true,
            destination: newUrl
          });

          testResults.elementsClicked++;

          // Check if link is broken
          if (newUrl.includes('404') || (await page.$('text=/404/i'))) {
            testResults.brokenLinks.push({ page: pageInfo.name, link: href });
            pageResult.errors.push(`Broken link: ${href}`);
          }

          // Navigate back
          await page.goto(`http://localhost:3004${pageInfo.url}`, { waitUntil: 'networkidle' });
        }
      } catch (e) {
        console.log(`  ! Link test error: ${e.message}`);
        testResults.elementsFailed++;
      }
    }

    // Test buttons
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {  // Test first 5 buttons
      try {
        const button = buttons[i];
        const text = await button.innerText().catch(() => '');

        if (text && !text.includes('Cookie')) {  // Skip cookie consent buttons
          console.log(`  → Testing button ${i + 1}/${buttons.length}: ${text}`);

          await button.click({ timeout: 5000 });
          await page.waitForTimeout(1000);

          const screenshotName = `${pageInfo.name}_button-${i + 1}_clicked.png`;
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, screenshotName) });
          pageResult.screenshots.push(screenshotName);

          pageResult.clickableElements.push({
            type: 'button',
            text: text.substring(0, 50),
            clicked: true
          });

          testResults.elementsClicked++;
        }
      } catch (e) {
        console.log(`  ! Button test error: ${e.message}`);
        testResults.elementsFailed++;
      }
    }

    // Check for broken images
    const images = await page.$$('img');
    for (const img of images) {
      try {
        const src = await img.getAttribute('src');
        const isLoaded = await img.evaluate(node => node.complete && node.naturalHeight !== 0);

        if (!isLoaded && src) {
          pageResult.brokenImages.push(src);
          testResults.brokenImages.push({ page: pageInfo.name, image: src });
        }
      } catch (e) {
        // Image check failed
      }
    }

    // Test mobile viewport
    console.log(`  → Testing mobile viewport (375px)`);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const mobileScreenshot = path.join(SCREENSHOT_DIR, `${pageInfo.name}_mobile_375px.png`);
    await page.screenshot({ path: mobileScreenshot, fullPage: true });
    pageResult.screenshots.push(`${pageInfo.name}_mobile_375px.png`);

    // Check for mobile issues (horizontal scroll)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      pageResult.errors.push('Mobile viewport has horizontal scroll');
      testResults.mobileIssues.push({ page: pageInfo.name, issue: 'horizontal scroll' });
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Capture console errors
    pageResult.consoleErrors = consoleMessages;
    if (consoleMessages.length > 0) {
      testResults.consoleErrors.push({ page: pageInfo.name, errors: consoleMessages });
    }

  } catch (error) {
    console.log(`  ✗ Page test failed: ${error.message}`);
    pageResult.loadStatus = 'error';
    pageResult.errors.push(error.message);
    testResults.pagesFailed++;
  }

  testResults.pageDetails[pageInfo.name] = pageResult;
  return pageResult;
}

async function runExhaustiveTest() {
  console.log('=====================================');
  console.log('SENOVA CRM PUBLIC WEBSITE');
  console.log('EXHAUSTIVE DEBUG SESSION');
  console.log('=====================================');
  console.log(`Testing ${PAGES_TO_TEST.length} pages...`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  // Test each page
  for (let i = 0; i < PAGES_TO_TEST.length; i++) {
    await testPage(page, PAGES_TO_TEST[i], i);
  }

  await browser.close();

  // Generate summary
  console.log('\n=====================================');
  console.log('TEST SUMMARY');
  console.log('=====================================');
  console.log(`Pages Tested: ${testResults.totalPages}`);
  console.log(`Pages Loaded Successfully: ${testResults.pagesLoaded}`);
  console.log(`Pages Failed: ${testResults.pagesFailed}`);
  console.log(`Total Elements Found: ${testResults.totalElements}`);
  console.log(`Elements Clicked: ${testResults.elementsClicked}`);
  console.log(`Elements Failed: ${testResults.elementsFailed}`);
  console.log(`Broken Links: ${testResults.brokenLinks.length}`);
  console.log(`Broken Images: ${testResults.brokenImages.length}`);
  console.log(`Content Violations: ${testResults.contentViolations.length}`);
  console.log(`Pages with Console Errors: ${testResults.consoleErrors.length}`);
  console.log(`Mobile Issues: ${testResults.mobileIssues.length}`);

  // Save results to JSON
  await fs.writeFile(
    path.join(SCREENSHOT_DIR, 'test-results.json'),
    JSON.stringify(testResults, null, 2)
  );

  console.log('\nResults saved to test-results.json');
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  return testResults;
}

// Run the test
runExhaustiveTest().catch(console.error);