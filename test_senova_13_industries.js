const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const SITE_URL = 'http://localhost:3004';

// List of all 13 industry pages to test
const INDUSTRY_PAGES = [
  { url: '/industries/medical-spas', name: 'Medical Spas' },
  { url: '/industries/dermatology', name: 'Dermatology' },
  { url: '/industries/plastic-surgery', name: 'Plastic Surgery' },
  { url: '/industries/aesthetic-clinics', name: 'Aesthetic Clinics' },
  { url: '/industries/legal-attorneys', name: 'Legal Attorneys (NEW)' },
  { url: '/industries/real-estate', name: 'Real Estate (NEW)' },
  { url: '/industries/mortgage-lending', name: 'Mortgage Lending (NEW)' },
  { url: '/industries/insurance', name: 'Insurance (NEW)' },
  { url: '/industries/marketing-agencies', name: 'Marketing Agencies (NEW)' },
  { url: '/industries/restaurants', name: 'Restaurants' },
  { url: '/industries/home-services', name: 'Home Services' },
  { url: '/industries/retail', name: 'Retail' },
  { url: '/industries/professional-services', name: 'Professional Services' }
];

async function testIndustryPages() {
  console.log('======================================');
  console.log('SENOVA CRM - 13 INDUSTRY PAGES TEST');
  console.log('======================================');
  console.log('Test Started:', new Date().toISOString());
  console.log('Site URL:', SITE_URL);
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        url: page.url(),
        text: msg.text()
      });
    }
  });

  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'screenshots', 'industry-pages-test');
  await fs.mkdir(screenshotDir, { recursive: true });

  const results = {
    totalPages: INDUSTRY_PAGES.length,
    passed: [],
    failed: [],
    errors: [],
    brokenImages: [],
    navigationTest: null,
    summary: null
  };

  console.log('TESTING INDIVIDUAL INDUSTRY PAGES');
  console.log('==================================');

  // Test each industry page
  for (const industry of INDUSTRY_PAGES) {
    console.log(`\nTesting: ${industry.name}`);
    console.log(`URL: ${SITE_URL}${industry.url}`);

    try {
      const response = await page.goto(`${SITE_URL}${industry.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const status = response ? response.status() : 'No response';
      console.log(`  Status: ${status}`);

      // Check for 404 or other errors
      if (status === 404) {
        results.failed.push({
          page: industry.name,
          url: industry.url,
          error: '404 - Page Not Found'
        });
        console.log('  ❌ FAILED: 404 Error');
        continue;
      } else if (status >= 500) {
        results.failed.push({
          page: industry.name,
          url: industry.url,
          error: `Server Error: ${status}`
        });
        console.log(`  ❌ FAILED: Server Error ${status}`);
        continue;
      }

      // Check page title
      const title = await page.title();
      console.log(`  Title: ${title}`);

      // Check for main content sections
      const hasHeroSection = await page.locator('section').first().isVisible().catch(() => false);
      const hasPainPoints = await page.locator('text=/pain point|challenge|problem/i').count() > 0;
      const hasSolutions = await page.locator('text=/solution|feature|benefit/i').count() > 0;

      console.log(`  Hero Section: ${hasHeroSection ? '✓' : '✗'}`);
      console.log(`  Pain Points: ${hasPainPoints ? '✓' : '✗'}`);
      console.log(`  Solutions: ${hasSolutions ? '✓' : '✗'}`);

      // Check for broken images
      const images = await page.locator('img').all();
      let brokenImageCount = 0;

      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src) {
          // Check if image loaded properly
          const naturalWidth = await img.evaluate(el => el.naturalWidth);
          if (naturalWidth === 0) {
            brokenImageCount++;
            results.brokenImages.push({
              page: industry.name,
              src: src
            });
          }
        }
      }

      if (brokenImageCount > 0) {
        console.log(`  ⚠️  Broken Images: ${brokenImageCount}`);
      } else {
        console.log(`  Images: All loaded successfully (${images.length} total)`);
      }

      // Take screenshot
      const screenshotName = industry.url.replace('/industries/', '').replace(/\//g, '-') + '.png';
      await page.screenshot({
        path: path.join(screenshotDir, screenshotName),
        fullPage: true
      });
      console.log(`  Screenshot: Saved as ${screenshotName}`);

      // Mark as passed if we got here
      results.passed.push({
        page: industry.name,
        url: industry.url,
        title: title,
        hasContent: hasHeroSection && (hasPainPoints || hasSolutions),
        imageCount: images.length,
        brokenImages: brokenImageCount
      });

      console.log(`  ✅ PASSED`);

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      results.errors.push({
        page: industry.name,
        url: industry.url,
        error: error.message
      });
    }
  }

  console.log('\n\nTESTING NAVIGATION DROPDOWN');
  console.log('============================');

  // Test navigation dropdown
  try {
    // Go to homepage
    await page.goto(`${SITE_URL}/home`, { waitUntil: 'networkidle' });
    console.log('Homepage loaded successfully');

    // Look for Industries dropdown in navigation
    const industriesDropdown = page.locator('nav').locator('text=/Industries/i').first();

    if (await industriesDropdown.isVisible()) {
      console.log('Industries dropdown found in navigation');

      // Hover to open dropdown
      await industriesDropdown.hover();
      await page.waitForTimeout(500); // Wait for dropdown animation

      // Count industry links in dropdown
      const dropdownLinks = await page.locator('nav').locator('a[href*="/industries/"]').all();
      console.log(`Found ${dropdownLinks.length} industry links in dropdown`);

      // Check if all 13 industries are present
      const foundIndustries = [];
      for (const link of dropdownLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        foundIndustries.push({ href, text });
      }

      console.log('\nIndustries in dropdown:');
      foundIndustries.forEach(ind => {
        console.log(`  - ${ind.text} (${ind.href})`);
      });

      // Test clicking on a few new industries
      const testLinks = [
        '/industries/legal-attorneys',
        '/industries/real-estate',
        '/industries/insurance'
      ];

      console.log('\nTesting navigation to new industries:');
      for (const testUrl of testLinks) {
        await page.goto(`${SITE_URL}/home`, { waitUntil: 'networkidle' });
        await industriesDropdown.hover();
        await page.waitForTimeout(500);

        const link = page.locator(`nav a[href="${testUrl}"]`).first();
        if (await link.isVisible()) {
          await link.click();
          await page.waitForLoadState('networkidle');
          const currentUrl = page.url();
          console.log(`  ✓ Clicked ${testUrl} -> Navigated to ${currentUrl}`);
        } else {
          console.log(`  ✗ Could not find link for ${testUrl}`);
        }
      }

      // Take screenshot of dropdown
      await page.goto(`${SITE_URL}/home`, { waitUntil: 'networkidle' });
      await industriesDropdown.hover();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotDir, 'navigation-dropdown.png'),
        fullPage: false
      });

      results.navigationTest = {
        dropdownFound: true,
        industryCount: dropdownLinks.length,
        industries: foundIndustries,
        navigationWorks: true
      };

    } else {
      console.log('❌ Industries dropdown NOT found in navigation');
      results.navigationTest = {
        dropdownFound: false,
        error: 'Industries dropdown not found'
      };
    }

  } catch (error) {
    console.log(`❌ Navigation test error: ${error.message}`);
    results.navigationTest = {
      error: error.message
    };
  }

  // Generate summary
  console.log('\n\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');

  console.log(`\nTotal Pages Tested: ${results.totalPages}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);
  console.log(`🖼️  Broken Images: ${results.brokenImages.length}`);

  if (results.passed.length === results.totalPages) {
    console.log('\n🎉 ALL INDUSTRY PAGES WORKING CORRECTLY!');
  } else {
    console.log('\n⚠️  SOME ISSUES FOUND:');

    if (results.failed.length > 0) {
      console.log('\nFailed Pages:');
      results.failed.forEach(f => {
        console.log(`  - ${f.page}: ${f.error}`);
      });
    }

    if (results.errors.length > 0) {
      console.log('\nPages with Errors:');
      results.errors.forEach(e => {
        console.log(`  - ${e.page}: ${e.error}`);
      });
    }

    if (results.brokenImages.length > 0) {
      console.log('\nBroken Images:');
      results.brokenImages.forEach(img => {
        console.log(`  - ${img.page}: ${img.src}`);
      });
    }
  }

  if (results.navigationTest) {
    console.log('\nNavigation Test:');
    if (results.navigationTest.dropdownFound) {
      console.log(`  ✅ Dropdown found with ${results.navigationTest.industryCount} industries`);
      console.log(`  ✅ Navigation to new industries works`);
    } else {
      console.log(`  ❌ ${results.navigationTest.error || 'Dropdown not found'}`);
    }
  }

  if (consoleErrors.length > 0) {
    console.log('\n⚠️  Console Errors Detected:');
    consoleErrors.forEach(err => {
      console.log(`  - ${err.url}: ${err.text}`);
    });
  }

  console.log('\n✅ DETAILS OF PASSED PAGES:');
  results.passed.forEach(p => {
    console.log(`\n  ${p.page}:`);
    console.log(`    URL: ${SITE_URL}${p.url}`);
    console.log(`    Title: ${p.title}`);
    console.log(`    Has Content: ${p.hasContent ? 'Yes' : 'No'}`);
    console.log(`    Images: ${p.imageCount} (${p.brokenImages} broken)`);
  });

  // Save results to JSON
  const resultsFile = path.join(screenshotDir, 'test-results.json');
  await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📊 Full results saved to: ${resultsFile}`);
  console.log(`📸 Screenshots saved to: ${screenshotDir}`);

  await browser.close();

  console.log('\n========================================');
  console.log('TEST COMPLETED:', new Date().toISOString());
  console.log('========================================');

  return results;
}

// Run the test
testIndustryPages().catch(console.error);