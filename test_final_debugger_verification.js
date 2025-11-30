const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyPage(page, url, name, checks = []) {
  console.log(`\n=== Testing: ${name} ===`);
  console.log(`URL: ${url}`);

  try {
    // Navigate to page with timeout
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check response status
    const status = response ? response.status() : 0;
    console.log(`Status: ${status}`);

    if (status !== 200) {
      console.log(`❌ FAIL: Page returned status ${status}`);
      return { name, url, status: 'FAIL', reason: `HTTP ${status}` };
    }

    // Wait for content to be visible
    await page.waitForTimeout(2000);

    // Get page content for checks
    const content = await page.content();
    const textContent = await page.evaluate(() => document.body.innerText);

    // Perform specific content checks
    let violations = [];

    for (const check of checks) {
      if (check.type === 'no-contains') {
        if (textContent.includes(check.value)) {
          violations.push(`Found prohibited text: "${check.value}"`);
          console.log(`❌ Content violation: Contains "${check.value}"`);
        } else {
          console.log(`✅ Content check passed: No "${check.value}"`);
        }
      } else if (check.type === 'must-contain') {
        if (!textContent.includes(check.value)) {
          violations.push(`Missing required text: "${check.value}"`);
          console.log(`❌ Content violation: Missing "${check.value}"`);
        } else {
          console.log(`✅ Content check passed: Contains "${check.value}"`);
        }
      } else if (check.type === 'no-smb') {
        // Check for SMB as a word (not part of other words)
        const smbRegex = /\bSMB\b/i;
        if (smbRegex.test(textContent)) {
          violations.push(`Found "SMB" marketing jargon`);
          console.log(`❌ Content violation: Contains "SMB"`);
        } else {
          console.log(`✅ Content check passed: No "SMB" found`);
        }
      } else if (check.type === 'no-roi-numbers') {
        const roiPatterns = [
          /\$100K/i, /\$127K/i, /\$180K/i,
          /60%.*ROI/i, /67%.*ROI/i, /80%.*ROI/i,
          /3X.*ROI/i, /3x.*return/i
        ];
        for (const pattern of roiPatterns) {
          if (pattern.test(textContent)) {
            violations.push(`Found ROI guarantee: ${pattern}`);
            console.log(`❌ Content violation: Contains ROI guarantee`);
          }
        }
        if (violations.length === 0) {
          console.log(`✅ Content check passed: No ROI guarantees`);
        }
      }
    }

    // Take screenshot
    const screenshotName = `${name.replace(/[^a-z0-9]/gi, '-')}.png`;
    const screenshotPath = path.join('C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\final-verification', screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotName}`);

    if (violations.length > 0) {
      console.log(`❌ FAIL: ${violations.length} content violations`);
      return { name, url, status: 'FAIL', violations, screenshot: screenshotName };
    }

    console.log(`✅ PASS: Page loaded successfully, all checks passed`);
    return { name, url, status: 'PASS', screenshot: screenshotName };

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return { name, url, status: 'FAIL', reason: error.message };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('FINAL EXHAUSTIVE DEBUGGER VERIFICATION - SENOVA CRM');
  console.log('='.repeat(80));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('Application URL: http://localhost:3004');
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport for consistency
  await page.setViewportSize({ width: 1920, height: 1080 });

  const results = [];

  // Define all pages to test with specific checks
  const pagesToTest = [
    // Main Pages
    {
      url: 'http://localhost:3004/',
      name: '01-homepage',
      checks: [
        { type: 'no-smb' },
        { type: 'must-contain', value: 'Accessible Pricing' },
        { type: 'no-roi-numbers' },
        { type: 'must-contain', value: 'SOC 2 Compliant' }
      ]
    },
    {
      url: 'http://localhost:3004/platform',
      name: '02-platform',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/pricing',
      name: '03-pricing',
      checks: [
        { type: 'no-smb' },
        { type: 'must-contain', value: 'accessible price' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/demo',
      name: '04-demo',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/contact',
      name: '05-contact',
      checks: [
        { type: 'must-contain', value: '8 The Green #21994' },
        { type: 'must-contain', value: 'Dover, DE 19901' },
        { type: 'no-smb' }
      ]
    },
    {
      url: 'http://localhost:3004/about',
      name: '06-about',
      checks: [
        { type: 'must-contain', value: '8 The Green #21994' },
        { type: 'must-contain', value: 'Dover, DE 19901' },
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },

    // Legal Pages
    {
      url: 'http://localhost:3004/hipaa',
      name: '07-hipaa',
      checks: [
        { type: 'must-contain', value: 'SOC 2 Compliant' },
        { type: 'no-contains', value: 'SOC 2 Certified' }
      ]
    },
    {
      url: 'http://localhost:3004/security',
      name: '08-security',
      checks: [
        { type: 'must-contain', value: 'SOC 2 Compliant' },
        { type: 'no-contains', value: 'SOC 2 Certified' }
      ]
    },
    {
      url: 'http://localhost:3004/privacy-policy',
      name: '09-privacy-policy',
      checks: []
    },
    {
      url: 'http://localhost:3004/terms-of-service',
      name: '10-terms-of-service',
      checks: []
    },

    // Solution Pages
    {
      url: 'http://localhost:3004/solutions/crm',
      name: '11-solutions-crm',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/solutions/audience-intelligence',
      name: '12-solutions-audience',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/solutions/patient-identification',
      name: '13-solutions-patient',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/solutions/campaign-activation',
      name: '14-solutions-campaign',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/solutions/analytics',
      name: '15-solutions-analytics',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },

    // Industry Pages
    {
      url: 'http://localhost:3004/industries/medical-spas',
      name: '16-industries-medical-spas',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/industries/dermatology',
      name: '17-industries-dermatology',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/industries/plastic-surgery',
      name: '18-industries-plastic-surgery',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    },
    {
      url: 'http://localhost:3004/industries/aesthetic-clinics',
      name: '19-industries-aesthetic-clinics',
      checks: [
        { type: 'no-smb' },
        { type: 'no-roi-numbers' }
      ]
    }
  ];

  // Test each page
  for (const pageTest of pagesToTest) {
    const result = await verifyPage(page, pageTest.url, pageTest.name, pageTest.checks || []);
    results.push(result);
    await page.waitForTimeout(1000); // Brief pause between pages
  }

  await browser.close();

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const passRate = ((passed / results.length) * 100).toFixed(2);

  console.log(`Total Pages Tested: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${passRate}%`);

  if (failed > 0) {
    console.log('\n❌ FAILURES DETECTED:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`- ${r.name}: ${r.reason || (r.violations && r.violations.join(', '))}`);
    });
  }

  // Save detailed results
  const reportPath = path.join('C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2', 'DEBUGGER_VERIFICATION_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: DEBUGGER_VERIFICATION_RESULTS.json`);

  if (passRate === '100.00') {
    console.log('\n✅✅✅ ALL TESTS PASSED - PRODUCTION READY ✅✅✅');
  } else {
    console.log('\n❌❌❌ FAILURES DETECTED - NOT PRODUCTION READY ❌❌❌');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);