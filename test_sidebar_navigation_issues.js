const { chromium } = require('playwright');
const path = require('path');

async function investigateIssues() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('🔍 Investigating Senova CRM Issues...\n');

  try {
    // First, check the Industries dropdown on public site
    console.log('📌 ISSUE 2: Checking Industries Dropdown...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: 'screenshots/issue2-homepage-initial.png',
      fullPage: false
    });
    console.log('✅ Homepage screenshot captured');

    // Hover over Industries to open dropdown
    await page.hover('button:has-text("Industries")');
    await page.waitForTimeout(500);

    // Take screenshot of Industries dropdown
    await page.screenshot({
      path: 'screenshots/issue2-industries-dropdown.png',
      fullPage: false
    });
    console.log('✅ Industries dropdown screenshot captured');

    // Get all industry links
    const industryLinks = await page.$$eval(
      'a[href^="/industries/"]',
      links => links.map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }))
    );

    console.log('\n🏢 Industries found in dropdown:');
    industryLinks.forEach(link => {
      console.log(`  - ${link.text}: ${link.href}`);
    });

    // Check for the specific 5 new industries
    const newIndustries = [
      'Legal & Law Firms',
      'Real Estate',
      'Mortgage & Lending',
      'Insurance',
      'Marketing Agencies'
    ];

    console.log('\n🆕 Checking for NEW industries:');
    newIndustries.forEach(industry => {
      const found = industryLinks.some(link => link.text === industry);
      console.log(`  ${found ? '✅' : '❌'} ${industry}: ${found ? 'FOUND' : 'NOT FOUND'}`);
    });

    // Now check the CRM dashboard sidebar issue
    console.log('\n📌 ISSUE 1: Checking CRM Dashboard Sidebar...');

    // Navigate to login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot of dashboard layout
    await page.screenshot({
      path: 'screenshots/issue1-dashboard-full.png',
      fullPage: false
    });
    console.log('✅ Dashboard screenshot captured');

    // Check the sidebar and main content layout
    const sidebar = await page.$('.lg\\:ml-64');
    const sidebarBox = await sidebar?.boundingBox();

    if (sidebarBox) {
      console.log('\n📐 Layout Analysis:');
      console.log(`  - Sidebar width: 256px (fixed w-64)`);
      console.log(`  - Main content left margin: lg:ml-64 (256px)`);
    }

    // Check for any duplicate sidebar issues
    const sidebarElements = await page.$$('[class*="w-64"]');
    console.log(`  - Number of sidebar elements found: ${sidebarElements.length}`);

    // Check the actual rendered layout
    const layoutInfo = await page.evaluate(() => {
      const main = document.querySelector('main');
      const sidebar = document.querySelector('.w-64');
      const mainStyles = main ? window.getComputedStyle(main) : null;
      const sidebarStyles = sidebar ? window.getComputedStyle(sidebar) : null;

      return {
        mainMarginLeft: mainStyles?.marginLeft,
        mainPaddingLeft: mainStyles?.paddingLeft,
        sidebarWidth: sidebarStyles?.width,
        sidebarPosition: sidebarStyles?.position,
        bodyOverflow: window.getComputedStyle(document.body).overflow
      };
    });

    console.log('\n🎨 Computed Styles:');
    console.log(`  - Main margin-left: ${layoutInfo.mainMarginLeft}`);
    console.log(`  - Main padding-left: ${layoutInfo.mainPaddingLeft}`);
    console.log(`  - Sidebar width: ${layoutInfo.sidebarWidth}`);
    console.log(`  - Sidebar position: ${layoutInfo.sidebarPosition}`);
    console.log(`  - Body overflow: ${layoutInfo.bodyOverflow}`);

    // Highlight the potential blank space
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        // Create a temporary overlay to show the layout
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '64px'; // Below topbar
        overlay.style.left = '256px'; // After sidebar
        overlay.style.width = '100px';
        overlay.style.bottom = '0';
        overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        overlay.style.border = '2px dashed red';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'none';

        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.top = '50%';
        label.style.left = '50%';
        label.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
        label.style.color = 'red';
        label.style.fontWeight = 'bold';
        label.style.fontSize = '14px';
        label.textContent = 'Blank Space?';
        overlay.appendChild(label);

        document.body.appendChild(overlay);
      }
    });

    await page.waitForTimeout(500);

    // Take screenshot with highlight
    await page.screenshot({
      path: 'screenshots/issue1-dashboard-highlighted.png',
      fullPage: false
    });
    console.log('✅ Dashboard with highlight screenshot captured');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Investigation complete! Check screenshots folder.');
  }
}

investigateIssues().catch(console.error);