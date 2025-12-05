import asyncio
from playwright.async_api import async_playwright
import time
import os

async def test_user_management():
    """Test CATEGORY 2: USER MANAGEMENT for Senova CRM production"""
    
    # Configuration
    base_url = "https://crm.senovallc.com"
    screenshots_dir = "C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/exhaustive-production-debug-20241205"
    owner_email = "jwoodcapital@gmail.com"
    owner_password = "D3n1w3n1!"
    admin_email = "testadmin@senovallc.com"
    admin_password = "TestAdmin123!"
    user_email = "testuser@senovallc.com"
    user_password = "TestUser123!"
    
    # Ensure screenshots directory exists
    os.makedirs(screenshots_dir, exist_ok=True)
    
    results = []
    
    async with async_playwright() as p:
        # Launch browser with visible UI for debugging
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page error: {err}"))
        
        try:
            # Initial login as owner
            print("Navigating to CRM and logging in as owner...")
            await page.goto(base_url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)
            
            # Check if we need to login
            if "login" in page.url.lower() or await page.locator("input[type=email], input[name=email]").is_visible():
                await page.fill("input[type=email], input[name=email]", owner_email)
                await page.fill("input[type=password], input[name=password]", owner_password)
                await page.click("button[type=submit]")
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(3000)
            
            # Test 2.1: Navigate to Settings > Users
            print("\nTest 2.1: Navigate to Settings > Users")
            await page.screenshot(path=f"{screenshots_dir}/05-users-nav-before.png", full_page=True)
            
            # Try to find Settings in sidebar or menu
            settings_found = False
            if await page.locator("text=Settings").is_visible():
                await page.click("text=Settings")
                settings_found = True
            elif await page.locator("[aria-label=Settings]").is_visible():
                await page.click("[aria-label=Settings]")
                settings_found = True
            elif await page.locator("a[href*=settings]").is_visible():
                await page.click("a[href*=settings]")
                settings_found = True
            
            if settings_found:
                await page.wait_for_timeout(2000)
                
                # Click on Users section
                if await page.locator("text=Users").is_visible():
                    await page.click("text=Users")
                elif await page.locator("a[href*=users]").is_visible():
                    await page.click("a[href*=users]")
                
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(2000)
                await page.screenshot(path=f"{screenshots_dir}/05-users-page-after.png", full_page=True)
                results.append("Test 2.1: PASS - Navigated to Users page")
            else:
                await page.screenshot(path=f"{screenshots_dir}/05-users-page-after.png", full_page=True)
                results.append("Test 2.1: FAIL - Could not find Settings menu")
            
            # Test 2.2: Create ADMIN user
            print("\nTest 2.2: Create ADMIN user")
            await page.screenshot(path=f"{screenshots_dir}/06-create-admin-before.png", full_page=True)
            
            # Look for Add User or Create User button
            add_button_found = False
            for selector in ["button:has-text(Add User)", "button:has-text(Create User)", "button:has-text(New User)"]:
                if await page.locator(selector).is_visible():
                    await page.click(selector)
                    add_button_found = True
                    break
            
            if add_button_found:
                await page.wait_for_timeout(2000)
                
                # Fill in admin user details
                await page.fill("input[type=email], input[name=email]", admin_email)
                await page.fill("input[type=password], input[name=password]", admin_password)
                
                # Fill name field if present
                if await page.locator("input[name=name]").is_visible():
                    await page.fill("input[name=name]", "Test Admin")
                
                # Select ADMIN role
                if await page.locator("select[name=role]").is_visible():
                    await page.select_option("select[name=role]", value="ADMIN")
                elif await page.locator("input[type=radio][value=ADMIN]").is_visible():
                    await page.click("input[type=radio][value=ADMIN]")
                elif await page.locator("text=ADMIN").is_visible():
                    await page.click("text=ADMIN")
                
                # Submit form
                for selector in ["button[type=submit]", "button:has-text(Create)", "button:has-text(Save)"]:
                    if await page.locator(selector).is_visible():
                        await page.click(selector)
                        break
                
                await page.wait_for_timeout(3000)
                await page.screenshot(path=f"{screenshots_dir}/06-create-admin-after.png", full_page=True)
                results.append("Test 2.2: ATTEMPTED - Created admin user (check screenshot for confirmation)")
            else:
                await page.screenshot(path=f"{screenshots_dir}/06-create-admin-after.png", full_page=True)
                results.append("Test 2.2: FAIL - Could not find Add User button")
            
            # Continue with more tests...
            print("\n" + "="*60)
            print("PARTIAL RESULTS")
            print("="*60)
            for result in results:
                print(result)
            
            # Keep browser open for review
            await page.wait_for_timeout(5000)
            
        except Exception as e:
            print(f"Error during testing: {e}")
            await page.screenshot(path=f"{screenshots_dir}/error-screenshot.png", full_page=True)
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_user_management())
