const { chromium } = require('playwright');
const path = require('path');

async function testDashboard() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\post-fix-verification';
  
  console.log('=== DASHBOARD TESTING ===\n');
  
  // Login test
  console.log('Testing login...');
  try {
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'login-page.png') });
    
    await page.fill('input[name="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[name="password"]', 'D3n1w3n1!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotDir, 'dashboard-main.png') });
    console.log('✓ Login successful');
  } catch (error) {
    console.log('✗ Login failed');
    await browser.close();
    return;
  }
  
  // Test dashboard pages
  const dashPages = [
    { url: '/dashboard', name: 'dashboard' },
    { url: '/dashboard/contacts', name: 'contacts' },
    { url: '/dashboard/inbox', name: 'inbox' },
    { url: '/dashboard/objects', name: 'objects' },
    { url: '/dashboard/settings', name: 'settings' },
    { url: '/dashboard/closebot', name: 'closebot' },
    { url: '/dashboard/calendar', name: 'calendar' },
    { url: '/dashboard/email-templates', name: 'email-templates' },
    { url: '/dashboard/campaigns', name: 'campaigns' },
    { url: '/dashboard/autoresponders', name: 'autoresponders' }
  ];
  
  console.log('\nTesting dashboard pages:');
  for (const pageInfo of dashPages) {
    try {
      await page.goto('http://localhost:3004' + pageInfo.url, { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      
      // Check for redirects
      if (pageInfo.url.includes('email-templates') || 
          pageInfo.url.includes('campaigns') || 
          pageInfo.url.includes('autoresponders')) {
        if (currentUrl.includes('/dashboard/inbox')) {
          console.log('✓ ' + pageInfo.url + ' (redirected to inbox as expected)');
        } else {
          console.log('✗ ' + pageInfo.url + ' (wrong redirect)');
        }
      } else {
        console.log('✓ ' + pageInfo.url);
      }
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'dashboard-' + pageInfo.name + '.png') 
      });
    } catch (error) {
      console.log('✗ ' + pageInfo.url + ' (error)');
    }
  }
  
  // Test CORS
  console.log('\nTesting CORS:');
  await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
  
  // Check for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('CORS')) {
      consoleErrors.push(msg.text());
    }
  });
  
  await page.waitForTimeout(3000);
  
  if (consoleErrors.length === 0) {
    console.log('✓ No CORS errors detected');
  } else {
    console.log('✗ CORS errors found');
  }
  
  // Mobile test
  console.log('\nTesting mobile view:');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3004/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(screenshotDir, 'mobile-homepage.png') });
  
  await page.goto('http://localhost:3004/dashboard', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(screenshotDir, 'mobile-dashboard.png') });
  console.log('✓ Mobile screenshots captured');
  
  await browser.close();
  console.log('\n=== DASHBOARD TEST COMPLETE ===');
}

testDashboard().catch(console.error);
