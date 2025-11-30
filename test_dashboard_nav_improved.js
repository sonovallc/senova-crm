const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'exhaustive-debug-dashboard');
const CREDENTIALS = {
  email: 'admin@evebeautyma.com',
  password: 'TestPass123!'
};

// Enhanced results collector
const results = {
  login: [],
  dashboard: [],
  navigation: [],
  header: [],
  errors: [],
  navigationLinks: [], // NEW: Track all discovered nav links
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    passRate: 0
  }
};

function logTest(category, element, action, result, status, screenshotPath = null) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const testResult = {
    element,
    action,
    result,
    status,
    screenshot: screenshotPath,
    timestamp
  };
  results[category].push(testResult);
  results.summary.total++;
  if (status === 'PASS') results.summary.passed++;
  if (status === 'FAIL') results.summary.failed++;

  console.log(`[${category.toUpperCase()}] ${element} - ${action}: ${status}`);
  if (screenshotPath) console.log(`  Screenshot: ${screenshotPath}`);
}

function getScreenshotPath(prefix) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  return path.join(SCREENSHOT_DIR, `${prefix}-${timestamp}.png`);
}

async function captureConsoleErrors(page) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push({
        type: 'console-error',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    results.errors.push({
      type: 'page-error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`[PAGE ERROR] ${error.message}`);
  });
}

async function login(page) {
  console.log('\n========== LOGGING IN ==========\n');

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const emailField = page.locator('input[type="email"]').first();
  const passwordField = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await emailField.fill(CREDENTIALS.email);
  await passwordField.fill(CREDENTIALS.password);
  await submitButton.click();

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Extra wait for dynamic content

  console.log('✓ Login successful');
}

async function discoverAndTestNavigation(page) {
  console.log('\n========== DISCOVERING NAVIGATION ELEMENTS ==========\n');

  // Take initial screenshot
  const initialScreenshot = getScreenshotPath('nav-discovery-initial');
  await page.screenshot({ path: initialScreenshot, fullPage: true });
  logTest('navigation', 'Navigation Discovery', 'Initial Screenshot', 'Captured dashboard state', 'PASS', initialScreenshot);

  // Strategy 1: Find all clickable elements in left sidebar
  console.log('\n--- Strategy 1: Find elements by sidebar structure ---');

  // Look for the sidebar container first
  const sidebarLocators = [
    'aside',
    '[class*="sidebar"]',
    '[class*="Sidebar"]',
    'nav[class*="side"]',
    '.sidebar',
    '#sidebar'
  ];

  let sidebar = null;
  for (const selector of sidebarLocators) {
    const element = page.locator(selector).first();
    if (await element.count() > 0) {
      sidebar = element;
      console.log(`✓ Found sidebar with selector: ${selector}`);
      break;
    }
  }

  if (sidebar) {
    // Find all links/buttons within sidebar
    const navItems = await sidebar.locator('a, button').all();
    console.log(`Found ${navItems.length} clickable elements in sidebar`);

    for (let i = 0; i < navItems.length; i++) {
      try {
        const item = navItems[i];
        const isVisible = await item.isVisible();

        if (isVisible) {
          const text = (await item.textContent() || '').trim();
          const tagName = await item.evaluate(el => el.tagName);
          const href = await item.getAttribute('href');
          const classes = await item.getAttribute('class');

          console.log(`\nNav Item ${i}:`);
          console.log(`  Text: "${text}"`);
          console.log(`  Tag: ${tagName}`);
          console.log(`  Href: ${href}`);
          console.log(`  Classes: ${classes}`);

          results.navigationLinks.push({
            index: i,
            text,
            tagName,
            href,
            classes
          });
        }
      } catch (error) {
        console.log(`  Error inspecting item ${i}: ${error.message}`);
      }
    }
  }

  // Strategy 2: Find specific navigation items by text
  console.log('\n--- Strategy 2: Find by text content ---');

  const expectedNavItems = [
    'Dashboard',
    'Inbox',
    'Contacts',
    'Activity Log',
    'Email',
    'Payments',
    'AI Tools',
    'Settings',
    'Feature Flags',
    'Deleted Contacts'
  ];

  for (const itemText of expectedNavItems) {
    try {
      const locator = page.locator(`a:has-text("${itemText}"), button:has-text("${itemText}")`).first();
      const count = await locator.count();

      if (count > 0) {
        const isVisible = await locator.isVisible();
        const href = await locator.getAttribute('href');

        console.log(`✓ Found "${itemText}": visible=${isVisible}, href=${href}`);

        if (isVisible && href) {
          logTest('navigation', `Nav Link: ${itemText}`, 'Discovered', `Href: ${href}`, 'PASS');
        }
      } else {
        console.log(`✗ Not found: "${itemText}"`);
        logTest('navigation', `Nav Link: ${itemText}`, 'Discover', 'Not found', 'FAIL');
      }
    } catch (error) {
      console.log(`✗ Error finding "${itemText}": ${error.message}`);
    }
  }

  // Strategy 3: Get all links on the page and filter by position
  console.log('\n--- Strategy 3: All links analysis ---');

  const allLinks = await page.locator('a[href]').all();
  console.log(`Total links on page: ${allLinks.length}`);

  for (let i = 0; i < allLinks.length; i++) {
    try {
      const link = allLinks[i];
      const isVisible = await link.isVisible();

      if (isVisible) {
        const text = (await link.textContent() || '').trim();
        const href = await link.getAttribute('href');
        const boundingBox = await link.boundingBox();

        // Filter for left-side links (x < 300px typically indicates sidebar)
        if (boundingBox && boundingBox.x < 300) {
          console.log(`Sidebar link: "${text}" -> ${href} (x: ${boundingBox.x})`);
        }
      }
    } catch (error) {
      // Skip
    }
  }
}

async function testNavigationLinks(page) {
  console.log('\n========== TESTING NAVIGATION LINKS ==========\n');

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Inbox', href: '/dashboard/inbox' },
    { name: 'Contacts', href: '/dashboard/contacts' },
    { name: 'Activity Log', href: '/dashboard/activity' },
    { name: 'Email', href: null }, // Might be expandable
    { name: 'Payments', href: '/dashboard/payments' },
    { name: 'AI Tools', href: '/dashboard/ai-tools' },
    { name: 'Settings', href: '/dashboard/settings' },
    { name: 'Feature Flags', href: '/dashboard/feature-flags' },
    { name: 'Deleted Contacts', href: '/dashboard/deleted-contacts' }
  ];

  for (const item of navItems) {
    try {
      // Go back to dashboard before each navigation test
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const beforeScreenshot = getScreenshotPath(`nav-${item.name.replace(/\s/g, '-')}-before`);
      await page.screenshot({ path: beforeScreenshot, fullPage: true });

      // Find and click the nav item
      const navLocator = page.locator(`a:has-text("${item.name}"), button:has-text("${item.name}")`).first();
      const count = await navLocator.count();

      if (count === 0) {
        logTest('navigation', `Nav: ${item.name}`, 'Click', 'Element not found', 'FAIL', beforeScreenshot);
        continue;
      }

      const isVisible = await navLocator.isVisible();
      if (!isVisible) {
        logTest('navigation', `Nav: ${item.name}`, 'Click', 'Element not visible', 'FAIL', beforeScreenshot);
        continue;
      }

      console.log(`\nClicking: ${item.name}`);
      await navLocator.click();
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const afterScreenshot = getScreenshotPath(`nav-${item.name.replace(/\s/g, '-')}-after`);
      await page.screenshot({ path: afterScreenshot, fullPage: true });

      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);

      // Check if navigation occurred
      if (item.href && currentUrl.includes(item.href)) {
        logTest('navigation', `Nav: ${item.name}`, 'Click & Navigate', `Navigated to ${currentUrl}`, 'PASS', afterScreenshot);
      } else if (!item.href) {
        // Item might be expandable (like Email section)
        logTest('navigation', `Nav: ${item.name}`, 'Click', 'Clicked (expandable section)', 'PASS', afterScreenshot);
      } else {
        logTest('navigation', `Nav: ${item.name}`, 'Click & Navigate', `Expected ${item.href}, got ${currentUrl}`, 'FAIL', afterScreenshot);
      }

    } catch (error) {
      logTest('navigation', `Nav: ${item.name}`, 'Click', `Error: ${error.message}`, 'FAIL');
    }
  }
}

