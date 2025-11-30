/**
 * FINAL PRODUCTION BUG FIX SESSION
 * Comprehensive Playwright Visual Verification for 13 Bugs
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = './screenshots/final-bug-session';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`    [Screenshot] ${filepath}`);
  return filepath;
}

async function login(page) {
  console.log('\n[LOGIN] Authenticating...');
  await page.goto(`${BASE_URL}/login`, { timeout: 90000 });
  await page.waitForLoadState('networkidle', { timeout: 90000 });

  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 90000 });
  console.log('[LOGIN] Success');
  await screenshot(page, '00-dashboard-after-login');
}

async function testBugA_ArchiveNetworkError(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-A: Inbox Archive Network Error');
  console.log('='.repeat(60));

  try {
    // Navigate to inbox
    await page.goto(`${BASE_URL}/dashboard/inbox`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'A1-inbox-list');

    // Check if there are conversations
    const conversations = await page.locator('.cursor-pointer, [role="listitem"]').all();
    console.log(`  Found ${conversations.length} conversations`);

    if (conversations.length > 0) {
      // Click first conversation
      await conversations[0].click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'A2-conversation-selected');

      // Look for Archive button
      const archiveBtn = await page.locator('button').filter({ hasText: /archive/i }).first();

      if (await archiveBtn.isVisible()) {
        console.log('  Archive button found, clicking...');
        await screenshot(page, 'A3-before-archive-click');

        await archiveBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, 'A4-after-archive-click');

        // Check for error toast
        const errorToast = await page.locator('[role="alert"]').filter({ hasText: /error|failed|network/i }).first();
        if (await errorToast.isVisible({ timeout: 2000 }).catch(() => false)) {
          const errorText = await errorToast.textContent();
          console.log(`  ERROR FOUND: ${errorText}`);
          return { status: 'BUG CONFIRMED', error: errorText };
        }

        console.log('  Archive completed without visible error');
        return { status: 'WORKING', details: 'No error on archive' };
      } else {
        console.log('  Archive button not visible');
        return { status: 'CANNOT TEST', details: 'Archive button not found' };
      }
    } else {
      console.log('  No conversations to test');
      return { status: 'CANNOT TEST', details: 'No conversations in inbox' };
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    await screenshot(page, 'A-error');
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugB_MessagesAlwaysUnread(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-B: Inbox Messages Always Show Unread');
  console.log('='.repeat(60));

  try {
    await page.goto(`${BASE_URL}/dashboard/inbox`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'B1-inbox-initial');

    // Look for unread indicators (usually bold text or badge)
    const unreadIndicators = await page.locator('.font-bold, .bg-blue-500, [data-unread="true"]').all();
    console.log(`  Unread indicators found: ${unreadIndicators.length}`);

    // Click on a conversation
    const conversations = await page.locator('.cursor-pointer').all();
    if (conversations.length > 0) {
      await conversations[0].click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'B2-after-opening-thread');

      // Navigate away and back
      await page.goto(`${BASE_URL}/dashboard/contacts`, { timeout: 90000 });
      await page.waitForTimeout(1000);

      await page.goto(`${BASE_URL}/dashboard/inbox`, { timeout: 90000 });
      await page.waitForLoadState('networkidle', { timeout: 90000 });
      await page.waitForTimeout(2000);
      await screenshot(page, 'B3-after-return-to-inbox');

      console.log('  Screenshots captured for read status analysis');
      return { status: 'SCREENSHOTS CAPTURED', details: 'Manual review needed for read status' };
    }

    return { status: 'CANNOT TEST', details: 'No conversations' };
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugC_TemplateSelectionError(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-C: Compose Email Template Selection Opens Error');
  console.log('='.repeat(60));

  try {
    await page.goto(`${BASE_URL}/dashboard/inbox`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);

    // Click Compose Email button
    const composeBtn = await page.locator('button').filter({ hasText: /compose email/i }).first();

    if (await composeBtn.isVisible()) {
      console.log('  Clicking Compose Email...');
      await composeBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'C1-compose-modal-open');

      // Look for template selector
      const templateSelector = await page.locator('select, [role="combobox"]').filter({ hasText: /template/i }).first();
      const templateBtn = await page.locator('button').filter({ hasText: /template/i }).first();

      if (await templateSelector.isVisible().catch(() => false)) {
        console.log('  Template selector found, clicking...');
        await templateSelector.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'C2-template-dropdown-open');

        // Try to select a template
        const templateOption = await page.locator('[role="option"], option').first();
        if (await templateOption.isVisible().catch(() => false)) {
          await templateOption.click();
          await page.waitForTimeout(2000);
          await screenshot(page, 'C3-after-template-selection');

          // Check for error page
          const pageContent = await page.content();
          if (pageContent.includes('404') || pageContent.includes('error') || pageContent.includes('Error')) {
            console.log('  ERROR PAGE DETECTED');
            return { status: 'BUG CONFIRMED', error: 'Error page after template selection' };
          }
        }
      } else if (await templateBtn.isVisible().catch(() => false)) {
        console.log('  Template button found');
        await templateBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'C2-template-button-clicked');
      } else {
        console.log('  No template selector found in compose modal');
        await screenshot(page, 'C2-no-template-selector');
        return { status: 'NO TEMPLATE OPTION', details: 'Template selector not found in compose modal' };
      }

      return { status: 'TESTED', details: 'Template selection tested' };
    } else {
      console.log('  Compose Email button not found');
      return { status: 'CANNOT TEST', details: 'Compose button not found' };
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    await screenshot(page, 'C-error');
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugE_CampaignEdit404(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-E: Email Campaign Edit Opens 404');
  console.log('='.repeat(60));

  try {
    await page.goto(`${BASE_URL}/dashboard/email/campaigns`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'E1-campaigns-list');

    // Look for Edit button
    const editBtn = await page.locator('button').filter({ hasText: /edit/i }).first();
    const editLink = await page.locator('a').filter({ hasText: /edit/i }).first();

    if (await editBtn.isVisible().catch(() => false)) {
      console.log('  Edit button found, clicking...');
      await editBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'E2-after-edit-click');

      // Check for 404
      const pageContent = await page.content();
      const url = page.url();
      console.log(`  Current URL: ${url}`);

      if (pageContent.includes('404') || pageContent.includes('not found') || pageContent.includes('Not Found')) {
        console.log('  404 ERROR DETECTED');
        return { status: 'BUG CONFIRMED', error: '404 on campaign edit' };
      }

      return { status: 'WORKING', details: 'Edit page loaded' };
    } else if (await editLink.isVisible().catch(() => false)) {
      console.log('  Edit link found, clicking...');
      await editLink.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'E2-after-edit-click');

      const pageContent = await page.content();
      if (pageContent.includes('404')) {
        return { status: 'BUG CONFIRMED', error: '404 on campaign edit' };
      }
      return { status: 'WORKING', details: 'Edit page loaded' };
    } else {
      // Check if there are any campaigns at all
      const noCampaigns = await page.locator('text=/no campaigns/i').isVisible().catch(() => false);
      if (noCampaigns) {
        console.log('  No campaigns exist to edit');
        return { status: 'CANNOT TEST', details: 'No campaigns exist' };
      }
      console.log('  Edit button not found');
      await screenshot(page, 'E2-no-edit-button');
      return { status: 'CANNOT TEST', details: 'Edit button not found' };
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    await screenshot(page, 'E-error');
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugFG_CampaignDuplicateDelete(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-F & G: Campaign Duplicate/Delete Fails');
  console.log('='.repeat(60));

  try {
    await page.goto(`${BASE_URL}/dashboard/email/campaigns`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'FG1-campaigns-list');

    // Test Duplicate
    const duplicateBtn = await page.locator('button').filter({ hasText: /duplicate|copy/i }).first();
    if (await duplicateBtn.isVisible().catch(() => false)) {
      console.log('  Testing Duplicate...');
      await duplicateBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'FG2-after-duplicate-click');

      const errorToast = await page.locator('[role="alert"]').filter({ hasText: /error|failed/i }).first();
      if (await errorToast.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await errorToast.textContent();
        console.log(`  DUPLICATE ERROR: ${errorText}`);
      } else {
        console.log('  Duplicate may have succeeded');
      }
    } else {
      console.log('  Duplicate button not found');
    }

    // Test Delete
    const deleteBtn = await page.locator('button').filter({ hasText: /delete/i }).first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      console.log('  Testing Delete...');
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Check for confirmation dialog
      const confirmBtn = await page.locator('button').filter({ hasText: /confirm|yes|delete/i }).first();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
      }

      await screenshot(page, 'FG3-after-delete-click');

      const errorToast = await page.locator('[role="alert"]').filter({ hasText: /error|failed/i }).first();
      if (await errorToast.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await errorToast.textContent();
        console.log(`  DELETE ERROR: ${errorText}`);
      } else {
        console.log('  Delete may have succeeded');
      }
    } else {
      console.log('  Delete button not found');
    }

    return { status: 'TESTED', details: 'Duplicate/Delete tested' };
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugH_AutoresponderStatsError(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-H: Autoresponder Stats Opens Error Page');
  console.log('='.repeat(60));

  try {
    await page.goto(`${BASE_URL}/dashboard/email/autoresponders`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'H1-autoresponders-list');

    // Look for Stats button/icon
    const statsBtn = await page.locator('button, a').filter({ hasText: /stats|statistics|analytics/i }).first();
    const chartIcon = await page.locator('[data-testid*="stats"], svg').first();

    if (await statsBtn.isVisible().catch(() => false)) {
      console.log('  Stats button found, clicking...');
      await statsBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'H2-after-stats-click');

      // Check for error page or raw HTML
      const pageContent = await page.content();
      if (pageContent.includes('<!DOCTYPE') || pageContent.includes('<html') || pageContent.includes('Error')) {
        console.log('  ERROR PAGE OR RAW HTML DETECTED');
        return { status: 'BUG CONFIRMED', error: 'Error page on stats click' };
      }

      return { status: 'WORKING', details: 'Stats page loaded' };
    } else {
      console.log('  Stats button not found - checking for icon buttons');

      // Try clicking any icon that might be stats
      const iconBtns = await page.locator('button svg').all();
      console.log(`  Found ${iconBtns.length} icon buttons`);

      return { status: 'CANNOT TEST', details: 'Stats button not clearly identifiable' };
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugIJ_AutoresponderTemplates(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-I & J: Autoresponder Edit - No Templates');
  console.log('='.repeat(60));

  try {
    await page.goto(`${BASE_URL}/dashboard/email/autoresponders`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);

    // Look for Edit button
    const editBtn = await page.locator('button, a').filter({ hasText: /edit/i }).first();

    if (await editBtn.isVisible().catch(() => false)) {
      console.log('  Edit button found, clicking...');
      await editBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'IJ1-autoresponder-edit-page');

      // Look for template dropdown
      const templateDropdown = await page.locator('select, [role="combobox"]').filter({ hasText: /template/i }).first();
      const templateLabel = await page.locator('label').filter({ hasText: /template/i }).first();

      if (await templateDropdown.isVisible().catch(() => false)) {
        console.log('  Template dropdown found');
        await templateDropdown.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'IJ2-template-dropdown-open');

        // Count options
        const options = await page.locator('[role="option"], option').all();
        console.log(`  Template options found: ${options.length}`);

        if (options.length <= 1) {
          console.log('  NO TEMPLATES IN DROPDOWN');
          return { status: 'BUG CONFIRMED', error: 'No templates in dropdown' };
        }

        return { status: 'WORKING', details: `${options.length} templates found` };
      } else if (await templateLabel.isVisible().catch(() => false)) {
        console.log('  Template label found but no dropdown');
        await screenshot(page, 'IJ2-no-template-dropdown');
        return { status: 'BUG CONFIRMED', error: 'Template label exists but no functional dropdown' };
      } else {
        console.log('  No template option found');
        await screenshot(page, 'IJ2-no-template-option');
        return { status: 'BUG CONFIRMED', error: 'No template selection available' };
      }
    } else {
      console.log('  Edit button not found');
      return { status: 'CANNOT TEST', details: 'No autoresponders to edit' };
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugK_UserDelete(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-K: Settings Users - No Delete Option');
  console.log('='.repeat(60));

  try {
    await page.goto(`${BASE_URL}/dashboard/settings/users`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'K1-users-list');

    // Look for delete button
    const deleteBtn = await page.locator('button').filter({ hasText: /delete/i }).first();
    const deleteIcon = await page.locator('[data-testid*="delete"], button svg').first();

    if (await deleteBtn.isVisible().catch(() => false)) {
      console.log('  Delete button found');
      return { status: 'WORKING', details: 'Delete option exists' };
    } else {
      console.log('  NO DELETE BUTTON FOUND');
      return { status: 'BUG CONFIRMED', error: 'No delete option for users' };
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugL_FieldCreate(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-L: Settings Fields - No Create Option');
  console.log('='.repeat(60));

  try {
    await page.goto(`${BASE_URL}/dashboard/settings/fields`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'L1-fields-page');

    // Look for create button
    const createBtn = await page.locator('button').filter({ hasText: /create|add|new/i }).first();

    if (await createBtn.isVisible().catch(() => false)) {
      console.log('  Create button found');
      await createBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'L2-create-field-modal');
      return { status: 'WORKING', details: 'Create option exists' };
    } else {
      console.log('  NO CREATE BUTTON FOUND');
      return { status: 'BUG CONFIRMED', error: 'No create option for fields' };
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

async function testBugM_FeatureFlagsAccess(page) {
  console.log('\n' + '='.repeat(60));
  console.log('BUG-M: Feature Flags Visible to Non-Owners');
  console.log('='.repeat(60));

  try {
    // Check if feature flags is visible in navigation
    await page.goto(`${BASE_URL}/dashboard/settings`, { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'M1-settings-page');

    // Look for feature flags link
    const featureFlagsLink = await page.locator('a, button').filter({ hasText: /feature flag/i }).first();

    if (await featureFlagsLink.isVisible().catch(() => false)) {
      console.log('  Feature Flags link is visible');

      // Note: We're logged in as admin - this may be expected
      // The bug is about non-owners seeing it
      console.log('  Note: Currently logged in as admin - need to check role restrictions in code');
      return { status: 'VISIBLE', details: 'Feature flags visible to current user (admin)' };
    } else {
      console.log('  Feature Flags link not visible');
      return { status: 'NOT VISIBLE', details: 'Feature flags not in navigation' };
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('FINAL PRODUCTION BUG FIX SESSION');
  console.log('Testing 13 Bugs with Visual Verification');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results = {};

  try {
    await login(page);

    // ROUND 1 - Critical Bugs
    results['BUG-A'] = await testBugA_ArchiveNetworkError(page);
    results['BUG-C'] = await testBugC_TemplateSelectionError(page);
    results['BUG-E'] = await testBugE_CampaignEdit404(page);
    results['BUG-FG'] = await testBugFG_CampaignDuplicateDelete(page);
    results['BUG-H'] = await testBugH_AutoresponderStatsError(page);

    // ROUND 2 - High Priority
    results['BUG-IJ'] = await testBugIJ_AutoresponderTemplates(page);
    results['BUG-K'] = await testBugK_UserDelete(page);
    results['BUG-L'] = await testBugL_FieldCreate(page);

    // ROUND 3 - Medium Priority
    results['BUG-B'] = await testBugB_MessagesAlwaysUnread(page);
    results['BUG-M'] = await testBugM_FeatureFlagsAccess(page);

  } catch (error) {
    console.error('\nFATAL ERROR:', error.message);
    await screenshot(page, 'fatal-error');
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('BUG DISCOVERY RESULTS');
  console.log('='.repeat(60));

  for (const [bug, result] of Object.entries(results)) {
    const emoji = result.status === 'BUG CONFIRMED' ? '❌' :
                  result.status === 'WORKING' ? '✅' : '⚠️';
    console.log(`${emoji} ${bug}: ${result.status} - ${result.details || result.error || ''}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  return results;
}

runAllTests().then((results) => {
  console.log('\nBug discovery session completed.');
}).catch((error) => {
  console.error('Session failed:', error);
  process.exit(1);
});
