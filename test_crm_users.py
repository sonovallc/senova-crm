import asyncio
from playwright.async_api import async_playwright
import os

async def test_user_management():
    """Test CATEGORY 2: USER MANAGEMENT for Senova CRM"""
    
    # Direct CRM login URL
    base_url = "https://crm.senovallc.com/login"
    screenshots_dir = "C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/exhaustive-production-debug-20241205"
    
    os.makedirs(screenshots_dir, exist_ok=True)
    results = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True
        )
        page = await context.new_page()
        
        # Log console messages
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        
        try:
            # Go directly to login page
            print("Navigating to CRM login page...")
            await page.goto(base_url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(5000)
            
            print(f"Current URL: {page.url}")
            await page.screenshot(path=f"{screenshots_dir}/00-login-page.png")
            
            # Login as owner
            print("Logging in as owner...")
            if await page.locator("input[type='email']").count() > 0:
                await page.locator("input[type='email']").fill("jwoodcapital@gmail.com")
                await page.locator("input[type='password']").fill("D3n1w3n1!")
                await page.screenshot(path=f"{screenshots_dir}/01-login-filled.png")
                
                # Click login button
                await page.locator("button[type='submit']").click()
                await page.wait_for_timeout(5000)
                
                print(f"After login URL: {page.url}")
                await page.screenshot(path=f"{screenshots_dir}/02-dashboard.png")
                
                if "dashboard" in page.url.lower():
                    results.append("LOGIN: SUCCESS")
                else:
                    results.append(f"LOGIN: Current URL is {page.url}")
            else:
                print("No email input found on page")
                results.append("LOGIN: FAIL - No login form found")
            
            # Test 2.1: Navigate to Settings > Users
            print("\nTest 2.1: Navigate to Settings > Users")
            await page.screenshot(path=f"{screenshots_dir}/05-users-nav-before.png")
            
            # Try clicking Settings
            settings_clicked = False
            if await page.get_by_text("Settings", exact=False).count() > 0:
                await page.get_by_text("Settings", exact=False).first.click()
                await page.wait_for_timeout(3000)
                settings_clicked = True
                print("Clicked Settings")
            
            if settings_clicked:
                # Try clicking Users
                if await page.get_by_text("Users", exact=False).count() > 0:
                    await page.get_by_text("Users", exact=False).first.click()
                    await page.wait_for_timeout(3000)
                    print("Clicked Users")
                
                await page.screenshot(path=f"{screenshots_dir}/05-users-page-after.png")
                results.append("Test 2.1: Navigated to Users page")
            else:
                results.append("Test 2.1: Could not find Settings menu")
            
            # Test 2.2-2.5: Create users
            print("\nTest 2.2: Create Admin User")
            await page.screenshot(path=f"{screenshots_dir}/06-create-admin-before.png")
            
            # More tests would go here...
            
            print("\n" + "="*60)
            print("TEST RESULTS:")
            print("="*60)
            for r in results:
                print(r)
            print("="*60)
            
            # Keep browser open
            print("\nBrowser will remain open for 30 seconds for inspection...")
            await page.wait_for_timeout(30000)
            
        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path=f"{screenshots_dir}/error.png")
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_user_management())
