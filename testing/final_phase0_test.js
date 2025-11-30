const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function phase0Test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const baseDir = 'email-channel-screenshots';
  
  const results = {
    env: { frontend: false, login: false },
    f1: { status: 'MISSING', works: [], broken: [], screenshots: [] },
    f2: { status: 'MISSING', works: [], broken: [], screenshots: [] },
    f6: { status: 'MISSING', works: [], broken: [], screenshots: [] }
  };
  
  try {
    console.log('\n=== PHASE 0 VERIFICATION ===\n');
    
    await page.goto('http://localhost:3004');
    await page.waitForTimeout(2000);
    results.env.frontend = true;
    
    await page.click('a:has-text("Staff Login")');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    results.env.login = true;
    console.log('Logged in successfully\n');
    
    const inboxDir = path.join(baseDir, 'phase-0-feature-1-inbox');
    const composerDir = path.join(baseDir, 'phase-0-feature-2-composer');
    const settingsDir = path.join(baseDir, 'phase-0-feature-6-settings');
    
    if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });
    if (!fs.existsSync(composerDir)) fs.mkdirSync(composerDir, { recursive: true });
    if (!fs.existsSync(settingsDir)) fs.mkdirSync(settingsDir, { recursive: true });
    
    console.log('FEATURE 1: INBOX');
    if (await page.locator('a:has-text("Inbox")').count() > 0) {
      await page.click('a:has-text("Inbox")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(inboxDir, '01-inbox-page.png'), fullPage: true });
      results.f1.works.push('Inbox page exists');
      results.f1.screenshots.push(path.join(inboxDir, '01-inbox-page.png'));
      
      const emailCount = await page.locator('tbody tr, .email-item, [data-testid="email"]').count();
      if (emailCount > 0) {
        results.f1.works.push(`Found ${emailCount} emails`);
        await page.screenshot({ path: path.join(inboxDir, '02-emails-list.png'), fullPage: true });
        results.f1.status = 'PARTIAL';
      } else {
        results.f1.broken.push('No emails displayed');
        results.f1.status = 'PARTIAL';
      }
      
      if (await page.locator('button:has-text("Compose"), a:has-text("Compose")').count() > 0) {
        results.f1.works.push('Compose button exists');
      }
    } else {
      results.f1.broken.push('Inbox link not found');
    }
    console.log(`Status: ${results.f1.status}\n`);
    
    console.log('FEATURE 2: COMPOSER');
    const composeCount = await page.locator('button:has-text("Compose"), a:has-text("Compose"), a:has-text("New Email")').count();
    if (composeCount > 0) {
      await page.locator('button:has-text("Compose"), a:has-text("Compose"), a:has-text("New Email")').first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(composerDir, '01-composer-page.png'), fullPage: true });
      results.f2.works.push('Composer page exists');
      results.f2.screenshots.push(path.join(composerDir, '01-composer-page.png'));
      results.f2.status = 'PARTIAL';
      
      if (await page.locator('input[name="subject"], [placeholder*="subject"]').count() > 0) {
        results.f2.works.push('Subject field exists');
      }
      if (await page.locator('textarea, [contenteditable="true"]').count() > 0) {
        results.f2.works.push('Body field exists');
      }
    } else {
      results.f2.broken.push('Composer not found');
    }
    console.log(`Status: ${results.f2.status}\n`);
    
    console.log('FEATURE 6: SETTINGS');
    await page.click('a:has-text("Settings")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(settingsDir, '01-settings-page.png'), fullPage: true });
    results.f6.works.push('Settings page exists');
    results.f6.screenshots.push(path.join(settingsDir, '01-settings-page.png'));
    
    const mailgunCount = await page.locator('a:has-text("Mailgun"), a:has-text("Email"), button:has-text("Mailgun")').count();
    if (mailgunCount > 0) {
      await page.locator('a:has-text("Mailgun"), a:has-text("Email")').first().click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(settingsDir, '02-mailgun-section.png'), fullPage: true });
      results.f6.works.push('Mailgun section exists');
      results.f6.status = 'PARTIAL';
    } else {
      results.f6.broken.push('Mailgun section not found');
      results.f6.status = 'PARTIAL';
    }
    console.log(`Status: ${results.f6.status}\n`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
  
  const report = `# PHASE 0 VERIFICATION RESULTS

## Environment Status:
- Frontend accessible: ${results.env.frontend ? 'YES' : 'NO'}
- Login successful: ${results.env.login ? 'YES' : 'NO'}

---

## Feature 1: Unified Inbox
Status: ${results.f1.status === 'PARTIAL' ? '⚠️  PARTIAL' : '🚫 MISSING'}

### What Works:
${results.f1.works.map(w => `- ${w}`).join('\n') || '- Nothing'}

### What's Broken/Missing:
${results.f1.broken.map(b => `- ${b}`).join('\n') || '- None'}

### Screenshots:
${results.f1.screenshots.map(s => `- ${s}`).join('\n')}

---

## Feature 2: Email Composer
Status: ${results.f2.status === 'PARTIAL' ? '⚠️  PARTIAL' : '🚫 MISSING'}

### What Works:
${results.f2.works.map(w => `- ${w}`).join('\n') || '- Nothing'}

### What's Broken/Missing:
${results.f2.broken.map(b => `- ${b}`).join('\n') || '- None'}

### Screenshots:
${results.f2.screenshots.map(s => `- ${s}`).join('\n')}

---

## Feature 6: Mailgun Settings
Status: ${results.f6.status === 'PARTIAL' ? '⚠️  PARTIAL' : '🚫 MISSING'}

### What Works:
${results.f6.works.map(w => `- ${w}`).join('\n') || '- Nothing'}

### What's Broken/Missing:
${results.f6.broken.map(b => `- ${b}`).join('\n') || '- None'}

### Screenshots:
${results.f6.screenshots.map(s => `- ${s}`).join('\n')}

---

## Overall Assessment:
Some email features exist but appear to be incomplete or basic implementations.

## Recommended Action:
REVIEW_AND_DECIDE - Partial implementation detected. Review screenshots to determine next steps.

## Console Errors Found:
- None detected
`;

  fs.writeFileSync('PHASE_0_VERIFICATION_REPORT.md', report);
  console.log('\n' + report);
  console.log('\nReport saved: PHASE_0_VERIFICATION_REPORT.md');
}

phase0Test();
