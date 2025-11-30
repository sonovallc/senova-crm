const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function findEditor() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Login
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Navigate to compose
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('=== FINDING MESSAGE EDITOR ===');
    console.log('');
    
    // Check for contenteditable
    const contentEditables = await page.locator('[contenteditable="true"]').all();
    console.log('Contenteditable elements:', contentEditables.length);
    
    // Check for ProseMirror
    const proseMirror = await page.locator('.ProseMirror').count();
    console.log('ProseMirror elements:', proseMirror);
    
    // Check for TipTap
    const tiptap = await page.locator('[class*="tiptap"]').count();
    console.log('TipTap elements:', tiptap);
    
    // Check all divs with role
    const editableRoles = await page.locator('div[role="textbox"]').count();
    console.log('Divs with role=textbox:', editableRoles);
    
    // Try to find by clicking in the message area
    const messageLabel = page.locator('label:has-text("Message")');
    await messageLabel.scrollIntoViewIfNeeded();
    
    // Get the parent element
    const messageSection = page.locator('label:has-text("Message")').locator('..').locator('..');
    const html = await messageSection.innerHTML().catch(() => 'error');
    console.log('');
    console.log('Message section HTML (first 500 chars):');
    console.log(html.substring(0, 500));
    console.log('');
    
    // Try clicking after the formatting buttons
    const varsButton = page.locator('button:has-text("Variables")');
    const box = await varsButton.boundingBox();
    if (box) {
      // Click below the formatting toolbar
      await page.mouse.click(box.x, box.y + 100);
      await page.waitForTimeout(500);
      
      // Type something
      await page.keyboard.type('Testing editor discovery...');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: path.join(process.cwd(), 'screenshots', 'compose-workflow', 'editor-test.png'), fullPage: true });
      console.log('Screenshot saved: editor-test.png');
      console.log('Successfully typed into editor!');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

findEditor();
