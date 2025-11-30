const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Starting comprehensive Payments and AI Tools tests...\n');

    // Navigate to dashboard first
    console.log('Step 1: Navigating to dashboard...');
    await page.goto('http://localhost:3004/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    
    let currentUrl = page.url();
    console.log('Current URL: ' + currentUrl);
    
    // Check if we're on login page
    const isLoginPage = currentUrl.includes('/auth/login');
    
    if (isLoginPage) {
      console.log('Step 2: On login page, authenticating...');
      
      // Fill login form
      const emailField = await page.$('input[type="email"]');
      if (emailField) {
        await page.fill('input[type="email"]', 'admin@evebeautyma.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        
        // Take screenshot before submit
        await page.screenshot({ path: path.join(screenshotDir, 'AUTH_LOGIN_FORM.png'), fullPage: true });
        
        await page.click('button[type="submit"]');
        console.log('Submitted login form...');
        
        // Wait for navigation
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(3000);
        
        currentUrl = page.url();
        console.log('After login URL: ' + currentUrl);
      }
    }

    // TEST 1: Payments Page
    console.log('\n=== TEST 1: PAYMENTS PAGE ===');
    try {
      console.log('Navigating to /dashboard/payments...');
      await page.goto('http://localhost:3004/dashboard/payments', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      
      currentUrl = page.url();
      console.log('Current URL: ' + currentUrl);
      
      // Get page info
      const pageTitle = await page.title();
      const bodyText = await page.locator('body').textContent();
      const isLoginAgain = currentUrl.includes('/auth/login');
      
      console.log('Page title: ' + pageTitle);
      console.log('Body content length: ' + bodyText.length);
      console.log('Is login page: ' + isLoginAgain);
      
      const paymentsScreenshot = path.join(screenshotDir, 'PAYMENTS_PAGE_FINAL.png');
      await page.screenshot({ path: paymentsScreenshot, fullPage: true });
      console.log('Screenshot saved: PAYMENTS_PAGE_FINAL.png');
      
    } catch (error) {
      console.log('Payments page test error: ' + error.message);
      const paymentsScreenshot = path.join(screenshotDir, 'PAYMENTS_PAGE_ERROR.png');
      await page.screenshot({ path: paymentsScreenshot, fullPage: true }).catch(() => {});
    }

    // TEST 2: AI Tools Page
    console.log('\n=== TEST 2: AI TOOLS PAGE ===');
    try {
      console.log('Navigating to /dashboard/ai...');
      await page.goto('http://localhost:3004/dashboard/ai', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      
      currentUrl = page.url();
      console.log('Current URL: ' + currentUrl);
      
      // Get page info
      const pageTitle = await page.title();
      const bodyText = await page.locator('body').textContent();
      const isLoginAgain = currentUrl.includes('/auth/login');
      
      console.log('Page title: ' + pageTitle);
      console.log('Body content length: ' + bodyText.length);
      console.log('Is login page: ' + isLoginAgain);
      
      const aiScreenshot = path.join(screenshotDir, 'AI_TOOLS_PAGE_FINAL.png');
      await page.screenshot({ path: aiScreenshot, fullPage: true });
      console.log('Screenshot saved: AI_TOOLS_PAGE_FINAL.png');
      
    } catch (error) {
      console.log('AI Tools page test error: ' + error.message);
      const aiScreenshot = path.join(screenshotDir, 'AI_TOOLS_PAGE_ERROR.png');
      await page.screenshot({ path: aiScreenshot, fullPage: true }).catch(() => {});
    }

    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await browser.close();
  }
})();
