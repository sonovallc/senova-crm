const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFeature4() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'feature4-testing');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== FEATURE 4: Mass Email Campaigns Testing ===\n');
