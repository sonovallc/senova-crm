import asyncio
from playwright.async_api import async_playwright
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
    
    os.makedirs(screenshots_dir, exist_ok=True)
    results = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True
        )
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Error: {err}"))
        
        try:
            print("Step 1: Navigating to CRM...")
            await page.goto(base_url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(5000)
            
            print("Current URL:", page.url)
            await page.screenshot(path=f"{screenshots_dir}/00-initial-page.png", full_page=True)
            
            # Login as owner
            print("Step 2: Looking for login form...")
            
            # Try different email input selectors
            email_input = None
            for selector in ["input[type=email]", "input[name=email]", "input[placeholder*=email i]", "#email"]:
                if await page.locator(selector).count() > 0:
                    email_input = selector
                    print(f"Found email input: {selector}")
                    break
            
            if email_input:
                await page.fill(email_input, owner_email)
                print("Filled email")
                
                # Try different password input selectors
                password_input = None
                for selector in ["input[type=password]", "input[name=password]", "input[placeholder*=password i]", "#password"]:
                    if await page.locator(selector).count() > 0:
                        password_input = selector
                        print(f"Found password input: {selector}")
                        break
                
                if password_input:
                    await page.fill(password_input, owner_password)
                    print("Filled password")
                    
                    # Try different submit button selectors
                    for selector in ["button[type=submit]", "button:has-text(Sign In)", "button:has-text(Login)", "input[type=submit]"]:
                        if await page.locator(selector).count() > 0:
                            print(f"Clicking submit: {selector}")
                            await page.click(selector)
                            break
                    
                    await page.wait_for_timeout(5000)
                    print("After login URL:", page.url)
                    await page.screenshot(path=f"{screenshots_dir}/01-after-login.png", full_page=True)
                    
                    # Check if login was successful
                    if "dashboard" in page.url.lower() or await page.locator("text=Dashboard").count() > 0:
                        results.append("LOGIN: SUCCESS - Logged in as owner")
                    else:
                        results.append("LOGIN: UNCERTAIN - Check screenshot")
                else:
                    results.append("LOGIN: FAIL - Could not find password input")
            else:
                results.append("LOGIN: FAIL - Could not find email input")
                print("Page content preview:")
                print(await page.content()[:500])
            
            # Test 2.1: Navigate to Settings > Users
            print("\nTest 2.1: Navigate to Settings > Users")
            await page.screenshot(path=f"{screenshots_dir}/05-users-nav-before.png", full_page=True)
            
            settings_clicked = False
            for selector in ["text=Settings", "a:has-text(Settings)", "[href*=settings]", "button:has-text(Settings)"]:
                if await page.locator(selector).count() > 0:
                    print(f"Clicking Settings: {selector}")
                    await page.click(selector)
                    settings_clicked = True
                    break
            
            if settings_clicked:
                await page.wait_for_timeout(3000)
                
                # Try to click Users
                for selector in ["text=Users", "a:has-text(Users)", "[href*=users]", "button:has-text(Users)"]:
                    if await page.locator(selector).count() > 0:
                        print(f"Clicking Users: {selector}")
                        await page.click(selector)
                        break
                
                await page.wait_for_timeout(3000)
                await page.screenshot(path=f"{screenshots_dir}/05-users-page-after.png", full_page=True)
                results.append("Test 2.1: ATTEMPTED - Check screenshot")
            else:
                await page.screenshot(path=f"{screenshots_dir}/05-users-page-after.png", full_page=True)
                results.append("Test 2.1: FAIL - Could not find Settings")
            
            # Print results so far
            print("\n" + "="*60)
            print("TEST RESULTS SO FAR")
            print("="*60)
            for result in results:
                print(result)
            print("="*60)
            
            await page.wait_for_timeout(10000)  # Keep browser open
            
        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path=f"{screenshots_dir}/error.png", full_page=True)
            results.append(f"ERROR: {str(e)}")
        
        finally:
            await browser.close()
            return results

if __name__ == "__main__":
    asyncio.run(test_user_management())
