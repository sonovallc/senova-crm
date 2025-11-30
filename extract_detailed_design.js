const { chromium } = require('playwright');
const fs = require('fs').promises;

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    const detailedDesign = {};

    try {
        // AUDIENCELAB DETAILED EXTRACTION
        console.log('Extracting detailed AudienceLab design...');
        await page.goto('https://audiencelab.io/', { waitUntil: 'networkidle', timeout: 45000 });

        // Extract comprehensive design tokens
        detailedDesign.audiencelab = await page.evaluate(() => {
            const design = {
                colors: {},
                typography: {},
                spacing: {},
                shadows: [],
                borders: [],
                animations: {}
            };

            // Helper functions
            const rgbToHex = (rgb) => {
                if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return null;
                const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (!match) return rgb;
                const [, r, g, b] = match;
                return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
            };

            // Categorize colors by usage
            const primaryButtons = document.querySelectorAll('button, a[class*="btn"]');
            const backgrounds = new Set();
            const texts = new Set();
            const accents = new Set();

            // Check main sections for background colors
            document.querySelectorAll('section, header, footer, div[class*="hero"], div[class*="container"]').forEach(el => {
                const bg = rgbToHex(window.getComputedStyle(el).backgroundColor);
                if (bg) backgrounds.add(bg);
            });

            // Check text elements
            document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a').forEach(el => {
                const color = rgbToHex(window.getComputedStyle(el).color);
                if (color) texts.add(color);
            });

            // Check buttons and CTAs
            primaryButtons.forEach(btn => {
                const styles = window.getComputedStyle(btn);
                const bg = rgbToHex(styles.backgroundColor);
                const color = rgbToHex(styles.color);
                if (bg && bg !== '#ffffff' && bg !== '#000000') accents.add(bg);
                if (color && color !== '#ffffff' && color !== '#000000') accents.add(color);
            });

            design.colors = {
                backgrounds: Array.from(backgrounds),
                texts: Array.from(texts),
                accents: Array.from(accents)
            };

            // Get detailed typography
            const typographyElements = {
                'h1': document.querySelector('h1'),
                'h2': document.querySelector('h2'),
                'h3': document.querySelector('h3'),
                'h4': document.querySelector('h4'),
                'h5': document.querySelector('h5'),
                'h6': document.querySelector('h6'),
                'body': document.querySelector('p'),
                'small': document.querySelector('small') || document.querySelector('.small')
            };

            Object.entries(typographyElements).forEach(([key, el]) => {
                if (el) {
                    const styles = window.getComputedStyle(el);
                    design.typography[key] = {
                        fontFamily: styles.fontFamily,
                        fontSize: styles.fontSize,
                        fontWeight: styles.fontWeight,
                        lineHeight: styles.lineHeight,
                        letterSpacing: styles.letterSpacing,
                        textTransform: styles.textTransform
                    };
                }
            });

            // Get spacing patterns
            const spacingValues = new Set();
            document.querySelectorAll('*').forEach(el => {
                const styles = window.getComputedStyle(el);
                ['padding', 'margin', 'gap'].forEach(prop => {
                    const value = styles[prop];
                    if (value && value !== '0px' && !value.includes('auto')) {
                        spacingValues.add(value);
                    }
                });
            });

            design.spacing = Array.from(spacingValues)
                .filter(v => v.match(/^\d+px$/))
                .map(v => parseInt(v))
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .sort((a, b) => a - b)
                .map(v => v + 'px');

            // Get shadows
            document.querySelectorAll('*').forEach(el => {
                const shadow = window.getComputedStyle(el).boxShadow;
                if (shadow && shadow !== 'none') {
                    design.shadows.push(shadow);
                }
            });

            // Get border radius values
            const radiusValues = new Set();
            document.querySelectorAll('button, div[class*="card"], div[class*="box"], input').forEach(el => {
                const radius = window.getComputedStyle(el).borderRadius;
                if (radius && radius !== '0px') {
                    radiusValues.add(radius);
                }
            });
            design.borders = Array.from(radiusValues);

            return design;
        });

        // MONDAY DETAILED EXTRACTION
        console.log('Extracting detailed Monday.com design...');
        await page.goto('https://monday.com/', { waitUntil: 'networkidle', timeout: 45000 });

        detailedDesign.monday = await page.evaluate(() => {
            const design = {
                animations: {},
                microInteractions: [],
                loadingPatterns: []
            };

            // Extract animation timings and easings
            const timings = new Set();
            const easings = new Set();

            document.querySelectorAll('*').forEach(el => {
                const styles = window.getComputedStyle(el);
                const transition = styles.transition;

                if (transition && transition !== 'none') {
                    // Extract timing
                    const timeMatch = transition.match(/(\d+\.?\d*)(s|ms)/);
                    if (timeMatch) {
                        timings.add(timeMatch[0]);
                    }

                    // Extract easing
                    const easingPatterns = [
                        'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear',
                        /cubic-bezier\([^)]+\)/
                    ];
                    easingPatterns.forEach(pattern => {
                        const match = typeof pattern === 'string'
                            ? transition.includes(pattern) && pattern
                            : transition.match(pattern);
                        if (match) {
                            easings.add(typeof match === 'string' ? match : match[0]);
                        }
                    });
                }

                // Check for transforms
                if (styles.transform && styles.transform !== 'none') {
                    design.microInteractions.push({
                        element: el.tagName.toLowerCase(),
                        transform: styles.transform,
                        transition: styles.transition
                    });
                }
            });

            design.animations = {
                timings: Array.from(timings),
                easings: Array.from(easings)
            };

            // Look for loading states
            document.querySelectorAll('[class*="loading"], [class*="skeleton"], [class*="shimmer"], [class*="spinner"]').forEach(el => {
                const styles = window.getComputedStyle(el);
                design.loadingPatterns.push({
                    className: el.className,
                    animation: styles.animation,
                    background: styles.background
                });
            });

            return design;
        });

        // Take additional screenshots
        console.log('Taking detail screenshots...');

        // Scroll and capture sections
        await page.goto('https://audiencelab.io/');
        await page.waitForTimeout(2000);

        // Capture hero section
        const hero = await page.$('section, [class*="hero"]');
        if (hero) {
            await hero.screenshot({
                path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/audiencelab-hero.png'
            });
        }

        // Capture buttons
        const button = await page.$('button, a[class*="btn"]');
        if (button) {
            await button.screenshot({
                path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/audiencelab-button.png'
            });
        }

        // Monday.com interactive elements
        await page.goto('https://monday.com/');
        await page.waitForTimeout(2000);

        // Capture navigation
        const nav = await page.$('nav, header');
        if (nav) {
            await nav.screenshot({
                path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/monday-navigation.png'
            });
        }

        // Save detailed results
        await fs.writeFile(
            'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/design-detailed-analysis.json',
            JSON.stringify(detailedDesign, null, 2)
        );

        console.log('Detailed extraction complete!');

    } catch (error) {
        console.error('Error:', error.message);
    }

    await browser.close();
})();