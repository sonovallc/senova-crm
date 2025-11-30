# SYSTEM SCHEMA: SENOVA CRM WEBSITE

**Created:** November 28, 2025
**Last Updated:** 2025-11-28 08:50 UTC
**Last Full Audit:** 2025-11-28 08:50 UTC
**Application URL:** http://localhost:3004
**Current Status:** ❌ CRITICAL - Server Compilation Errors

## SITE ARCHITECTURE

### Main Navigation Pages (6)
- Home (/) - ❌ FAIL - Curly apostrophes
- About (/about) - ❌ FAIL - Curly apostrophes
- Platform (/platform) - ❌ FAIL - Curly apostrophes
- Pricing (/pricing) - ❌ FAIL - Curly apostrophes
- Contact (/contact) - ❌ FAIL - Curly apostrophes, wrong address
- Demo (/demo) - ❌ FAIL - Curly apostrophes

### Legal/Compliance Pages (1)
- HIPAA (/hipaa) - ❌ FAIL - Curly apostrophes

### Industry Pages (6)
- Medical Spas (/industries/medical-spas) - ❌ FAIL - Curly apostrophes
- Plastic Surgery (/industries/plastic-surgery) - ❌ FAIL - Curly apostrophes
- Dermatology (/industries/dermatology) - ❌ FAIL - Curly apostrophes
- Dental Practices (/industries/dental-practices) - ❌ FAIL - 404 Not Found
- Wellness Centers (/industries/wellness-centers) - ❌ FAIL - 404 Not Found
- Chiropractic (/industries/chiropractic) - ❌ FAIL - 404 Not Found

### Solution Pages (6)
- Audience Intelligence (/solutions/audience-intelligence) - ❌ FAIL - Curly apostrophes
- Campaign Activation (/solutions/campaign-activation) - ❌ FAIL - Curly apostrophes, wrong stats
- Multi-Channel Automation (/solutions/multi-channel-automation) - ❌ FAIL - 404 Not Found
- Revenue Attribution (/solutions/revenue-attribution) - ❌ FAIL - 404 Not Found
- AI Agents (/solutions/ai-agents) - ❌ FAIL - 404 Not Found
- Patient Journey (/solutions/patient-journey) - ❌ FAIL - 404 Not Found

## VERIFICATION SUMMARY (2025-11-28 Debug Session)

| Category | Total | Pass | Fail | Error Type |
|----------|-------|------|------|------------|
| Main Pages | 6 | 0 | 6 | Server 500 errors |
| Legal Pages | 4 | 1 | 3 | HIPAA passes, others fail |
| Solution Pages | 5 | 1 | 4 | CRM passes, others fail |
| **TOTAL** | **15** | **2** | **13** | **13.3% Pass Rate** |

**Production Status:** ❌ NOT READY - Critical server compilation errors
**Root Cause:** Curly quotes in TypeScript/JSX files causing compilation failures
**Required Fix:** Replace all curly quotes with straight quotes and restart server
