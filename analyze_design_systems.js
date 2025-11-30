const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function analyzeDesignSystem() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    const designData = {
        audiencelab: {},
        monday: {}
    };

    // Analyze AudienceLab.io
    console.log('Analyzing AudienceLab.io...');
    await page.goto('https://audiencelab.io/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take overview screenshot
    await page.screenshot({
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/audiencelab-overview.png',
        fullPage: false
    });

    // Extract colors from AudienceLab
    const audienceLabColors = await page.evaluate(() => {
        const colors = new Set();
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
            const styles = window.getComputedStyle(el);

            // Get background colors
            if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                colors.add(styles.backgroundColor);
            }

            // Get text colors
            if (styles.color) {
                colors.add(styles.color);
            }

            // Get border colors
            if (styles.borderColor && styles.borderColor !== 'rgba(0, 0, 0, 0)') {
                colors.add(styles.borderColor);
            }
        });

        return Array.from(colors);
    });

    // Extract typography from AudienceLab
    const audienceLabTypography = await page.evaluate(() => {
        const fonts = new Set();
        const sizes = new Set();
        const weights = new Set();
        const lineHeights = new Set();

        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, div');

        elements.forEach(el => {
            const styles = window.getComputedStyle(el);
            fonts.add(styles.fontFamily);
            sizes.add(styles.fontSize);
            weights.add(styles.fontWeight);
            lineHeights.add(styles.lineHeight);
        });

        // Get specific heading sizes
        const headingSizes = {};
        for (let i = 1; i <= 6; i++) {
            const heading = document.querySelector(`h${i}`);
            if (heading) {
                const styles = window.getComputedStyle(heading);
                headingSizes[`h${i}`] = {
                    fontSize: styles.fontSize,
                    fontWeight: styles.fontWeight,
                    lineHeight: styles.lineHeight,
                    fontFamily: styles.fontFamily
                };
            }
        }

        return {
            fonts: Array.from(fonts),
            sizes: Array.from(sizes),
            weights: Array.from(weights),
            lineHeights: Array.from(lineHeights),
            headings: headingSizes
        };
    });

    // Extract spacing and layout patterns
    const audienceLabSpacing = await page.evaluate(() => {
        const spacings = new Set();
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
            const styles = window.getComputedStyle(el);
            spacings.add(styles.padding);
            spacings.add(styles.margin);
            spacings.add(styles.gap);
        });

        return Array.from(spacings).filter(s => s && s !== '0px');
    });

    // Extract button styles
    const audienceLabButtons = await page.evaluate(() => {
        const buttons = [];
        const buttonElements = document.querySelectorAll('button, a[class*="btn"], a[class*="button"], [role="button"]');

        buttonElements.forEach(btn => {
            const styles = window.getComputedStyle(btn);
            buttons.push({
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                padding: styles.padding,
                borderRadius: styles.borderRadius,
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
                border: styles.border,
                boxShadow: styles.boxShadow,
                transition: styles.transition,
                className: btn.className
            });
        });

        return buttons.slice(0, 10); // Get first 10 button styles
    });

    // Capture button hover states
    if ((await page.$$('button, a[class*="btn"]')).length > 0) {
        const firstButton = await page.$('button, a[class*="btn"]');
        if (firstButton) {
            await firstButton.hover();
            await page.waitForTimeout(500);
            await page.screenshot({
                path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/audiencelab-button-hover.png',
                clip: await firstButton.boundingBox()
            });
        }
    }

    // Store AudienceLab data
    designData.audiencelab = {
        colors: audienceLabColors,
        typography: audienceLabTypography,
        spacing: audienceLabSpacing,
        buttons: audienceLabButtons
    };

    // Scroll to capture more sections
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/audiencelab-section2.png'
    });

    // Analyze Monday.com
    console.log('Analyzing Monday.com...');
    await page.goto('https://monday.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take overview screenshot
    await page.screenshot({
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/monday-overview.png',
        fullPage: false
    });

    // Extract animations and transitions from Monday
    const mondayAnimations = await page.evaluate(() => {
        const animations = new Set();
        const transitions = new Set();
        const transforms = new Set();

        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
            const styles = window.getComputedStyle(el);

            if (styles.animation && styles.animation !== 'none') {
                animations.add(styles.animation);
            }

            if (styles.transition && styles.transition !== 'none') {
                transitions.add(styles.transition);
            }

            if (styles.transform && styles.transform !== 'none') {
                transforms.add(styles.transform);
            }
        });

        // Get keyframes if available
        const stylesheets = Array.from(document.styleSheets);
        const keyframes = [];

        stylesheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach(rule => {
                    if (rule.type === CSSRule.KEYFRAMES_RULE) {
                        keyframes.push(rule.cssText);
                    }
                });
            } catch (e) {
                // Cross-origin stylesheets will throw
            }
        });

        return {
            animations: Array.from(animations),
            transitions: Array.from(transitions),
            transforms: Array.from(transforms),
            keyframes: keyframes.slice(0, 10)
        };
    });

    // Extract hover effects
    const mondayHoverEffects = await page.evaluate(() => {
        const hoverEffects = [];
        const interactiveElements = document.querySelectorAll('button, a, [class*="card"], [class*="hover"]');

        interactiveElements.forEach(el => {
            const normalStyles = window.getComputedStyle(el);
            hoverEffects.push({
                element: el.tagName,
                className: el.className,
                transition: normalStyles.transition,
                cursor: normalStyles.cursor
            });
        });

        return hoverEffects.slice(0, 15);
    });

    // Capture interactive elements
    const buttons = await page.$$('button');
    if (buttons.length > 0) {
        await buttons[0].hover();
        await page.waitForTimeout(500);
        await page.screenshot({
            path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/monday-button-hover.png',
            clip: await buttons[0].boundingBox()
        });
    }

    // Extract Monday color palette
    const mondayColors = await page.evaluate(() => {
        const colors = new Set();
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
            const styles = window.getComputedStyle(el);

            if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                colors.add(styles.backgroundColor);
            }

            if (styles.color) {
                colors.add(styles.color);
            }
        });

        return Array.from(colors);
    });

    // Extract loading states and skeleton patterns
    const mondayLoadingPatterns = await page.evaluate(() => {
        const patterns = [];

        // Look for loading indicators
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="skeleton"], [class*="spinner"], [class*="shimmer"]');

        loadingElements.forEach(el => {
            const styles = window.getComputedStyle(el);
            patterns.push({
                className: el.className,
                animation: styles.animation,
                background: styles.background
            });
        });

        return patterns;
    });

    // Store Monday data
    designData.monday = {
        animations: mondayAnimations,
        hoverEffects: mondayHoverEffects,
        colors: mondayColors,
        loadingPatterns: mondayLoadingPatterns
    };

    // Scroll to capture animations
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(2000);
    await page.screenshot({
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/monday-scroll-animation.png'
    });

    // Save raw data for reference
    await fs.writeFile(
        'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/design-data-raw.json',
        JSON.stringify(designData, null, 2)
    );

    console.log('Design analysis complete!');
    console.log('Raw data saved to design-data-raw.json');

    await browser.close();

    return designData;
}

// Run the analysis
analyzeDesignSystem().catch(console.error);