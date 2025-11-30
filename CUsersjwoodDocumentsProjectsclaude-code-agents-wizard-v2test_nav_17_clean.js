const pw = require('playwright');
(async () => {
  const br = await pw.chromium.launch({ headless: false });
  const ctx = await br.newContext({ viewport: { width: 1920, height: 1080 } });
  const pg = await ctx.newPage();
  let pass = 0, fail = 0;
  const res = [];
  
  try {
    console.log('Login...');
    await pg.goto('http://localhost:3004');
    await pg.fill('input[type="email"]', 'admin@evebeautyma.com');
    await pg.fill('input[type="password"]', 'TestPass123!');
    await pg.click('button[type="submit"]');
    await pg.waitForURL('**/dashboard');
    await pg.waitForTimeout(2000);
    console.log('Logged in');
    
    const tests = [
      [1, 'Dashboard', 'a[href="/dashboard"]', null, '/dashboard'],
      [2, 'Contacts', 'a[href="/dashboard/contacts"]', null, '/dashboard/contacts'],
      [3, 'Inbox', 'a[href="/dashboard/inbox"]', null, '/dashboard/inbox'],
      [4, 'Email-Compose', 'a[href="/dashboard/email/compose"]', 'button:has-text("Email")', '/dashboard/email/compose'],
      [5, 'Email-Templates', 'a[href="/dashboard/email/templates"]', 'button:has-text("Email")', '/dashboard/email/templates'],
      [6, 'Email-Campaigns', 'a[href="/dashboard/email/campaigns"]', 'button:has-text("Email")', '/dashboard/email/campaigns'],
      [7, 'Email-Auto', 'a[href="/dashboard/email/autoresponders"]', 'button:has-text("Email")', '/dashboard/email/autoresponders'],
      [8, 'ActivityLog', 'a[href="/dashboard/activity-log"]', null, '/dashboard/activity-log'],
      [9, 'Payments', 'a[href="/dashboard/payments"]', null, '/dashboard/payments'],
      [10, 'AI', 'a[href="/dashboard/ai"]', null, '/dashboard/ai'],
      [11, 'Set-Users', 'a[href="/dashboard/settings/users"]', 'button:has-text("Settings")', '/dashboard/settings/users'],
      [12, 'Set-Tags', 'a[href="/dashboard/settings/tags"]', 'button:has-text("Settings")', '/dashboard/settings/tags'],
      [13, 'Set-Fields', 'a[href="/dashboard/settings/fields"]', 'button:has-text("Settings")', '/dashboard/settings/fields'],
      [14, 'Set-Email', 'a[href="/dashboard/settings/email"]', 'button:has-text("Settings")', '/dashboard/settings/email'],
      [15, 'Set-Flags', 'a[href="/dashboard/settings/feature-flags"]', 'button:has-text("Settings")', '/dashboard/settings/feature-flags'],
      [16, 'Set-Mailgun', 'a[href="/dashboard/settings/integrations/mailgun"]', 'button:has-text("Settings")', '/dashboard/settings/integrations/mailgun'],
      [17, 'Set-Closebot', 'a[href="/dashboard/settings/integrations/closebot"]', 'button:has-text("Settings")', '/dashboard/settings/integrations/closebot']
    ];
    
    for (const [id, name, sel, exp, expUrl] of tests) {
      console.log();
      try {
        if (exp) { try { await pg.locator(exp).first().click({ timeout: 2000 }); await pg.waitForTimeout(300); } catch(e) {} }
        await pg.locator(sel).first().click({ timeout: 5000 });
        await pg.waitForTimeout(1000);
        const url = new URL(pg.url()).pathname;
        const ok = url === expUrl;
        console.log(ok ?  : );
        if (ok) pass++; else fail++;
        res.push({ id, name, exp: expUrl, got: url, ok });
      } catch (e) {
        console.log();
        fail++;
        res.push({ id, name, exp: expUrl, got: 'ERROR', ok: false });
      }
    }
    
    console.log();
    console.log();
    console.log();
    console.log();
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await br.close();
  }
})();
undefined
