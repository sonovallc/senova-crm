const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testBug002() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'bug017-verification');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== BUG-017 VERIFICATION TEST ===\n');

  try {
    console.log('[1] Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Logged in\n');

    console.log('[2] Go to email/compose...');
    await page.goto('http://localhost:3004/dashboard/email/email/compose');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, 'step1-email/compose-page.png'), fullPage: true });
    console.log('✓ On email/compose page\n');

    console.log('[3] Open New Template modal...');
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'step2-modal-open.png'), fullPage: true });
    console.log('✓ Modal opened\n');

    console.log('[4] Fill form using placeholders...');
    await page.fill('input[placeholder*="Welcome Email"]', 'BUG-017 Test Template');
    await page.fill('input[placeholder*="Email subject"]', 'Test Subject {{contact_name}}');
    
    // Fill the rich text editor for body
    const editor = page.locator('[role="textbox"], [contenteditable="true"]').first();
    await editor.click();
    await editor.fill('This is test content with {{contact_name}} and {{company}} variables.');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'step3-form-filled.png'), fullPage: true });
    console.log('✓ Form filled\n');

    console.log('[5] *** CRITICAL BUG-017 TEST ***');
    console.log('Clicking "Create Template" button...\n');
    
    const createButton = page.locator('button:has-text("Create Template")');
    
    // Try normal click first
    try {
      await createButton.click({ timeout: 10000 });
      console.log('✅✅✅ SUCCESS - Normal click worked!');
      console.log('✅✅✅ BUG-017 IS FULLY RESOLVED!\n');
      
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(screenshotDir, 'step4-SUCCESS-created.png'), fullPage: true });
      
    } catch (err) {
      console.log('❌ Normal click failed:', err.message);
      console.log('Trying force click...\n');
      
      try {
        await createButton.click({ force: true });
        console.log('⚠️  Force click worked (pointer-events-none might not be working)');
        console.log('⚠️  BUG-017 PARTIALLY RESOLVED\n');
        
        await page.waitForTimeout(4000);
        await page.screenshot({ path: path.join(screenshotDir, 'step4-PARTIAL-created.png'), fullPage: true });
        
      } catch (err2) {
        console.log('❌❌❌ Force click ALSO failed!');
        console.log('❌❌❌ BUG-017 NOT RESOLVED!\n');
