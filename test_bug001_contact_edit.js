const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    console.log('TEST 1: Contact Edit Persistence\n');
    
    // Login
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/bug001_login.png', fullPage: true });
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Logged in');
    
    // Navigate to contacts
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001_contacts.png', fullPage: true });
    console.log('✓ On contacts page');
    
    // Click first contact name
    const contactLink = await page.waitForSelector('a.text-blue-600', { timeout: 5000 });
    const contactHref = await contactLink.getAttribute('href');
    console.log('✓ Found contact link:', contactHref);
    await contactLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001_detail.png', fullPage: true });
    
    // Click Edit button
    const editBtn = await page.waitForSelector('button:has-text("Edit")', { timeout: 5000 });
    console.log('✓ Edit button found');
    await editBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/bug001_modal.png', fullPage: true });
    
    // Change first_name
    const timestamp = Date.now();
    const testValue = `EDITED_${timestamp}`;
    const firstNameInput = await page.waitForSelector('input[name="first_name"]');
    await firstNameInput.fill(testValue);
    console.log('✓ Changed first_name to:', testValue);
    await page.screenshot({ path: 'screenshots/bug001_changed.png', fullPage: true });
    
    // Click Update
    const updateBtn = await page.waitForSelector('button:has-text("Update")');
    await updateBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug001_saved.png', fullPage: true });
    
    // Navigate away and back
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3004' + contactHref);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug001_verify.png', fullPage: true });
    
    // Verify persistence
    const content = await page.content();
    if (content.includes(testValue)) {
      console.log('\n✓✓✓ PASS - Contact edit persisted!');
      console.log('Value found:', testValue);
    } else {
      console.log('\n✗✗✗ FAIL - Contact edit did NOT persist');
      console.log('Looking for:', testValue);
    }
    
  } catch (error) {
    console.error('\n✗✗✗ ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
