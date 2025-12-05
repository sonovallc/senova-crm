import asyncio
from playwright.async_api import async_playwright
import os

async def test_user_management():
    """Test CATEGORY 2: USER MANAGEMENT for Senova CRM production"""
    
    base_url = "https://crm.senovallc.com"
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
        
        try:
            # Navigate to site
            print("Navigating to CRM...")
            await page.goto(base_url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(5000)
            
            print("Current URL:", page.url)
            await page.screenshot(path=f"{screenshots_dir}/00-initial.png")
            
            # Login
            print("Attempting login...")
            if await page.locator("input[type='email']").count() > 0:
                await page.fill("input[type='email']", "jwoodcapital@gmail.com")
                await page.fill("input[type='password']", "D3n1w3n1!")
                await page.click("button[type='submit']")
                await page.wait_for_timeout(5000)
                print("Login submitted, new URL:", page.url)
                await page.screenshot(path=f"{screenshots_dir}/01-after-login.png")
            
            # Test 2.1: Navigate to Settings > Users
            print("Test 2.1: Navigating to Settings...")
            await page.screenshot(path=f"{screenshots_dir}/05-users-nav-before.png")
            
            # Click Settings
            if await page.get_by_text("Settings").count() > 0:
                await page.get_by_text("Settings").click()
                await page.wait_for_timeout(3000)
                print("Clicked Settings")
                
                # Click Users
                if await page.get_by_text("Users").count() > 0:
                    await page.get_by_text("Users").click()
                    await page.wait_for_timeout(3000)
                    print("Clicked Users")
            
            await page.screenshot(path=f"{screenshots_dir}/05-users-page-after.png")
            results.append("Test 2.1: Completed - Check screenshot")
            
            # Test 2.2: Create Admin User
            print("Test 2.2: Creating Admin user...")
            await page.screenshot(path=f"{screenshots_dir}/06-create-admin-before.png")
            
            # Look for Add User button
            if await page.get_by_role("button", name="Add User").count() > 0:
                await page.get_by_role("button", name="Add User").click()
            elif await page.get_by_text("Add User").count() > 0:
                await page.get_by_text("Add User").click()
            elif await page.get_by_text("Create User").count() > 0:
                await page.get_by_text("Create User").click()
            
            await page.wait_for_timeout(3000)
            
            # Fill form if visible
            if await page.locator("input[type='email']").count() > 0:
                await page.locator("input[type='email']").last.fill("testadmin@senovallc.com")
                await page.locator("input[type='password']").last.fill("TestAdmin123!")
                
                # Set role to ADMIN
                if await page.locator("select").count() > 0:
                    await page.locator("select").select_option("ADMIN")
                
                # Submit
                if await page.get_by_role("button", name="Create").count() > 0:
                    await page.get_by_role("button", name="Create").click()
                elif await page.get_by_role("button", name="Save").count() > 0:
                    await page.get_by_role("button", name="Save").click()
                elif await page.locator("button[type='submit']").count() > 0:
                    await page.locator("button[type='submit']").last.click()
            
            await page.wait_for_timeout(3000)
            await page.screenshot(path=f"{screenshots_dir}/06-create-admin-after.png")
            results.append("Test 2.2: Completed - Check screenshot")
            
            # Test 2.3: Verify admin in list
            await page.screenshot(path=f"{screenshots_dir}/07-admin-in-list.png")
            if await page.get_by_text("testadmin@senovallc.com").count() > 0:
                results.append("Test 2.3: PASS - Admin visible in list")
            else:
                results.append("Test 2.3: Admin not visible - Check screenshot")
            
            # Continue with more tests as needed...
            
            print("\nRESULTS:")
            for r in results:
                print(r)
            
            # Keep browser open for manual inspection
            await page.wait_for_timeout(30000)
            
        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path=f"{screenshots_dir}/error.png")
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_user_management())
