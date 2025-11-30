const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = 'test_v4_' + timestamp + '@test.com';
  
  console.log('=== TEST 1: CONTACT CREATION (v4) - INSPECT ===');

  try {
    // Login
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('✓ Login successful');

    // Navigate to Contacts
    console.log('Step 2: Navigate to Contacts');
    await page.click('text=Contacts');
    await page.waitForURL('**/contacts', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to Contacts');

    // Open Add Contact Form
    console.log('Step 3: Open Add Contact Form');
    await page.click('button:has-text("Add Contact")');
    await page.waitForTimeout(2000);
    
    // Inspect the form
    console.log('\n=== FORM INSPECTION ===');
    
    // Find all input fields in the modal
    const inputs = await page.locator('.fixed input, [role="dialog"] input, form input').all();
    console.log('Total input fields found: ' + inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      console.log('Input ' + i + ':');
      console.log('  name: ' + name);
      console.log('  placeholder: ' + placeholder);
      console.log('  type: ' + type);
      console.log('  id: ' + id);
    }
    
    // Find all select fields
    const selects = await page.locator('.fixed select, [role="dialog"] select, form select').all();
    console.log('\nTotal select fields found: ' + selects.length);
    
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      const name = await select.getAttribute('name');
      const id = await select.getAttribute('id');
      console.log('Select ' + i + ':');
      console.log('  name: ' + name);
      console.log('  id: ' + id);
    }
    
    // Try to find the submit button
    console.log('\n=== BUTTON INSPECTION ===');
    const submitBtn = await page.locator('[data-testid="contact-form-submit"]').count();
    console.log('Submit button with testid found: ' + (submitBtn > 0 ? 'YES' : 'NO'));
    
    const createBtn = await page.locator('button:has-text("Create")').count();
    console.log('Create button found: ' + (createBtn > 0 ? 'YES' : 'NO'));
    
    await page.screenshot({ path: 'screenshots/test1_v4_inspect.png', fullPage: true });

  } catch (error) {
    console.error('ERROR: ' + error.message);
    await page.screenshot({ path: 'screenshots/test1_v4_inspect_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
