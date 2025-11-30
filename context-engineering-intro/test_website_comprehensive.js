const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Screenshot directory
const SCREENSHOT_DIR = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\public-website-debug';

// All 22 pages to test
const PAGES_TO_TEST = [
  // Core Pages (5)
  { name: 'home', url: '/', category: 'Core' },
  { name: 'platform', url: '/platform', category: 'Core' },
  { name: 'pricing', url: '/pricing', category: 'Core' },
  { name: 'about', url: '/about', category: 'Core' },
  { name: 'contact', url: '/contact', category: 'Core' },

  // Solution Pages (5)
  { name: 'crm', url: '/solutions/crm', category: 'Solutions' },
  { name: 'audience-intelligence', url: '/solutions/audience-intelligence', category: 'Solutions' },
  { name: 'patient-identification', url: '/solutions/patient-identification', category: 'Solutions' },
  { name: 'campaign-activation', url: '/solutions/campaign-activation', category: 'Solutions' },
  { name: 'analytics', url: '/solutions/analytics', category: 'Solutions' },

  // Industry Pages (4)
  { name: 'medical-spas', url: '/industries/medical-spas', category: 'Industries' },
  { name: 'dermatology', url: '/industries/dermatology', category: 'Industries' },
  { name: 'plastic-surgery', url: '/industries/plastic-surgery', category: 'Industries' },
  { name: 'aesthetic-clinics', url: '/industries/aesthetic-clinics', category: 'Industries' },

  // Legal Pages (4)
  { name: 'privacy-policy', url: '/privacy-policy', category: 'Legal' },
  { name: 'terms-of-service', url: '/terms-of-service', category: 'Legal' },
  { name: 'hipaa', url: '/hipaa', category: 'Legal' },
  { name: 'security', url: '/security', category: 'Legal' },

  // Placeholder Pages (4)
  { name: 'blog', url: '/blog', category: 'Placeholder' },
  { name: 'case-studies', url: '/case-studies', category: 'Placeholder' },
  { name: 'roi-calculator', url: '/roi-calculator', category: 'Placeholder' },
  { name: 'docs', url: '/docs', category: 'Placeholder' }
];

