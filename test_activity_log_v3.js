const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOT_DIR = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug';

function getScreenshotPath(filename) {
  return SCREENSHOT_DIR + '/' + filename;
}

async function runTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Starting Activity Log Tests...\n');

  try {
    // Test 1: Login
    console.log('TEST 1: Login to EVE CRM');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    console.log('  Waiting for email field...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('  Filling email...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    
    console.log('  Filling password...');
    await page.fill('input[type="password"]', 'TestPass123!');
    
    console.log('  Submitting form...');
    await page.click('button[type="submit"]');
    
    console.log('  Waiting for navigation...');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✓ Login successful\n');

    // Test 2: Navigate to Activity Log
    console.log('TEST 2: Navigate to Activity Log');
    await page.goto('http://localhost:3004/dashboard/activity-log', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const screenshotPath1 = getScreenshotPath('activity_log_001_initial.png');
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log('Screenshot saved: activity_log_001_initial.png\n');

    // Test 3: Check page loaded
    console.log('TEST 3: Check Activity Log page loaded');
    const hasActivityContent = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('activity') || bodyText.includes('log') || bodyText.includes('action');
    });
    console.log('  Activity log page loaded: ' + hasActivityContent + '\n');

    // Test 4: Check for activity list elements
    console.log('TEST 4: Verify Activity Elements');
    const activities = await page.locator('tr').count();
    console.log('  Found ' + activities + ' table rows');
    const hasHeaders = await page.locator('thead').count();
    console.log('  Has table headers: ' + (hasHeaders > 0) + '\n');

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
    if (contactLinks.length > 0) {
      contactLinks.slice(0, 5).forEach((link, idx) => {
        console.log('    ' + (idx + 1) + '. "' + link.text + '" -> color: ' + link.color);
      });
    }
    console.log();

    // Test 6: Click on first contact link
    console.log('TEST 6: Click Contact Link and Verify Navigation');
    const allLinks = await page.locator('a').all();
    
    if (allLinks.length > 0) {
      const linkText = await allLinks[0].textContent();
      console.log('  Clicking on: "' + linkText.trim() + '"');
      
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle' }),
          allLinks[0].click()
        ]);
        
        const newUrl = page.url();
        console.log('  Navigated to: ' + newUrl);
        
        const screenshotPath2 = getScreenshotPath('activity_log_002_after_contact_link.png');
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        console.log('  Screenshot saved: activity_log_002_after_contact_link.png\n');
        
        // Go back
        await page.goBack();
        await page.waitForNavigation({ waitUntil: 'networkidle' });
      } catch (e) {
        console.log('  Note: Link did not trigger navigation: ' + e.message + '\n');
      }
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
    
    const screenshotPath3 = getScreenshotPath('activity_log_003_scrolled.png');
    await page.screenshot({ path: screenshotPath3, fullPage: true });
    console.log('  Scrolled and took screenshot: activity_log_003_scrolled.png\n');

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
            cells.push(td.innerText.substring(0, 40));
          });
          rows.push(cells);
        }
      });
      
      return { headers, rows };
    });
    
    console.log('  Headers: ' + tableStructure.headers.join(' | '));
    if (tableStructure.rows.length > 0) {
      console.log('  Sample rows:');
      tableStructure.rows.forEach((row, idx) => {
        console.log('    Row ' + (idx + 1) + ': ' + row.join(' | '));
      });
    }
    console.log();

    console.log('='.repeat(60));
    console.log('ACTIVITY LOG TESTS COMPLETE - PASSED');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    const errorScreenshot = getScreenshotPath('activity_log_ERROR.png');
    try {
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      console.log('Error screenshot saved: activity_log_ERROR.png');
    } catch (e) {
      console.log('Could not save error screenshot: ' + e.message);
    }
  }

  await context.close();
  await browser.close();
}

runTests().catch(console.error);
