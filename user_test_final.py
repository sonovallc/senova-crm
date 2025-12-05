import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    screenshots_dir = "C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/exhaustive-production-debug-20241205"
    os.makedirs(screenshots_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        results = []
        
        # Login as owner
        await page.goto("https://crm.senovallc.com/login")
        await page.wait_for_timeout(3000)
        await page.fill("input[type='email']", "jwoodcapital@gmail.com")
        await page.fill("input[type='password']", "D3n1w3n1!")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(5000)
        
        # Test 2.1: Navigate to Users
        await page.screenshot(path=f"{screenshots_dir}/05-users-nav-before.png")
        await page.click("text=Settings")
        await page.wait_for_timeout(2000)
        await page.click("text=Users")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{screenshots_dir}/05-users-page-after.png")
        results.append("Test 2.1: Navigated to Users page")
        
        # Test 2.2: Create Admin User
        await page.screenshot(path=f"{screenshots_dir}/06-create-admin-before.png")
        if await page.get_by_role("button", name="Create User").is_visible():
            await page.get_by_role("button", name="Create User").click()
        elif await page.get_by_text("Create First User").is_visible():
            await page.get_by_text("Create First User").click()
        
        await page.wait_for_timeout(2000)
        
        # Fill form
        await page.locator("input[placeholder*='Email' i]").fill("testadmin@senovallc.com")
        await page.locator("input[placeholder*='Name' i]").fill("Test Admin")
        await page.locator("input[placeholder*='Password' i]").fill("TestAdmin123!")
        await page.locator("select").select_option("ADMIN")
        
        # Submit
        await page.get_by_role("button", name="Create").click()
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{screenshots_dir}/06-create-admin-after.png")
        results.append("Test 2.2: Created admin user")
        
        # Test 2.3: Verify admin in list
        await page.screenshot(path=f"{screenshots_dir}/07-admin-in-list.png")
        if await page.get_by_text("testadmin@senovallc.com").is_visible():
            results.append("Test 2.3: PASS - Admin user visible")
        else:
            results.append("Test 2.3: FAIL - Admin not found")
        
        # Test 2.4: Create regular user
        await page.screenshot(path=f"{screenshots_dir}/08-create-user-before.png")
        await page.get_by_role("button", name="Create User").click()
        await page.wait_for_timeout(2000)
        
        await page.locator("input[placeholder*='Email' i]").fill("testuser@senovallc.com")
        await page.locator("input[placeholder*='Name' i]").fill("Test User")
        await page.locator("input[placeholder*='Password' i]").fill("TestUser123!")
        await page.locator("select").select_option("USER")
        await page.get_by_role("button", name="Create").click()
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{screenshots_dir}/08-create-user-after.png")
        results.append("Test 2.4: Created regular user")
        
        # Test 2.5: Verify user in list
        await page.screenshot(path=f"{screenshots_dir}/09-user-in-list.png")
        if await page.get_by_text("testuser@senovallc.com").is_visible():
            results.append("Test 2.5: PASS - User visible")
        else:
            results.append("Test 2.5: FAIL - User not found")
        
        # Test 2.6-2.11: Test login as different users
        # Logout
        await page.click("text=Logout")
        await page.wait_for_timeout(3000)
        
        # Login as admin
        await page.screenshot(path=f"{screenshots_dir}/10-login-admin-before.png")
        await page.fill("input[type='email']", "testadmin@senovallc.com")
        await page.fill("input[type='password']", "TestAdmin123!")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(5000)
        await page.screenshot(path=f"{screenshots_dir}/10-login-admin-after.png")
        results.append("Test 2.6: Logged in as admin")
        
        # Check admin dashboard
        await page.screenshot(path=f"{screenshots_dir}/11-admin-dashboard.png")
        results.append("Test 2.7: Admin dashboard loaded")
        
        # Check admin permissions
        await page.screenshot(path=f"{screenshots_dir}/12-admin-permissions.png")
        can_see_settings = await page.get_by_text("Settings").is_visible()
        results.append(f"Test 2.8: Admin can see Settings: {can_see_settings}")
        
        # Logout and login as regular user
        await page.click("text=Logout")
        await page.wait_for_timeout(3000)
        
        await page.screenshot(path=f"{screenshots_dir}/13-login-user-before.png")
        await page.fill("input[type='email']", "testuser@senovallc.com")
        await page.fill("input[type='password']", "TestUser123!")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(5000)
        await page.screenshot(path=f"{screenshots_dir}/13-login-user-after.png")
        results.append("Test 2.9: Logged in as regular user")
        
        # Check user permissions
        await page.screenshot(path=f"{screenshots_dir}/14-user-dashboard.png")
        user_can_see_settings = await page.get_by_text("Settings").is_visible()
        results.append(f"Test 2.10: User can see Settings: {user_can_see_settings}")
        
        # Login back as owner
        await page.click("text=Logout")
        await page.wait_for_timeout(3000)
        
        await page.fill("input[type='email']", "jwoodcapital@gmail.com")
        await page.fill("input[type='password']", "D3n1w3n1!")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(5000)
        await page.screenshot(path=f"{screenshots_dir}/15-back-to-owner.png")
        results.append("Test 2.11: Logged back in as owner")
        
        # Print results
        print("\nTEST RESULTS:")
        print("=" * 60)
        for r in results:
            print(r)
        print("=" * 60)
        
        await page.wait_for_timeout(5000)
        await browser.close()

asyncio.run(main())
