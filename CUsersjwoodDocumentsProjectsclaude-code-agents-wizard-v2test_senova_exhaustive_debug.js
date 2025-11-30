const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const screenshotsDir = path.join(__dirname, "screenshots", "debug-senova");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

const pages = [
    { name: "Homepage", url: "http://localhost:3004/", category: "main" },
    { name: "Platform", url: "http://localhost:3004/platform", category: "main" },
    { name: "Pricing", url: "http://localhost:3004/pricing", category: "main" },
    { name: "Demo", url: "http://localhost:3004/demo", category: "main" },
    { name: "Contact", url: "http://localhost:3004/contact", category: "main" },
    { name: "About", url: "http://localhost:3004/about", category: "main" },
    { name: "HIPAA", url: "http://localhost:3004/hipaa", category: "legal" },
    { name: "Security", url: "http://localhost:3004/security", category: "legal" },
    { name: "Privacy Policy", url: "http://localhost:3004/privacy-policy", category: "legal" },
    { name: "Terms of Service", url: "http://localhost:3004/terms-of-service", category: "legal" },
    { name: "CRM Solution", url: "http://localhost:3004/solutions/crm", category: "solution" },
    { name: "Audience Intelligence", url: "http://localhost:3004/solutions/audience-intelligence", category: "solution" },
    { name: "Patient Identification", url: "http://localhost:3004/solutions/patient-identification", category: "solution" },
    { name: "Campaign Activation", url: "http://localhost:3004/solutions/campaign-activation", category: "solution" },
    { name: "Analytics", url: "http://localhost:3004/solutions/analytics", category: "solution" },
    { name: "Medical Spas", url: "http://localhost:3004/industries/medical-spas", category: "industry" },
    { name: "Dermatology", url: "http://localhost:3004/industries/dermatology", category: "industry" },
    { name: "Plastic Surgery", url: "http://localhost:3004/industries/plastic-surgery", category: "industry" },
    { name: "Aesthetic Clinics", url: "http://localhost:3004/industries/aesthetic-clinics", category: "industry" }
];

async function main() {
    console.log("SENOVA CRM EXHAUSTIVE DEBUG VERIFICATION");
    console.log("Testing " + pages.length + " pages");

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    const results = [];

    for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        const result = {
            name: pageInfo.name,
            url: pageInfo.url,
            category: pageInfo.category,
            status: "PASS",
            errors: [],
            violations: [],
            screenshots: []
        };

        console.log("\n[" + (i + 1) + "/" + pages.length + "] Testing: " + pageInfo.name);

        try {
            const response = await page.goto(pageInfo.url, { waitUntil: "networkidle", timeout: 30000 });
            const status = response.status();

            if (status >= 400) {
                result.status = "FAIL";
                result.errors.push("HTTP " + status + " error");
                console.log("  X HTTP " + status + " error");
            } else {
                console.log("  OK Page loaded (HTTP " + status + ")");

                const textContent = await page.evaluate(() => document.body.innerText);

                // Check for violations
                if (textContent.includes("SOC 2 Certified")) {
                    result.status = "FAIL";
                    result.violations.push("Found SOC 2 Certified");
                    console.log("  X Found SOC 2 Certified");
                }

                if (textContent.includes("SMB")) {
                    result.status = "FAIL";
                    result.violations.push("Found SMB");
                    console.log("  X Found SMB");
                }

                // Take screenshot
                const screenshotName = pageInfo.category + "-" + pageInfo.name.toLowerCase().replace(/\s+/g, "-") + ".png";
                await page.screenshot({ path: path.join(screenshotsDir, screenshotName), fullPage: true });
                result.screenshots.push(screenshotName);
                console.log("  OK Screenshot taken");
            }
        } catch (error) {
            result.status = "FAIL";
            result.errors.push(error.message);
            console.log("  X Test failed: " + error.message);
        }

        results.push(result);
    }

    await browser.close();

    const totalPages = results.length;
    const passedPages = results.filter(r => r.status === "PASS").length;
    const failedPages = results.filter(r => r.status === "FAIL").length;
    const passRate = ((passedPages / totalPages) * 100).toFixed(2);

    console.log("\nSUMMARY:");
    console.log("Total: " + totalPages + ", Passed: " + passedPages + ", Failed: " + failedPages);
    console.log("Pass Rate: " + passRate + "%");

    fs.writeFileSync("senova-debug-results.json", JSON.stringify(results, null, 2));

    if (passRate === "100.00") {
        console.log("\nPRODUCTION READY");
    } else {
        console.log("\nNOT PRODUCTION READY");
    }

    process.exit(failedPages > 0 ? 1 : 0);
}

main().catch(console.error);