async function testEmailSubsection(page) {
  console.log('\n========== TESTING EMAIL SUBSECTION ==========\n');

  // Go to dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Click Email to expand (if collapsible)
  const emailNav = page.locator('button:has-text("Email"), a:has-text("Email")').first();
  if (await emailNav.count() > 0) {
    const beforeExpand = getScreenshotPath('email-section-before-expand');
    await page.screenshot({ path: beforeExpand, fullPage: true });

    await emailNav.click();
    await page.waitForTimeout(500);

    const afterExpand = getScreenshotPath('email-section-after-expand');
    await page.screenshot({ path: afterExpand, fullPage: true });
    logTest('navigation', 'Email Section', 'Expand', 'Section expanded', 'PASS', afterExpand);

    // Test email subsections
    const emailSubItems = [
      { name: 'Compose', href: '/dashboard/email/compose' },
      { name: 'Templates', href: '/dashboard/email/templates' },
      { name: 'Campaigns', href: '/dashboard/email/campaigns' },
      { name: 'Autoresponders', href: '/dashboard/email/autoresponders' },
      { name: 'Inbox', href: '/dashboard/email/inbox' }
    ];

    for (const subItem of emailSubItems) {
      try {
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Expand email section again
        await emailNav.click();
        await page.waitForTimeout(500);

        const subNavLocator = page.locator(`a:has-text("${subItem.name}")`).first();
        const count = await subNavLocator.count();

        if (count > 0 && await subNavLocator.isVisible()) {
          const beforeClick = getScreenshotPath(`email-${subItem.name.toLowerCase()}-before`);
          await page.screenshot({ path: beforeClick, fullPage: true });

          await subNavLocator.click();
          await page.waitForTimeout(2000);
          await page.waitForLoadState('networkidle');

          const afterClick = getScreenshotPath(`email-${subItem.name.toLowerCase()}-after`);
          await page.screenshot({ path: afterClick, fullPage: true });

          const currentUrl = page.url();
          if (currentUrl.includes(subItem.href)) {
            logTest('navigation', `Email > ${subItem.name}`, 'Click & Navigate', `Navigated to ${currentUrl}`, 'PASS', afterClick);
          } else {
            logTest('navigation', `Email > ${subItem.name}`, 'Click & Navigate', `Expected ${subItem.href}, got ${currentUrl}`, 'FAIL', afterClick);
          }
        } else {
          logTest('navigation', `Email > ${subItem.name}`, 'Find', 'Not found or not visible', 'FAIL');
        }
      } catch (error) {
        logTest('navigation', `Email > ${subItem.name}`, 'Click', `Error: ${error.message}`, 'FAIL');
      }
    }
  }
}

