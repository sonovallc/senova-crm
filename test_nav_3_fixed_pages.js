const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    login: { status: 'NOT_TESTED', url: '', content: '', errors: [] },
    closebot: { status: 'NOT_TESTED', url: '', content: '', errors: [] },
    activityLog: { status: 'NOT_TESTED', url: '', content: '', errors: [] },
    aiTools: { status: 'NOT_TESTED', url: '', content: '', errors: [] }
  };

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  try {
    // STEP 1: Login
    console.log('\n=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for dashboard after login (up to 90 seconds)...');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    
    results.login.status = 'PASS';
    results.login.url = page.url();
    console.log('✓ Login successful:', results.login.url);

    // STEP 2: Test Settings > Closebot
    console.log('\n=== STEP 2: TESTING SETTINGS > CLOSEBOT ===');
    await page.goto('http://localhost:3004/dashboard/settings/closebot', { waitUntil: 'networkidle', timeout: 90000 });
    console.log('Waiting for page to load completely...');
    await page.waitForTimeout(5000);
    
    results.closebot.url = page.url();
    const closebotContent = await page.content();
    
    // Check for 404
    if (closebotContent.includes('404') || closebotContent.includes('Not Found')) {
      results.closebot.status = 'FAIL';
      results.closebot.content = '404 error detected';
    } else {
      // Check for actual content
      const heading = await page.textContent('h1, h2, h3').catch(() => '');
      results.closebot.content = heading || 'Page loaded but no clear heading found';
      results.closebot.status = 'PASS';
    }
    
    await page.screenshot({ path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/02-nav-settings-closebot-fixed.png', fullPage: true });
    console.log(`Closebot Status: ${results.closebot.status} - ${results.closebot.content}`);

    // STEP 3: Test Activity Log
    console.log('\n=== STEP 3: TESTING ACTIVITY LOG ===');
    await page.goto('http://localhost:3004/dashboard/activity', { waitUntil: 'networkidle', timeout: 90000 });
    console.log('Waiting for page to load completely...');
    await page.waitForTimeout(5000);
    
    results.activityLog.url = page.url();
    const activityContent = await page.content();
    
    if (activityContent.includes('404') || activityContent.includes('Not Found')) {
      results.activityLog.status = 'FAIL';
      results.activityLog.content = '404 error detected';
    } else {
      const heading = await page.textContent('h1, h2, h3').catch(() => '');
      results.activityLog.content = heading || 'Page loaded but no clear heading found';
      results.activityLog.status = 'PASS';
    }
    
    await page.screenshot({ path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/02-nav-activity-fixed.png', fullPage: true });
    console.log(`Activity Log Status: ${results.activityLog.status} - ${results.activityLog.content}`);

    // STEP 4: Test AI Tools
    console.log('\n=== STEP 4: TESTING AI TOOLS ===');
    await page.goto('http://localhost:3004/dashboard/ai-tools', { waitUntil: 'networkidle', timeout: 90000 });
    console.log('Waiting for page to load completely...');
    await page.waitForTimeout(5000);
    
    results.aiTools.url = page.url();
    const aiToolsContent = await page.content();
    
    if (aiToolsContent.includes('404') || aiToolsContent.includes('Not Found')) {
      results.aiTools.status = 'FAIL';
      results.aiTools.content = '404 error detected';
    } else {
      const heading = await page.textContent('h1, h2, h3').catch(() => '');
      results.aiTools.content = heading || 'Page loaded but no clear heading found';
      results.aiTools.status = 'PASS';
    }
    
    await page.screenshot({ path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/02-nav-ai-tools-fixed.png', fullPage: true });
    console.log(`AI Tools Status: ${results.aiTools.status} - ${results.aiTools.content}`);

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    results.error = error.message;
  }

  // Final Summary
  console.log('\n=== FINAL RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  
  const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
  const totalTests = 4; // login + 3 pages
  console.log(`\nPASSED: ${passCount}/${totalTests}`);

  await browser.close();
})();
