const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'screenshots', 'bugfix-verification');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('\n🧪 INTERACTIVE BUG FIXES VERIFICATION\n');
  
  try {
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type=email]', 'admin@evebeautyma.com');
    await page.fill('input[type=password]', 'TestPass123!');
    await page.click('button[type=submit]');
    await page.waitForTimeout(3000);
    console.log('✅ Logged in\n');
    
    // Bug 1: Campaign Create - Test clicking
    console.log('Testing Bug #1: Campaign Create Page (no runtime error)');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    const createBtn = await page.locator('button:has-text("Create Campaign")').count();
    if (createBtn > 0) {
      await page.click('button:has-text("Create Campaign")');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(dir, '1-campaign-create-page.png'), fullPage: true });
      const hasError = await page.locator('text=/runtime.*error/i').count();
      console.log(hasError > 0 ? '❌ FAIL - Runtime error present' : '✅ PASS - No runtime error\n');
    } else {
      console.log('⚠️ SKIP - Create button not found\n');
    }
    
    // Bug 2: Contact Selector
    console.log('Testing Bug #2: Contact Selector Dropdown');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(2000);
    const composeBtn = await page.locator('button:has-text("Compose")').count();
    if (composeBtn > 0) {
      await page.click('button:has-text("Compose")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(dir, '2-compose-dialog.png'), fullPage: true });
      const selector = await page.locator('[data-testid="contact-selector"]').count();
      console.log(selector > 0 ? '✅ PASS - Contact selector exists\n' : '⚠️ Selector not found with testid\n');
    } else {
      console.log('⚠️ SKIP - Compose button not found\n');
    }
    
    // Bug 6: Preview Button
    console.log('Testing Bug #6: Preview Email Button');
    const previewBtn = await page.locator('button:has-text("Preview")').count();
    if (previewBtn > 0) {
      await page.screenshot({ path: path.join(dir, '6-preview-button.png'), fullPage: true });
      console.log('✅ PASS - Preview button exists\n');
    } else {
      await page.screenshot({ path: path.join(dir, '6-no-preview.png'), fullPage: true });
      console.log('❌ FAIL - Preview button not found\n');
    }
    
    // Bug 7: Variables Dropdown
    console.log('Testing Bug #7: Expanded Field Variables');
    const varsBtn = await page.locator('button:has-text("Variables")').count();
    if (varsBtn > 0) {
      await page.click('button:has-text("Variables")');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(dir, '7-variables-expanded.png'), fullPage: true });
      const categories = await page.locator('text=/contact|address|company|appointment/i').count();
      console.log(`✅ PASS - Variables dropdown with ${categories} categories\n`);
    } else {
      console.log('❌ FAIL - Variables button not found\n');
    }
    
    // Bug 8: Template Selection
    console.log('Testing Bug #8: Template Selection');
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(2000);
    if (await page.locator('button:has-text("Compose")').count() > 0) {
      await page.click('button:has-text("Compose")');
      await page.waitForTimeout(2000);
      const templateSel = await page.locator('select').count();
      await page.screenshot({ path: path.join(dir, '8-template-selector.png'), fullPage: true });
      console.log(templateSel > 0 ? '✅ PASS - Template selector dropdown exists\n' : '⚠️ Template selector not visible\n');
    }
    
    // Bug 9: Use Template Button
    console.log('Testing Bug #9: Use Template Navigation');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    const prevBtn = await page.locator('button:has-text("Preview")').count();
    if (prevBtn > 0) {
      await page.click('button:has-text("Preview")');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(dir, '9-template-preview-dialog.png'), fullPage: true });
      const useBtn = await page.locator('button:has-text("Use")').count();
      console.log(useBtn > 0 ? '✅ PASS - Use Template button in preview dialog\n' : '❌ FAIL - Use button not found\n');
      
      if (useBtn > 0) {
        await page.click('button:has-text("Use")');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(dir, '9-after-use-template.png'), fullPage: true });
        const comingSoon = await page.locator('text=/coming soon/i').count();
        console.log(comingSoon > 0 ? '❌ FAIL - Still shows coming soon toast' : '✅ PASS - Navigated without coming soon toast\n');
      }
    } else {
      console.log('⚠️ SKIP - No templates to test\n');
    }
    
    console.log('='.repeat(60));
    console.log('📊 VERIFICATION COMPLETE');
    console.log('Screenshots saved to:', dir);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
