const { chromium } = require('playwright');
const fs = require('fs').promises;

(async () => {
    console.log('Starting design analysis...');

    const browser = await chromium.launch({
        headless: false,
        timeout: 30000
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    const results = {
        audiencelab: {},
        monday: {}
    };

    try {
        // ANALYZE AUDIENCELAB.IO
        console.log('\n=== Analyzing AudienceLab.io ===\n');
        await page.goto('https://audiencelab.io/', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(3000);

        // Screenshot
        await page.screenshot({
            path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/audiencelab-main.png'
        });

        // Extract computed styles
        const audienceLabData = await page.evaluate(() => {
            // Helper to convert RGB to hex
            const rgbToHex = (rgb) => {
                if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return null;
                const match = rgb.match(/\d+/g);
                if (!match) return rgb;
                const [r, g, b] = match.map(Number);
                return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            };

            // Get unique colors
            const colorSet = new Set();
            document.querySelectorAll('*').forEach(el => {
                const styles = window.getComputedStyle(el);
                const bg = rgbToHex(styles.backgroundColor);
                const color = rgbToHex(styles.color);
                const border = rgbToHex(styles.borderColor);
                if (bg) colorSet.add(bg);
                if (color) colorSet.add(color);
                if (border) colorSet.add(border);
            });

            // Get typography
            const fonts = new Set();
            const headingStyles = {};

            document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button').forEach(el => {
                const styles = window.getComputedStyle(el);
                fonts.add(styles.fontFamily);

                if (el.tagName.match(/^H[1-6]$/)) {
                    headingStyles[el.tagName.toLowerCase()] = {
                        fontSize: styles.fontSize,
                        fontWeight: styles.fontWeight,
                        lineHeight: styles.lineHeight,
                        color: rgbToHex(styles.color)
                    };
                }
            });

            // Get button styles
            const buttons = [];
            document.querySelectorAll('button, a[class*="btn"], [class*="button"]').forEach((btn, i) => {
                if (i < 5) {
                    const styles = window.getComputedStyle(btn);
                    buttons.push({
                        background: rgbToHex(styles.backgroundColor) || styles.backgroundColor,
                        color: rgbToHex(styles.color),
                        padding: styles.padding,
                        borderRadius: styles.borderRadius,
                        border: styles.border,
                        fontSize: styles.fontSize,
                        fontWeight: styles.fontWeight
                    });
                }
            });

            return {
                colors: Array.from(colorSet).filter(c => c),
                fonts: Array.from(fonts),
                headings: headingStyles,
                buttons
            };
        });

        results.audiencelab = audienceLabData;
        console.log('AudienceLab colors found:', audienceLabData.colors.length);
        console.log('AudienceLab fonts:', audienceLabData.fonts);

        // ANALYZE MONDAY.COM
        console.log('\n=== Analyzing Monday.com ===\n');
        await page.goto('https://monday.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(3000);

        // Screenshot
        await page.screenshot({
            path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/design-reference/monday-main.png'
        });

        // Extract animations and transitions
        const mondayData = await page.evaluate(() => {
            const animations = [];
            const transitions = [];

            document.querySelectorAll('*').forEach(el => {
                const styles = window.getComputedStyle(el);

                if (styles.animation && styles.animation !== 'none' && styles.animation !== 'none 0s ease 0s 1 normal none running') {
                    animations.push(styles.animation);
                }

                if (styles.transition && styles.transition !== 'none' && styles.transition !== 'all 0s ease 0s') {
                    transitions.push(styles.transition);
                }
            });

            // Get hover states
            const hoverElements = [];
            document.querySelectorAll('button, a, [class*="hover"]').forEach((el, i) => {
                if (i < 10) {
                    const styles = window.getComputedStyle(el);
                    hoverElements.push({
                        tag: el.tagName,
                        transition: styles.transition,
                        cursor: styles.cursor,
                        transform: styles.transform
                    });
                }
            });

            return {
                animations: [...new Set(animations)],
                transitions: [...new Set(transitions)],
                hoverElements
            };
        });

        results.monday = mondayData;
        console.log('Monday animations found:', mondayData.animations.length);
        console.log('Monday transitions found:', mondayData.transitions.length);

    } catch (error) {
        console.error('Error during analysis:', error.message);
    }

    // Save results
    await fs.writeFile(
        'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/design-analysis-results.json',
        JSON.stringify(results, null, 2)
    );

    console.log('\n=== Analysis Complete ===');
    console.log('Results saved to design-analysis-results.json');

    await browser.close();
})();