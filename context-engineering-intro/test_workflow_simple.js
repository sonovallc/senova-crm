const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFeature4Campaigns() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'feature4-comprehensive');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Feature 4: Mass Email Campaigns Testing ===
');

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful
');

    // TEST 1: Navigate to Campaigns
    console.log('TEST 1: Navigate to Campaigns Page...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-01-campaigns-page.png'), fullPage: true });
    console.log('Screenshot: feature4-01-campaigns-page.png
');

    // Check for Create button
    const hasCreateBtn = await page.locator('button:has-text("Create"), a:has-text("Create")').count();
    console.log('Create Campaign button found:', hasCreateBtn > 0);
    console.log('');

    // TEST 2: Open Create Campaign
    console.log('TEST 2: Opening Create Campaign wizard...');
    const createBtn = page.locator('button:has-text("Create"), a[href*="campaigns/create"]').first();
    await createBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-02-create-start.png'), fullPage: true });
    console.log('Screenshot: feature4-02-create-start.png
');

    // TEST 3: Fill form
    console.log('TEST 3: Filling campaign details...');
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill('Playwright Test Campaign');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-03-step1-name.png'), fullPage: true });
    
    const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject" i]').first();
    await subjectInput.fill('Special Offer for {{contact_name}}');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-04-step2-subject.png'), fullPage: true });
    
    const bodyInput = page.locator('textarea[name="body"], textarea[name="content"], [contenteditable="true"]').first();
    if (await bodyInput.count() > 0) {
      await bodyInput.fill('Dear {{contact_name}}, special offer from {{company_name}}!');
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-05-step3-body.png'), fullPage: true });
    console.log('Form filled with variables
');

    // TEST 4: Create campaign
    console.log('TEST 4: Creating campaign...');
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').last();
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-06-campaign-created.png'), fullPage: true });
    console.log('Campaign creation submitted
');

    // TEST 5: View in list
    console.log('TEST 5: Viewing campaign in list...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-07-campaigns-list.png'), fullPage: true });
    
    const campaignVisible = await page.locator('text="Playwright Test Campaign"').count();
    console.log('Campaign visible in list:', campaignVisible > 0);
    console.log('');

    // TEST 6: Analytics page
    console.log('TEST 6: Opening analytics page...');
    if (campaignVisible > 0) {
      await page.locator('text="Playwright Test Campaign"').first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'feature4-08-analytics.png'), fullPage: true });
      console.log('Screenshot: feature4-08-analytics.png
');
    }

    // TEST 9: Unsubscribe page
    console.log('TEST 9: Testing unsubscribe page...');
    await page.goto('http://localhost:3004/unsubscribe/test-token', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-09-unsubscribe.png'), fullPage: true });
    console.log('Screenshot: feature4-09-unsubscribe.png
');

    console.log('=== All UI tests completed! ===');
    console.log('Screenshots saved to:', screenshotDir);

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR-screenshot.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testFeature4Campaigns().catch(console.error);
