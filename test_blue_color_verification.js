const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyBlueColors() {
    console.log('🔍 Starting Blue Color Verification Test...\n');
    console.log('===================================================');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Create screenshots directory
    const screenshotsDir = path.join(process.cwd(), 'screenshots', 'blue-color-verification');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const results = {
        publicWebsite: {},
        crmDashboard: {},
        timestamp: new Date().toISOString()
    };

    try {
        // ===== PART 1: PUBLIC WEBSITE - ELECTRIC BLUE (#0066ff) =====
        console.log('\n📘 TESTING PUBLIC WEBSITE - ELECTRIC BLUE (#0066ff)\n');
        console.log('---------------------------------------------------');

        // Test Pricing Page
        console.log('\n1️⃣ Testing /pricing page...');
        await page.goto('http://localhost:3004/pricing', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Take screenshot
        const pricingScreenshot = path.join(screenshotsDir, 'pricing-page.png');
        await page.screenshot({ path: pricingScreenshot, fullPage: true });
        console.log(`   📸 Screenshot saved: pricing-page.png`);

        // Check "Most Popular" badge
        const popularBadge = await page.locator('.bg-senova-electric, [class*="electric"]').first();
        if (await popularBadge.count() > 0) {
            const badgeColor = await popularBadge.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    className: el.className
                };
            });
            console.log(`   ✅ Most Popular badge found:`);
            console.log(`      Background: ${badgeColor.backgroundColor}`);
            console.log(`      Classes: ${badgeColor.className}`);
            results.publicWebsite.mostPopularBadge = badgeColor;
        } else {
            console.log(`   ⚠️ Most Popular badge with electric blue not found`);

            // Try to find any badge
            const anyBadge = await page.locator('text="Most Popular"').first();
            if (await anyBadge.count() > 0) {
                const badgeParent = await anyBadge.locator('..').first();
                const badgeColor = await badgeParent.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        backgroundColor: styles.backgroundColor,
                        color: styles.color,
                        className: el.className
                    };
                });
                console.log(`   ℹ️ Found badge with colors:`);
                console.log(`      Background: ${badgeColor.backgroundColor}`);
                console.log(`      Is it orange? ${badgeColor.backgroundColor.includes('255, 102, 0') || badgeColor.backgroundColor.includes('rgb(255, 102, 0)')}`);
                console.log(`      Is it blue? ${badgeColor.backgroundColor.includes('0, 102, 255') || badgeColor.backgroundColor.includes('rgb(0, 102, 255)')}`);
                results.publicWebsite.actualBadgeColor = badgeColor;
            }
        }

        // Check "Save 20%" text
        const saveText = await page.locator('text="Save 20%"').first();
        if (await saveText.count() > 0) {
            const saveColor = await saveText.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    color: styles.color,
                    className: el.className
                };
            });
            console.log(`\n   ✅ Save 20% text found:`);
            console.log(`      Color: ${saveColor.color}`);
            console.log(`      Is it blue? ${saveColor.color.includes('0, 102, 255') || saveColor.color.includes('rgb(0, 102, 255)')}`);
            results.publicWebsite.save20Text = saveColor;
        }

        // Test Homepage
        console.log('\n2️⃣ Testing /home page...');
        await page.goto('http://localhost:3004/home', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const homeScreenshot = path.join(screenshotsDir, 'home-page.png');
        await page.screenshot({ path: homeScreenshot, fullPage: true });
        console.log(`   📸 Screenshot saved: home-page.png`);

        // Check for electric blue elements
        const electricElements = await page.locator('.text-senova-electric, .bg-senova-electric, [class*="electric"]').all();
        console.log(`   Found ${electricElements.length} elements with electric blue classes`);

        if (electricElements.length > 0) {
            const firstElectric = electricElements[0];
            const electricColor = await firstElectric.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    element: el.tagName,
                    text: el.textContent?.substring(0, 50)
                };
            });
            console.log(`   First electric element: ${electricColor.element}`);
            console.log(`      Background: ${electricColor.backgroundColor}`);
            console.log(`      Text color: ${electricColor.color}`);
            results.publicWebsite.homeElectricElements = electricColor;
        }

        // ===== PART 2: CRM DASHBOARD - SKY BLUE (#4a90e2) =====
        console.log('\n\n📘 TESTING CRM DASHBOARD - SKY BLUE (#4a90e2)\n');
        console.log('---------------------------------------------------');

        // Navigate to login
        console.log('\n3️⃣ Logging into CRM...');
        await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to login
        const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
        const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
        const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();

        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
            console.log('   📝 Filling login form...');
            await emailInput.fill('admin@example.com');
            await passwordInput.fill('password123');
            await submitButton.click();

            // Wait for navigation
            await page.waitForTimeout(3000);

            // Check if we're on dashboard
            const currentUrl = page.url();
            console.log(`   Current URL: ${currentUrl}`);

            if (!currentUrl.includes('dashboard')) {
                console.log('   ⚠️ First login attempt failed, trying alternate credentials...');
                await page.goto('http://localhost:3004/login');
                await page.waitForTimeout(1000);
                await emailInput.fill('test@example.com');
                await passwordInput.fill('password');
                await submitButton.click();
                await page.waitForTimeout(3000);
            }
        }

        // Take dashboard screenshot
        console.log('\n4️⃣ Testing Dashboard colors...');
        const dashboardScreenshot = path.join(screenshotsDir, 'dashboard.png');
        await page.screenshot({ path: dashboardScreenshot, fullPage: true });
        console.log(`   📸 Screenshot saved: dashboard.png`);

        // Check sidebar active items
        const sidebarActive = await page.locator('.bg-senova-sky, [class*="sky"]').all();
        console.log(`   Found ${sidebarActive.length} elements with sky blue classes`);

        if (sidebarActive.length > 0) {
            const firstSky = sidebarActive[0];
            const skyColor = await firstSky.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    element: el.tagName,
                    className: el.className
                };
            });
            console.log(`   First sky element:`);
            console.log(`      Background: ${skyColor.backgroundColor}`);
            console.log(`      Is it sky blue? ${skyColor.backgroundColor.includes('74, 144, 226') || skyColor.backgroundColor.includes('rgb(74, 144, 226)')}`);
            results.crmDashboard.sidebarColor = skyColor;
        }

        // Check for any orange elements still present
        const orangeElements = await page.locator('[class*="orange"], [style*="rgb(255, 102, 0)"], [style*="#ff6600"]').all();
        console.log(`\n   ⚠️ Found ${orangeElements.length} elements that might still be orange`);

        if (orangeElements.length > 0) {
            console.log('   Checking potential orange elements...');
            for (let i = 0; i < Math.min(3, orangeElements.length); i++) {
                const orangeEl = orangeElements[i];
                const orangeColor = await orangeEl.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        backgroundColor: styles.backgroundColor,
                        color: styles.color,
                        className: el.className,
                        element: el.tagName
                    };
                });
                console.log(`   Element ${i + 1}: ${orangeColor.element}`);
                console.log(`      Background: ${orangeColor.backgroundColor}`);
                console.log(`      Classes: ${orangeColor.className}`);
            }
            results.crmDashboard.remainingOrangeElements = orangeElements.length;
        }

        // Check stats cards
        const statsCards = await page.locator('.border-l-4, [class*="border-l"]').all();
        if (statsCards.length > 0) {
            console.log(`\n   Found ${statsCards.length} stats cards with left borders`);
            const firstCard = statsCards[0];
            const borderColor = await firstCard.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    borderLeftColor: styles.borderLeftColor,
                    className: el.className
                };
            });
            console.log(`   Stats card border color: ${borderColor.borderLeftColor}`);
            console.log(`   Is it sky blue? ${borderColor.borderLeftColor.includes('74, 144, 226')}`);
            results.crmDashboard.statsCardBorder = borderColor;
        }

        // ===== SUMMARY =====
        console.log('\n\n===================================================');
        console.log('📊 COLOR VERIFICATION SUMMARY');
        console.log('===================================================\n');

        console.log('🌐 PUBLIC WEBSITE (Expected: Electric Blue #0066ff):');
        if (results.publicWebsite.mostPopularBadge) {
            const bg = results.publicWebsite.mostPopularBadge.backgroundColor;
            const isBlue = bg.includes('0, 102, 255') || bg.includes('rgb(0, 102, 255)');
            console.log(`   Most Popular Badge: ${isBlue ? '✅ BLUE' : '❌ NOT BLUE'} - ${bg}`);
        } else if (results.publicWebsite.actualBadgeColor) {
            const bg = results.publicWebsite.actualBadgeColor.backgroundColor;
            const isBlue = bg.includes('0, 102, 255') || bg.includes('rgb(0, 102, 255)');
            const isOrange = bg.includes('255, 102, 0') || bg.includes('rgb(255, 102, 0)');
            if (isOrange) {
                console.log(`   Most Popular Badge: ❌ STILL ORANGE - ${bg}`);
            } else if (isBlue) {
                console.log(`   Most Popular Badge: ✅ NOW BLUE - ${bg}`);
            } else {
                console.log(`   Most Popular Badge: ⚠️ UNKNOWN COLOR - ${bg}`);
            }
        }

        if (results.publicWebsite.save20Text) {
            const color = results.publicWebsite.save20Text.color;
            const isBlue = color.includes('0, 102, 255') || color.includes('rgb(0, 102, 255)');
            console.log(`   Save 20% Text: ${isBlue ? '✅ BLUE' : '❌ NOT BLUE'} - ${color}`);
        }

        console.log('\n💼 CRM DASHBOARD (Expected: Sky Blue #4a90e2):');
        if (results.crmDashboard.sidebarColor) {
            const bg = results.crmDashboard.sidebarColor.backgroundColor;
            const isSkyBlue = bg.includes('74, 144, 226') || bg.includes('rgb(74, 144, 226)');
            console.log(`   Sidebar Active: ${isSkyBlue ? '✅ SKY BLUE' : '❌ NOT SKY BLUE'} - ${bg}`);
        }

        if (results.crmDashboard.statsCardBorder) {
            const border = results.crmDashboard.statsCardBorder.borderLeftColor;
            const isSkyBlue = border.includes('74, 144, 226');
            console.log(`   Stats Cards Border: ${isSkyBlue ? '✅ SKY BLUE' : '❌ NOT SKY BLUE'} - ${border}`);
        }

        if (results.crmDashboard.remainingOrangeElements) {
            console.log(`   ⚠️ Remaining orange elements found: ${results.crmDashboard.remainingOrangeElements}`);
        }

        console.log('\n📁 Screenshots saved to:', screenshotsDir);
        console.log('   - pricing-page.png');
        console.log('   - home-page.png');
        console.log('   - dashboard.png');

        // Save results to JSON
        const resultsPath = path.join(screenshotsDir, 'color-verification-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log('\n📄 Detailed results saved to: color-verification-results.json');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        console.log('\n🏁 Test completed. Browser will close in 5 seconds...');
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// Run the test
verifyBlueColors().catch(console.error);