async function testComprehensive() {
  console.log('=====================================');
  console.log('SENOVA CRM PUBLIC WEBSITE');
  console.log('COMPREHENSIVE VERIFICATION');
  console.log('=====================================');
  console.log(`Testing ${PAGES_TO_TEST.length} pages...\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  const results = {
    summary: {
      totalPages: PAGES_TO_TEST.length,
      successfulLoads: 0,
      failedLoads: 0,
      pagesWithErrors: 0,
      contentViolations: [],
      brokenLinks: [],
      consoleErrors: [],
      placeholderPages: [],
      incompletePages: []
    },
    pageDetails: {},
    navigation: {
      headerLinks: [],
      footerLinks: [],
      brokenNavLinks: []
    }
  };

  // Test each page
  for (let i = 0; i < PAGES_TO_TEST.length; i++) {
    const pageInfo = PAGES_TO_TEST[i];
    console.log(`[${i + 1}/${PAGES_TO_TEST.length}] Testing ${pageInfo.category}: ${pageInfo.name} (${pageInfo.url})`);

    const pageResult = {
      name: pageInfo.name,
      url: pageInfo.url,
      category: pageInfo.category,
      status: 'pending',
      loadTime: 0,
      issues: [],
      contentChecks: {},
      stats: {}
    };

    const startTime = Date.now();

    // Capture console errors
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    try {
      // Navigate to page
      const response = await page.goto(`http://localhost:3004${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      pageResult.loadTime = Date.now() - startTime;

      // Check response status
      if (!response) {
        pageResult.status = 'no-response';
        pageResult.issues.push('No response received');
        results.summary.failedLoads++;
      } else if (response.status() === 404) {
        pageResult.status = '404';
        pageResult.issues.push('Page not found (404)');
        results.summary.failedLoads++;
        console.log(`  ✗ 404 Not Found`);
      } else if (response.status() >= 500) {
        pageResult.status = `error-${response.status()}`;
        pageResult.issues.push(`Server error (${response.status()})`);
        results.summary.failedLoads++;
        console.log(`  ✗ Server Error ${response.status()}`);
      } else {
        pageResult.status = 'success';
        results.summary.successfulLoads++;
        console.log(`  ✓ Page loaded successfully (${pageResult.loadTime}ms)`);
      }

      // Get page content for analysis
      const content = await page.content();
      const textContent = await page.evaluate(() => document.body?.innerText || '');

      // Check for "Coming Soon" or placeholder content
      if (textContent.includes('Coming Soon') || textContent.includes('This page is under construction')) {
        pageResult.issues.push('Placeholder content detected');
        results.summary.placeholderPages.push(pageInfo.name);
        console.log(`  ! Placeholder page`);
      }

      // Check for minimal content (likely incomplete pages)
      const wordCount = textContent.split(/\s+/).length;
      if (wordCount < 100 && pageInfo.category !== 'Placeholder') {
        pageResult.issues.push(`Minimal content (${wordCount} words)`);
        results.summary.incompletePages.push(pageInfo.name);
        console.log(`  ! Minimal content: ${wordCount} words`);
      }

      // Content compliance checks
      // Check for "Eve" branding
      const eveMatches = content.match(/\bEve\s+(CRM|AI|Platform)\b/gi) || [];
      if (eveMatches.length > 0) {
        pageResult.issues.push(`Old branding found: ${eveMatches.join(', ')}`);
        results.summary.contentViolations.push({
          page: pageInfo.name,
          violation: `Eve branding: ${eveMatches.join(', ')}`
        });
        console.log(`  ! Content violation: Eve branding found`);
      }

      // Check for "SOC 2 Certified"
      if (content.includes('SOC 2 Certified')) {
        pageResult.issues.push('Incorrect compliance claim: "SOC 2 Certified"');
        results.summary.contentViolations.push({
          page: pageInfo.name,
          violation: 'Should be "SOC 2 Compliant" not "Certified"'
        });
        console.log(`  ! Content violation: SOC 2 Certified`);
      }

      // Check for specific claims
      const dollarClaims = content.match(/\$[\d,]+[KkMm]\b/g) || [];
      const percentClaims = content.match(/\b\d{2,}%|\b\d+X\s+ROI\b/gi) || [];

      if (dollarClaims.length > 0) {
        pageResult.issues.push(`Specific dollar claims: ${dollarClaims.join(', ')}`);
        console.log(`  ! Dollar claims: ${dollarClaims.join(', ')}`);
      }

      if (percentClaims.length > 0) {
        pageResult.issues.push(`Specific percentage claims: ${percentClaims.join(', ')}`);
        console.log(`  ! Percentage claims: ${percentClaims.join(', ')}`);
      }

      // Count page elements
      const stats = await page.evaluate(() => ({
        links: document.querySelectorAll('a').length,
        buttons: document.querySelectorAll('button').length,
        images: document.querySelectorAll('img').length,
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input, textarea, select').length,
        headers: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length
      }));

      pageResult.stats = stats;
      console.log(`  → Stats: ${stats.links} links, ${stats.buttons} buttons, ${stats.images} images`);

      // Check for broken images
      const brokenImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images
          .filter(img => !img.complete || img.naturalHeight === 0)
          .map(img => img.src || img.getAttribute('src'));
      });

      if (brokenImages.length > 0) {
        pageResult.issues.push(`${brokenImages.length} broken images`);
        console.log(`  ! ${brokenImages.length} broken images found`);
      }

      // Console errors
      if (consoleMessages.length > 0) {
        pageResult.issues.push(`${consoleMessages.length} console errors`);
        results.summary.consoleErrors.push({
          page: pageInfo.name,
          errors: consoleMessages
        });
        results.summary.pagesWithErrors++;
        console.log(`  ! ${consoleMessages.length} console errors`);
      }

      // Capture header navigation (only on first page)
      if (i === 0) {
        results.navigation.headerLinks = await page.evaluate(() => {
          const nav = document.querySelector('nav, header');
          if (nav) {
            const links = Array.from(nav.querySelectorAll('a'));
            return links.map(a => ({
              text: a.innerText.trim(),
              href: a.getAttribute('href')
            }));
          }
          return [];
        });

        results.navigation.footerLinks = await page.evaluate(() => {
          const footer = document.querySelector('footer');
          if (footer) {
            const links = Array.from(footer.querySelectorAll('a'));
            return links.map(a => ({
              text: a.innerText.trim(),
              href: a.getAttribute('href')
            }));
          }
          return [];
        });

        console.log(`  → Found ${results.navigation.headerLinks.length} header links`);
        console.log(`  → Found ${results.navigation.footerLinks.length} footer links`);
      }

      // Save screenshot for failed/problematic pages
      if (pageResult.issues.length > 0) {
        const screenshotPath = path.join(SCREENSHOT_DIR, `issue_${pageInfo.name}_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  📸 Screenshot saved: issue_${pageInfo.name}_${Date.now()}.png`);
      }

    } catch (error) {
      pageResult.status = 'error';
      pageResult.issues.push(`Test error: ${error.message}`);
      results.summary.failedLoads++;
      console.log(`  ✗ Test failed: ${error.message}`);
    }

    results.pageDetails[pageInfo.name] = pageResult;
    console.log('');
  }

  // Test navigation links
  console.log('Testing Navigation Links...');
  const allNavLinks = [...results.navigation.headerLinks, ...results.navigation.footerLinks];

  for (const link of allNavLinks) {
    if (link.href && link.href.startsWith('/')) {
      try {
        const response = await page.goto(`http://localhost:3004${link.href}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });

        if (!response || response.status() === 404) {
          results.navigation.brokenNavLinks.push({
            text: link.text,
            href: link.href
          });
          console.log(`  ✗ Broken nav link: "${link.text}" → ${link.href}`);
        }
      } catch (e) {
        // Navigation failed
      }
    }
  }

  await browser.close();

  // Generate final summary
  console.log('\n=====================================');
  console.log('FINAL SUMMARY');
  console.log('=====================================');
  console.log(`✓ Successful Loads: ${results.summary.successfulLoads}/${results.summary.totalPages}`);
  console.log(`✗ Failed Loads: ${results.summary.failedLoads}`);
  console.log(`⚠ Pages with Console Errors: ${results.summary.pagesWithErrors}`);
  console.log(`⚠ Content Violations: ${results.summary.contentViolations.length}`);
  console.log(`⚠ Placeholder Pages: ${results.summary.placeholderPages.length}`);
  console.log(`⚠ Incomplete Pages: ${results.summary.incompletePages.length}`);
  console.log(`⚠ Broken Navigation Links: ${results.navigation.brokenNavLinks.length}`);

  if (results.summary.placeholderPages.length > 0) {
    console.log(`\nPlaceholder Pages: ${results.summary.placeholderPages.join(', ')}`);
  }

  if (results.summary.incompletePages.length > 0) {
    console.log(`\nIncomplete Pages: ${results.summary.incompletePages.join(', ')}`);
  }

  if (results.navigation.brokenNavLinks.length > 0) {
    console.log('\nBroken Navigation Links:');
    results.navigation.brokenNavLinks.forEach(link => {
      console.log(`  - "${link.text}" → ${link.href}`);
    });
  }

  // Save detailed results
  await fs.writeFile(
    path.join(SCREENSHOT_DIR, 'comprehensive-results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n📊 Detailed results saved to comprehensive-results.json`);

  return results;
}

// Run the test
testComprehensive().catch(console.error);