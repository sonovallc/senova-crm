const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const pages = [
    '/', '/platform', '/pricing', '/about', '/contact',
    '/solutions/crm', '/solutions/audience-intelligence', 
    '/solutions/patient-identification', '/solutions/campaign-activation',
    '/solutions/analytics', '/industries/medical-spas',
    '/industries/dermatology', '/industries/plastic-surgery',
    '/industries/aesthetic-clinics', '/privacy-policy',
    '/terms-of-service', '/hipaa', '/security', '/compliance',
    '/blog', '/case-studies', '/roi-calculator', '/docs'
  ];
  
  let pass = 0, fail = 0;
  console.log('Testing ' + pages.length + ' pages...\n');
  
  for (const url of pages) {
    try {
      const response = await page.goto('http://localhost:3004' + url, {
        timeout: 15000,
        waitUntil: 'domcontentloaded'
      });
      
      if (response && response.status() === 200) {
        console.log('PASS: ' + url);
        pass++;
      } else {
        console.log('FAIL: ' + url + ' (status ' + response.status() + ')');
        fail++;
      }
    } catch (error) {
      console.log('ERROR: ' + url);
      fail++;
    }
  }
  
  console.log('\n=== RESULTS ===');
  console.log('Total: ' + pages.length);
  console.log('Passed: ' + pass);
  console.log('Failed: ' + fail);
  console.log('Success Rate: ' + Math.round((pass/pages.length)*100) + '%');
  
  if (fail === 0) {
    console.log('\n✅ PRODUCTION READY');
  } else {
    console.log('\n❌ NOT READY - ' + fail + ' pages failed');
  }
  
  await browser.close();
}

test().catch(console.error);
