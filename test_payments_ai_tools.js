const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Ensure screenshot directory exists
const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    console.log('Starting Payments and AI Tools page tests...\n');

    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 5000 }).catch(() => null);
    
    // Login
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(2000);
    
    console.log('3. Login successful\n');

    // TEST 1: Payments Page
    console.log('=== TEST 1: PAYMENTS PAGE ===');
    try {
      await page.goto('http://localhost:3004/dashboard/payments', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1500);
      
      // Take screenshot
      const paymentsScreenshot = path.join(screenshotDir, 'payments-page.png');
      await page.screenshot({ path: paymentsScreenshot, fullPage: true });
      
      // Check for common elements
      const pageTitle = await page.title();
      const pageContent = await page.content();
      
      // Look for common patterns
      const hasPaymentText = pageContent.includes('payment') || pageContent.includes('Payment') || pageContent.includes('billing') || pageContent.includes('Billing');
      const h1Text = await page.locator('h1').first().textContent().catch(() => '');
      const h2Text = await page.locator('h2').first().textContent().catch(() => '');
      
      results.tests.push({
        name: 'Payments Page Load',
        status: 'PASS',
        screenshot: 'payments-page.png',
        details: {
          pageTitle: pageTitle,
          hasPaymentContent: hasPaymentText,
          h1Text: h1Text,
          h2Text: h2Text
        }
      });
      
      console.log('✓ Payments page loaded successfully');
      console.log(`  - Page title: ${pageTitle}`);
      console.log(`  - H1 text: ${h1Text}`);
      console.log(`  - H2 text: ${h2Text}`);
      console.log(`  - Screenshot: payments-page.png\n`);
      
    } catch (error) {
      console.log('✗ Payments page test failed:', error.message);
      results.tests.push({
        name: 'Payments Page Load',
        status: 'FAIL',
        error: error.message
      });
    }

    // TEST 2: AI Tools Page
    console.log('=== TEST 2: AI TOOLS PAGE ===');
    try {
      await page.goto('http://localhost:3004/dashboard/ai', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1500);
      
      // Take screenshot
      const aiScreenshot = path.join(screenshotDir, 'ai-tools-page.png');
      await page.screenshot({ path: aiScreenshot, fullPage: true });
      
      // Check for common elements
      const pageTitle = await page.title();
      const pageContent = await page.content();
      
      // Look for common patterns
      const hasAiText = pageContent.includes('AI') || pageContent.includes('ai') || pageContent.includes('tool') || pageContent.includes('Tool');
      const h1Text = await page.locator('h1').first().textContent().catch(() => '');
      const h2Text = await page.locator('h2').first().textContent().catch(() => '');
      
      results.tests.push({
        name: 'AI Tools Page Load',
        status: 'PASS',
        screenshot: 'ai-tools-page.png',
        details: {
          pageTitle: pageTitle,
          hasAiContent: hasAiText,
          h1Text: h1Text,
          h2Text: h2Text
        }
      });
      
      console.log('✓ AI Tools page loaded successfully');
      console.log(`  - Page title: ${pageTitle}`);
      console.log(`  - H1 text: ${h1Text}`);
      console.log(`  - H2 text: ${h2Text}`);
      console.log(`  - Screenshot: ai-tools-page.png\n`);
      
    } catch (error) {
      console.log('✗ AI Tools page test failed:', error.message);
      results.tests.push({
        name: 'AI Tools Page Load',
        status: 'FAIL',
        error: error.message
      });
    }

    // Print results summary
    console.log('\n=== TEST RESULTS SUMMARY ===');
    const passed = results.tests.filter(t => t.status === 'PASS').length;
    const failed = results.tests.filter(t => t.status === 'FAIL').length;
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${results.tests.length}`);
    
    // Save results to JSON
    const resultsFile = path.join(screenshotDir, 'test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsFile}`);
    
  } catch (error) {
    console.error('Test suite error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
