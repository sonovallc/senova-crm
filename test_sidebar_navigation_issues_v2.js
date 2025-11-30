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

    // Try to hover over Industries using a more specific selector
    try {
      // Scroll to top to ensure header is visible
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      // Try hovering using the navigation button
      const industriesButton = await page.$('nav button:has-text("Industries")');
      if (industriesButton) {
        await industriesButton.hover();
        await page.waitForTimeout(1000); // Give dropdown time to appear
        console.log('✅ Hovered over Industries button');
      } else {
        console.log('⚠️ Industries button not found, trying alternative approach');
        // Alternative: trigger mouseenter event directly
        await page.evaluate(() => {
          const button = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Industries'));
          if (button) {
            button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          }
        });
        await page.waitForTimeout(1000);
      }

      // Take screenshot of Industries dropdown
      await page.screenshot({
        path: 'screenshots/issue2-industries-dropdown.png',
        fullPage: false
      });
      console.log('✅ Industries dropdown screenshot captured');

    } catch (hoverError) {
      console.log('⚠️ Could not hover, taking screenshot anyway');
      await page.screenshot({
        path: 'screenshots/issue2-industries-dropdown-attempt.png',
        fullPage: false
      });
    }

    // Get all industry links from the page (visible or not)
    const industryData = await page.evaluate(() => {
      // First check in the dropdown structure
      const dropdownLinks = Array.from(document.querySelectorAll('a[href^="/industries/"]'));

      // Also check the navigation object if available in the page context
      const links = dropdownLinks.map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        visible: link.offsetParent !== null
      }));

      return links;
    });

    console.log('\n🏢 Industries found in DOM:');
    industryData.forEach(link => {
      console.log(`  ${link.visible ? '👁️' : '👻'} ${link.text}: ${link.href.replace('http://localhost:3000', '')}`);
    });

    // Check for the specific 5 new industries
    const newIndustries = [
      { name: 'Legal & Law Firms', path: '/industries/legal-attorneys' },
      { name: 'Real Estate', path: '/industries/real-estate' },
      { name: 'Mortgage & Lending', path: '/industries/mortgage-lending' },
      { name: 'Insurance', path: '/industries/insurance' },
      { name: 'Marketing Agencies', path: '/industries/marketing-agencies' }
    ];

    console.log('\n🆕 Checking for NEW industries:');
    newIndustries.forEach(industry => {
      const found = industryData.some(link =>
        link.text === industry.name ||
        link.href.includes(industry.path)
      );
      console.log(`  ${found ? '✅' : '❌'} ${industry.name} (${industry.path}): ${found ? 'FOUND' : 'NOT FOUND'}`);
    });

    // Also check the source code directly
    const pageContent = await page.content();
    console.log('\n📝 Checking source code for industry paths:');
    newIndustries.forEach(industry => {
      const inSource = pageContent.includes(industry.path);
      console.log(`  ${inSource ? '✅' : '❌'} ${industry.path} in source: ${inSource ? 'YES' : 'NO'}`);
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
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of dashboard layout
    await page.screenshot({
      path: 'screenshots/issue1-dashboard-full.png',
      fullPage: false
    });
    console.log('✅ Dashboard screenshot captured');

    // Analyze the layout structure
    const layoutAnalysis = await page.evaluate(() => {
      const sidebar = document.querySelector('.w-64, .lg\\:ml-64');
      const main = document.querySelector('main');
      const topBar = document.querySelector('[class*="pt-16"]');

      // Get all elements with fixed width that might be sidebars
      const fixedWidthElements = Array.from(document.querySelectorAll('[class*="w-64"], [class*="ml-64"]'));

      // Check computed styles
      const mainStyles = main ? window.getComputedStyle(main) : null;
      const bodyStyles = window.getComputedStyle(document.body);

      // Check for any elements between sidebar and main content
      const betweenElements = [];
      if (sidebar && main) {
        const sidebarRect = sidebar.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();

        // Look for elements in the gap
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.left > sidebarRect.right && rect.right < mainRect.left && rect.width > 10) {
            betweenElements.push({
              tag: el.tagName,
              classes: el.className,
              width: rect.width
            });
          }
        });
      }

      return {
        sidebarCount: fixedWidthElements.length,
        mainMarginLeft: mainStyles?.marginLeft,
        mainPaddingLeft: mainStyles?.paddingLeft,
        mainClasses: main?.className,
        bodyOverflow: bodyStyles.overflow,
        bodyOverflowX: bodyStyles.overflowX,
        elementsInGap: betweenElements,
        viewportWidth: window.innerWidth,
        sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : null,
        mainLeft: main ? main.getBoundingClientRect().left : null
      };
    });

    console.log('\n📐 Layout Analysis:');
    console.log(`  - Number of w-64/ml-64 elements: ${layoutAnalysis.sidebarCount}`);
    console.log(`  - Viewport width: ${layoutAnalysis.viewportWidth}px`);
    console.log(`  - Sidebar actual width: ${layoutAnalysis.sidebarWidth}px`);
    console.log(`  - Main content left position: ${layoutAnalysis.mainLeft}px`);
    console.log(`  - Main margin-left: ${layoutAnalysis.mainMarginLeft}`);
    console.log(`  - Main padding-left: ${layoutAnalysis.mainPaddingLeft}`);
    console.log(`  - Main classes: ${layoutAnalysis.mainClasses}`);
    console.log(`  - Body overflow: ${layoutAnalysis.bodyOverflow}`);
    console.log(`  - Body overflow-x: ${layoutAnalysis.bodyOverflowX}`);

    if (layoutAnalysis.elementsInGap.length > 0) {
      console.log('\n⚠️ Elements found in gap between sidebar and main:');
      layoutAnalysis.elementsInGap.forEach(el => {
        console.log(`  - ${el.tag}: ${el.classes} (width: ${el.width}px)`);
      });
    }

    // Calculate expected vs actual spacing
    const expectedGap = layoutAnalysis.sidebarWidth || 256;
    const actualGap = layoutAnalysis.mainLeft || 0;
    const extraSpace = actualGap - expectedGap;

    console.log('\n📏 Spacing Analysis:');
    console.log(`  - Expected gap (sidebar width): ${expectedGap}px`);
    console.log(`  - Actual gap (main left position): ${actualGap}px`);
    console.log(`  - Extra space: ${extraSpace}px`);

    if (extraSpace > 10) {
      console.log('  ⚠️ ISSUE CONFIRMED: Extra ${extraSpace}px of blank space detected!');
    } else {
      console.log('  ✅ Layout appears normal');
    }

    // Add visual indicators
    await page.evaluate(() => {
      // Remove any existing indicators
      document.querySelectorAll('.debug-indicator').forEach(el => el.remove());

      const sidebar = document.querySelector('.w-64');
      const main = document.querySelector('main');

      if (sidebar && main) {
        const sidebarRect = sidebar.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();

        // Highlight sidebar edge
        const sidebarEdge = document.createElement('div');
        sidebarEdge.className = 'debug-indicator';
        sidebarEdge.style.cssText = `
          position: fixed;
          left: ${sidebarRect.right}px;
          top: 0;
          width: 2px;
          height: 100vh;
          background: green;
          z-index: 10000;
          pointer-events: none;
        `;
        document.body.appendChild(sidebarEdge);

        // Highlight main content edge
        const mainEdge = document.createElement('div');
        mainEdge.className = 'debug-indicator';
        mainEdge.style.cssText = `
          position: fixed;
          left: ${mainRect.left}px;
          top: 0;
          width: 2px;
          height: 100vh;
          background: blue;
          z-index: 10000;
          pointer-events: none;
        `;
        document.body.appendChild(mainEdge);

        // Highlight the gap if it exists
        if (mainRect.left - sidebarRect.right > 10) {
          const gap = document.createElement('div');
          gap.className = 'debug-indicator';
          gap.style.cssText = `
            position: fixed;
            left: ${sidebarRect.right}px;
            top: 0;
            width: ${mainRect.left - sidebarRect.right}px;
            height: 100vh;
            background: rgba(255, 0, 0, 0.2);
            border: 2px dashed red;
            z-index: 9999;
            pointer-events: none;
          `;

          const label = document.createElement('div');
          label.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 10px;
            border: 2px solid red;
            color: red;
            font-weight: bold;
          `;
          label.textContent = `Blank Space: ${Math.round(mainRect.left - sidebarRect.right)}px`;
          gap.appendChild(label);

          document.body.appendChild(gap);
        }
      }
    });

    await page.waitForTimeout(500);

    // Take screenshot with visual indicators
    await page.screenshot({
      path: 'screenshots/issue1-dashboard-with-indicators.png',
      fullPage: false
    });
    console.log('✅ Dashboard with visual indicators screenshot captured');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await page.waitForTimeout(2000); // Keep browser open to see
    await browser.close();
    console.log('\n✅ Investigation complete! Check screenshots folder.');
  }
}

investigateIssues().catch(console.error);