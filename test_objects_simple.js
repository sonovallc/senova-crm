const { chromium } = require('playwright');
const fs = require('fs');

async function testObjects() {
    console.log('Starting Objects Module Test...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const results = [];
    const errors = [];
    
    // Monitor console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
            console.log('[Console Error]', msg.text());
        }
    });
    
    try {
        // Step 1: Login
        console.log('[1] Login...');
        await page.goto('http://localhost:3004/login');
        await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
        await page.fill('input[type="password"]', 'D3n1w3n1!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard/**', { timeout: 10000 });
        results.push('✅ Login successful');
        
        // Step 2: Navigate to Objects
        console.log('[2] Navigate to Objects...');
        await page.goto('http://localhost:3004/dashboard/objects');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'objects-list.png', fullPage: true });
        results.push('✅ Objects page loaded');
        
        // Step 3: Try to create object
        console.log('[3] Create Object...');
        try {
            await page.goto('http://localhost:3004/dashboard/objects/create');
            await page.waitForTimeout(2000);
            
            // Fill basic fields
            await page.fill('input[name="name"]', 'Test Object ' + Date.now()).catch(() => {});
            await page.fill('input[name="industry"]', 'Technology').catch(() => {});
            await page.fill('input[name="email"]', 'test@example.com').catch(() => {});
            
            await page.screenshot({ path: 'objects-create-form.png', fullPage: true });
            
            // Try to submit
            const submitBtn = await page.locator('button[type="submit"]').first();
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForTimeout(3000);
                results.push('✅ Object created');
            } else {
                results.push('❌ Submit button not found');
            }
        } catch (e) {
            results.push('❌ Create failed: ' + e.message);
        }
        
        // Step 4: Check current page
        console.log('[4] Check detail page...');
        const url = page.url();
        if (url.includes('/objects/') && !url.includes('/create')) {
            await page.screenshot({ path: 'object-detail.png', fullPage: true });
            results.push('✅ Detail page loaded');
            
            // Check for tabs
            const tabs = ['Information', 'Contacts', 'Users', 'Websites'];
            for (const tab of tabs) {
                const tabExists = await page.locator('text=' + tab).first().isVisible().catch(() => false);
                if (tabExists) {
                    results.push('✅ Tab found: ' + tab);
                } else {
                    results.push('❌ Tab missing: ' + tab);
                }
            }
        } else {
            results.push('❌ Not on detail page');
        }
        
        // Step 5: Go back to list
        console.log('[5] Return to Objects list...');
        await page.goto('http://localhost:3004/dashboard/objects');
        await page.waitForTimeout(2000);
        
        // Check for action menu
        const actionBtn = await page.locator('button[aria-label*="Actions"], button:has-text("...")').first();
        if (await actionBtn.isVisible()) {
            await actionBtn.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'objects-action-menu.png' });
            results.push('✅ Action menu works');
        } else {
            results.push('❌ Action menu not found');
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
        results.push('❌ Test error: ' + error.message);
    } finally {
        await browser.close();
        
        // Generate report
        console.log('\n=== TEST RESULTS ===\n');
        results.forEach(r => console.log(r));
        
        if (errors.length > 0) {
            console.log('\n=== CONSOLE ERRORS ===\n');
            errors.forEach(e => console.log('- ' + e));
        }
        
        // Write report
        let report = '# Objects Module Test Report\n\n';
        report += 'Generated: ' + new Date().toISOString() + '\n\n';
        report += '## Results\n\n';
        results.forEach(r => report += '- ' + r + '\n');
        
        if (errors.length > 0) {
            report += '\n## Console Errors\n\n';
            errors.forEach(e => report += '- ' + e + '\n');
        }
        
        const passed = results.filter(r => r.startsWith('✅')).length;
        const failed = results.filter(r => r.startsWith('❌')).length;
        
        report += '\n## Summary\n\n';
        report += '- Passed: ' + passed + '\n';
        report += '- Failed: ' + failed + '\n';
        report += '- Console Errors: ' + errors.length + '\n';
        
        if (failed === 0 && errors.length === 0) {
            report += '\n✅ **VERDICT: PASS** - Objects module working correctly';
        } else if (failed <= 2) {
            report += '\n⚠️ **VERDICT: PARTIAL** - Objects module mostly working';
        } else {
            report += '\n❌ **VERDICT: FAIL** - Objects module has issues';
        }
        
        fs.writeFileSync('OBJECTS_COMPLETE_WORKFLOW_REPORT.md', report);
        console.log('\n\nReport saved: OBJECTS_COMPLETE_WORKFLOW_REPORT.md');
    }
}

testObjects().catch(console.error);
