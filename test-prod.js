const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\context-engineering-intro\screenshots\production-fix-verification';

async function testProduction() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing production site: https://crm.senovallc.com');
  
  try {
    console.log('\n1. Navigating to production site...');
    
    page.on('response', response => {
      console.log('Response: ' + response.status() + ' ' + response.url());
    });
    
    try {
      await page.goto('https://crm.senovallc.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
    } catch (e) {
      console.log('Goto error:', e.message);
    }
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log('Current URL: ' + currentUrl);
    console.log('Page Title: ' + pageTitle);
    
    const loginScreenshot = path.join(screenshotDir, '01-current-state.png');
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    console.log('Screenshot saved: 01-current-state.png');
    
  } catch (error) {
    console.error('ERROR:', error.message);
  }
  
  await browser.close();
}

testProduction();
