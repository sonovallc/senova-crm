const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Starting fresh Payments and AI Tools tests...\n');

    // Go to login
    console.log('Navigating to login...');
    await page.goto('http://localhost:3004/auth/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Login
    console.log('Logging in...');
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await page.fill('input[type="email"]', 'admin@evebeautyma.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      console.log('Login successful\n');
    }

    // TEST 1: Payments Page
    console.log('=== TEST 1: PAYMENTS PAGE ===');
    try {
      console.log('Navigating to /dashboard/payments...');
      await page.goto('http://localhost:3004/dashboard/payments', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const paymentsScreenshot = path.join(screenshotDir, 'PAYMENTS_PAGE_FRESH.png');
      await page.screenshot({ path: paymentsScreenshot, fullPage: true });
      
      const pageTitle = await page.title();
      const pageUrl = page.url();
      const pageContent = await page.content();
      
      console.log('✓ Payments page loaded');
      console.log('  URL: ' + pageUrl);
      console.log('  Title: ' + pageTitle);
      console.log('  Screenshot: PAYMENTS_PAGE_FRESH.png');
      console.log('');
      
    } catch (error) {
      console.log('✗ Payments page test failed: ' + error.message);
      console.log('');
    }

    // TEST 2: AI Tools Page
    console.log('=== TEST 2: AI TOOLS PAGE ===');
    try {
      console.log('Navigating to /dashboard/ai...');
      await page.goto('http://localhost:3004/dashboard/ai', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const aiScreenshot = path.join(screenshotDir, 'AI_TOOLS_PAGE_FRESH.png');
      await page.screenshot({ path: aiScreenshot, fullPage: true });
      
      const pageTitle = await page.title();
      const pageUrl = page.url();
      const pageContent = await page.content();
      
      console.log('✓ AI Tools page loaded');
      console.log('  URL: ' + pageUrl);
      console.log('  Title: ' + pageTitle);
      console.log('  Screenshot: AI_TOOLS_PAGE_FRESH.png');
      console.log('');
      
    } catch (error) {
      console.log('✗ AI Tools page test failed: ' + error.message);
      console.log('');
    }

    console.log('=== TEST COMPLETE ===');
    console.log('Screenshots saved to: ' + screenshotDir);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
