const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\context-engineering-intro\testing\exhaustive-debug';

async function runTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Starting Activity Log Tests...\n');

  try {
    // Test 1: Login
    console.log('TEST 1: Login to EVE CRM');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.fill('input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✓ Login successful\n');

    // Test 2: Navigate to Activity Log
    console.log('TEST 2: Navigate to Activity Log');
    await page.goto('http://localhost:3004/dashboard/activity-log', { waitUntil: 'networkidle' });
    await page.waitForSelector('div', { timeout: 5000 });
    const screenshotPath1 = path.join(SCREENSHOT_DIR, 'activity_log_001_initial.png');
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log('Screenshot saved: ' + screenshotPath1 + '\n');

    // Test 3: Check page loaded
    console.log('TEST 3: Check Activity Log page loaded');
    const pageTitle = await page.title();
    console.log('  Page title: ' + pageTitle);
    const hasActivityContent = await page.evaluate(() => {
      return document.body.innerText.toLowerCase().includes('activity');
    });
    console.log('  Activity log page loaded: ' + hasActivityContent + '\n');

    // Test 4: Check for activity list elements
    console.log('TEST 4: Verify Activity Elements');
    const activities = await page.locator('tr').count();
    console.log('  Found ' + activities + ' table rows');
    console.log();

    // Test 5: Check for contact links (blue clickable)
    console.log('TEST 5: Check for Contact Links');
    const links = await page.locator('a').count();
    console.log('  Found ' + links + ' clickable links on page');
    
    const contactLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a').forEach(el => {
        const text = el.innerText;
        const style = window.getComputedStyle(el);
        const color = style.color;
        if (text && text.trim().length > 0) {
          links.push({
            text: text.trim(),
            href: el.href,
            color: color
          });
        }
      });
      return links;
    });
    
    console.log('  Contact links found: ' + contactLinks.length);
    contactLinks.slice(0, 5).forEach((link, idx) => {
      console.log('    ' + (idx + 1) + '. "' + link.text + '" -> ' + link.href + ' (color: ' + link.color + ')');
    });
    console.log();

    // Test 6: Click on first contact link
    console.log('TEST 6: Click Contact Link and Verify Navigation');
    const firstLink = await page.locator('a').first();
    const linkText = await firstLink.textContent();
    
    if (linkText && linkText.trim().length > 0) {
      console.log('  Clicking on: "' + linkText + '"');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        firstLink.click()
      ]);
      
      const newUrl = page.url();
      console.log('  Navigated to: ' + newUrl);
      
      const screenshotPath2 = path.join(SCREENSHOT_DIR, 'activity_log_002_after_contact_link.png');
      await page.screenshot({ path: screenshotPath2, fullPage: true });
      console.log('  Screenshot saved: ' + screenshotPath2 + '\n');
      
      // Go back to activity log
      await page.goBack();
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    } else {
      console.log('  No clickable links found on page\n');
    }

    // Test 7: Scroll through activities
    console.log('TEST 7: Scroll Through Activities');
    await page.goto('http://localhost:3004/dashboard/activity-log', { waitUntil: 'networkidle' });
    
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await page.waitForTimeout(1000);
    
    const screenshotPath3 = path.join(SCREENSHOT_DIR, 'activity_log_003_scrolled.png');
    await page.screenshot({ path: screenshotPath3, fullPage: true });
    console.log('  Scrolled and took screenshot: ' + screenshotPath3 + '\n');

    // Test 8: Verify table structure
    console.log('TEST 8: Verify Activity Log Table Structure');
    const tableStructure = await page.evaluate(() => {
      const headers = [];
      document.querySelectorAll('th').forEach(th => {
        headers.push(th.innerText);
      });
      
      const rows = [];
      document.querySelectorAll('tbody tr').forEach((tr, idx) => {
        if (idx < 3) {
          const cells = [];
          tr.querySelectorAll('td').forEach(td => {
            cells.push(td.innerText.substring(0, 50));
          });
          rows.push(cells);
        }
      });
      
      return { headers, rows };
    });
    
    console.log('  Headers: ' + JSON.stringify(tableStructure.headers));
    console.log('  Sample rows:');
    tableStructure.rows.forEach((row, idx) => {
      console.log('    Row ' + (idx + 1) + ': ' + JSON.stringify(row));
    });
    console.log();

    console.log('='.repeat(60));
    console.log('ACTIVITY LOG TESTS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    console.error(error.stack);
    
    const errorScreenshot = path.join(SCREENSHOT_DIR, 'activity_log_ERROR.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    console.log('Error screenshot saved: ' + errorScreenshot);
  }

  await context.close();
  await browser.close();
}

runTests().catch(console.error);