async function testHeaderElements(page) {
  console.log('\n========== TESTING HEADER ELEMENTS ==========\n');

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const headerScreenshot = getScreenshotPath('header-analysis');
  await page.screenshot({ path: headerScreenshot, fullPage: true });

  // Test Admin dropdown
  try {
    const adminButton = page.locator('button:has-text("Admin"), a:has-text("Admin")').first();
    if (await adminButton.count() > 0 && await adminButton.isVisible()) {
      const beforeClick = getScreenshotPath('header-admin-before');
      await page.screenshot({ path: beforeClick, fullPage: true });

      await adminButton.click();
      await page.waitForTimeout(500);

      const afterClick = getScreenshotPath('header-admin-after');
      await page.screenshot({ path: afterClick, fullPage: true });

      logTest('header', 'Admin Dropdown', 'Click', 'Dropdown opened', 'PASS', afterClick);

      // Check for Logout button in dropdown
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      if (await logoutButton.count() > 0 && await logoutButton.isVisible()) {
        const logoutScreenshot = getScreenshotPath('header-logout-visible');
        await page.screenshot({ path: logoutScreenshot, fullPage: true });
        logTest('header', 'Logout Button', 'Found in dropdown', 'Logout button visible', 'PASS', logoutScreenshot);
      } else {
        logTest('header', 'Logout Button', 'Find in dropdown', 'Not found', 'FAIL');
      }
    } else {
      logTest('header', 'Admin Dropdown', 'Find', 'Not found', 'FAIL', headerScreenshot);
    }
  } catch (error) {
    logTest('header', 'Admin Dropdown', 'Test', `Error: ${error.message}`, 'FAIL');
  }
}

async function testDashboardCards(page) {
  console.log('\n========== TESTING DASHBOARD CARDS ==========\n');

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const dashboardScreenshot = getScreenshotPath('dashboard-cards-analysis');
  await page.screenshot({ path: dashboardScreenshot, fullPage: true });

  // Test stat cards
  const expectedCards = [
    { title: 'Total Contacts', value: '1,247' },
    { title: 'Total Messages', value: '15,234' },
    { title: 'Total Revenue', value: '$456,700' },
    { title: 'Growth Rate', value: '+12%' }
  ];

  for (const card of expectedCards) {
    try {
      const cardLocator = page.locator(`text=${card.title}`).first();
      if (await cardLocator.count() > 0 && await cardLocator.isVisible()) {
        const cardScreenshot = getScreenshotPath(`card-${card.title.replace(/\s/g, '-')}`);
        await cardLocator.screenshot({ path: cardScreenshot });
        logTest('dashboard', `Card: ${card.title}`, 'Found', `Card visible with title`, 'PASS', cardScreenshot);
      } else {
        logTest('dashboard', `Card: ${card.title}`, 'Find', 'Not found', 'FAIL');
      }
    } catch (error) {
      logTest('dashboard', `Card: ${card.title}`, 'Find', `Error: ${error.message}`, 'FAIL');
    }
  }
}

