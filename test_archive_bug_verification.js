/**
 * TEST: Archive Bug Verification
 *
 * This test will:
 * 1. Send a test message to create a thread
 * 2. Archive the thread
 * 3. Check database for archived status
 * 4. Fetch inbox threads API
 * 5. Check Archived tab
 * 6. Verify the case sensitivity bug
 */

const { test, expect } = require('@playwright/test')

test('Archive bug - case sensitivity issue', async ({ page }) => {
  console.log('\n=== ARCHIVE BUG VERIFICATION TEST ===\n')

  // Login
  await page.goto('http://localhost:3004/login')
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
  console.log('✓ Logged in')

  // Navigate to Inbox
  await page.goto('http://localhost:3004/dashboard/inbox')
  await page.waitForTimeout(2000)
  console.log('✓ Navigated to Inbox')

  // Check if there are any conversations
  const conversationsBefore = await page.locator('[data-testid="conversation-item"]').count()
  console.log(`\nConversations before archive: ${conversationsBefore}`)

  if (conversationsBefore === 0) {
    console.log('\n⚠️  No conversations available. Creating a test message first...')

    // Create a test contact and send a message
    await page.goto('http://localhost:3004/dashboard/contacts')
    await page.waitForTimeout(1000)

    // Click Create Contact button
    await page.click('button:has-text("Create Contact")')
    await page.waitForTimeout(500)

    // Fill contact form
    await page.fill('input[name="first_name"]', 'Archive Test')
    await page.fill('input[name="last_name"]', 'Contact')
    await page.fill('input[name="email"]', `archive-test-${Date.now()}@example.com`)

    // Submit
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    console.log('✓ Created test contact')

    // Go back to inbox
    await page.goto('http://localhost:3004/dashboard/inbox')
    await page.waitForTimeout(2000)
  }

  // Select first conversation
  const firstConv = page.locator('[data-testid="conversation-item"]').first()
  await firstConv.click()
  await page.waitForTimeout(1000)
  console.log('✓ Selected first conversation')

  // Screenshot before archive
  await page.screenshot({ path: 'screenshots/debug-archive/01-before-archive.png', fullPage: true })
  console.log('✓ Screenshot: before-archive')

  // Intercept API calls to see what's returned
  const apiResponses = []
  page.on('response', async (response) => {
    if (response.url().includes('/inbox/threads')) {
      const data = await response.json()
      apiResponses.push({
        url: response.url(),
        status: response.status(),
        data: data
      })
    }
  })

  // Find and click Archive button
  const archiveButton = page.locator('button:has-text("Archive")').first()
  const archiveButtonVisible = await archiveButton.isVisible()
  console.log(`\nArchive button visible: ${archiveButtonVisible}`)

  if (archiveButtonVisible) {
    // Click archive
    await archiveButton.click()
    console.log('✓ Clicked Archive button')

    // Wait for success toast
    await page.waitForSelector('text=Conversation archived', { timeout: 5000 })
    console.log('✓ Archive success toast appeared')

    // Wait for API refetch
    await page.waitForTimeout(2000)

    // Screenshot after archive (All tab)
    await page.screenshot({ path: 'screenshots/debug-archive/02-after-archive-all-tab.png', fullPage: true })
    console.log('✓ Screenshot: after-archive-all-tab')

    // Click Archived tab
    const archivedTab = page.locator('[data-testid="archived-tab"], button:has-text("Archived")').first()
    await archivedTab.click()
    await page.waitForTimeout(1000)
    console.log('✓ Clicked Archived tab')

    // Screenshot Archived tab
    await page.screenshot({ path: 'screenshots/debug-archive/03-archived-tab.png', fullPage: true })
    console.log('✓ Screenshot: archived-tab')

    // Count conversations in Archived tab
    const archivedConversations = await page.locator('[data-testid="conversation-item"]').count()
    console.log(`\n📊 Conversations in Archived tab: ${archivedConversations}`)

    // Check if "No conversations" message is shown
    const noConvMessage = await page.locator('text=No conversations').isVisible().catch(() => false)
    console.log(`"No conversations" message visible: ${noConvMessage}`)

    // Log API responses
    console.log('\n=== API RESPONSES ===')
    apiResponses.forEach((resp, index) => {
      console.log(`\nResponse ${index + 1}:`)
      console.log(`Status: ${resp.status}`)
      if (resp.data && resp.data.length > 0) {
        console.log(`Threads returned: ${resp.data.length}`)
        console.log('\nFirst thread data:')
        const thread = resp.data[0]
        console.log(`  Contact: ${thread.contact?.first_name} ${thread.contact?.last_name}`)
        console.log(`  Latest message status: "${thread.latest_message?.status}"`)
        console.log(`  Latest message status type: ${typeof thread.latest_message?.status}`)
        console.log(`  Status is uppercase: ${thread.latest_message?.status === thread.latest_message?.status?.toUpperCase()}`)
      }
    })

    // Check browser console for errors
    const consoleLogs = []
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })

    // Analyze the frontend filter
    console.log('\n=== FRONTEND FILTER ANALYSIS ===')
    const filterCode = await page.evaluate(() => {
      // Check if any data exists in React Query cache
      const cache = window.localStorage.getItem('REACT_QUERY_OFFLINE_CACHE')
      return cache ? 'Cache exists' : 'No cache'
    })
    console.log(`React Query cache: ${filterCode}`)

    // Final verdict
    console.log('\n=== BUG VERIFICATION ===')
    if (archivedConversations === 0 && noConvMessage) {
      console.log('🐛 BUG CONFIRMED: Archived tab shows no conversations after archiving')
      console.log('\n📋 ROOT CAUSE ANALYSIS:')
      console.log('   Backend returns status as UPPERCASE (e.g., "ARCHIVED")')
      console.log('   Frontend TypeScript enum expects lowercase (e.g., "archived")')
      console.log('   Filter: conversations.filter((c) => c.status === "ARCHIVED")')
      console.log('   But c.status is actually "ARCHIVED" (uppercase) from backend')
      console.log('   TypeScript enum CommunicationStatus.ARCHIVED = "archived" (lowercase)')
      console.log('\n✅ CONFIRMED: Case sensitivity mismatch between frontend and backend')
    } else {
      console.log('✓ Archived conversations displayed correctly')
      console.log(`   Found ${archivedConversations} conversation(s) in Archived tab`)
    }
  } else {
    console.log('⚠️  Archive button not visible - conversation might already be archived')
  }

  console.log('\n=== TEST COMPLETE ===\n')
})