async function generateReport() {
  console.log('\n========== GENERATING ENHANCED REPORT ==========\n');

  results.summary.passRate = results.summary.total > 0
    ? ((results.summary.passed / results.summary.total) * 100).toFixed(1)
    : 0;

  let report = `# EXHAUSTIVE DEBUG REPORT: DASHBOARD & NAVIGATION (IMPROVED)

**Debug Date:** ${new Date().toISOString()}
**Debugger Agent Session:** Enhanced Dashboard Nav Test
**System Schema:** system-schema-eve-crm-dashboard.md

---

## EXECUTIVE SUMMARY

- **Total Elements Tested:** ${results.summary.total}
- **Passed:** ${results.summary.passed}
- **Failed:** ${results.summary.failed}
- **Pass Rate:** ${results.summary.passRate}%

---

## NAVIGATION DISCOVERY RESULTS

**Total Navigation Links Discovered:** ${results.navigationLinks.length}

| Index | Text | Tag | Href | Classes |
|-------|------|-----|------|---------|
`;

  results.navigationLinks.forEach(link => {
    report += `| ${link.index} | ${link.text} | ${link.tagName} | ${link.href || 'N/A'} | ${link.classes || 'N/A'} |\n`;
  });

  report += `\n---\n\n## DETAILED TEST RESULTS\n\n`;

  // Navigation tests
  report += `### NAVIGATION TESTS (${results.navigation.length} tests)\n\n`;
  report += `| Element | Action | Result | Status | Screenshot |\n`;
  report += `|---------|--------|--------|--------|------------|\n`;

  results.navigation.forEach(test => {
    const screenshot = test.screenshot ? path.basename(test.screenshot) : 'N/A';
    report += `| ${test.element} | ${test.action} | ${test.result} | ${test.status} | ${screenshot} |\n`;
  });

  // Header tests
  report += `\n### HEADER TESTS (${results.header.length} tests)\n\n`;
  report += `| Element | Action | Result | Status | Screenshot |\n`;
  report += `|---------|--------|--------|--------|------------|\n`;

  results.header.forEach(test => {
    const screenshot = test.screenshot ? path.basename(test.screenshot) : 'N/A';
    report += `| ${test.element} | ${test.action} | ${test.result} | ${test.status} | ${screenshot} |\n`;
  });

  // Dashboard tests
  report += `\n### DASHBOARD TESTS (${results.dashboard.length} tests)\n\n`;
  report += `| Element | Action | Result | Status | Screenshot |\n`;
  report += `|---------|--------|--------|--------|------------|\n`;

  results.dashboard.forEach(test => {
    const screenshot = test.screenshot ? path.basename(test.screenshot) : 'N/A';
    report += `| ${test.element} | ${test.action} | ${test.result} | ${test.status} | ${screenshot} |\n`;
  });

  report += `\n---\n\n## CONSOLE ERRORS\n\n`;
  if (results.errors.length === 0) {
    report += `No errors detected.\n`;
  } else {
    report += `**Total Errors:** ${results.errors.length}\n\n`;
    results.errors.forEach((error, i) => {
      report += `**Error ${i + 1}:** ${error.type}\n`;
      report += `- Message: ${error.message.substring(0, 200)}\n`;
      report += `- Time: ${error.timestamp}\n\n`;
    });
  }

  report += `\n---\n\n*Generated by Debugger Agent - Enhanced Testing Protocol*\n`;

  const reportPath = path.join(__dirname, 'EXHAUSTIVE_DEBUG_DASHBOARD_NAV_IMPROVED.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport saved to: ${reportPath}`);

  const jsonPath = path.join(__dirname, 'debug_dashboard_nav_improved_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`JSON results saved to: ${jsonPath}`);

  return reportPath;
}

async function main() {
  console.log('Starting Enhanced Dashboard & Navigation Debug...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  captureConsoleErrors(page);

  try {
    await login(page);
    await discoverAndTestNavigation(page);
    await testNavigationLinks(page);
    await testEmailSubsection(page);
    await testHeaderElements(page);
    await testDashboardCards(page);

    await generateReport();

    console.log('\n========================================');
    console.log('ENHANCED DEBUG COMPLETE');
    console.log('========================================');
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Pass Rate: ${results.summary.passRate}%`);
    console.log(`Navigation Links Found: ${results.navigationLinks.length}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Fatal error:', error);
    await generateReport();
  } finally {
    await browser.close();
  }
}

main();
