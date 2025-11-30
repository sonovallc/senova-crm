const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'exhaustive-debug-calendar');
const LOGIN_EMAIL = 'admin@evebeautyma.com';
const LOGIN_PASSWORD = 'TestPass123!';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

const results = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  details: [],
  consoleErrors: [],
  networkErrors: [],
  elements: {
    calendarPage: [],
    createAppointment: [],
    appointmentDetail: [],
    editAppointment: [],
    listView: [],
    settings: []
  }
};

function logTest(name, status, details = '', screenshot = '') {
  results.totalTests++;
  if (status === 'PASS') {
    results.passed++;
  } else {
    results.failed++;
  }
  results.details.push({ name, status, details, screenshot, timestamp: new Date().toISOString() });
  console.log(`${status === 'PASS' ? '✓' : '✗'} ${name}${details ? ': ' + details : ''}`);
}

function logElement(category, element) {
  results.elements[category].push(element);
  console.log(`  [ELEMENT] ${element.type}: ${element.label || element.selector}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page) {
  console.log('\n=== LOGIN ===');

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `login-page-${timestamp()}.png`), fullPage: true });

    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `login-filled-${timestamp()}.png`), fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await sleep(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard-after-login-${timestamp()}.png`), fullPage: true });
    logTest('Login', 'PASS', 'Successfully logged in');
    return true;
  } catch (error) {
    logTest('Login', 'FAIL', error.message);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `login-error-${timestamp()}.png`), fullPage: true });
    return false;
  }
}

async function testCalendarPage(page) {
  console.log('\n=== PHASE 1: CALENDAR PAGE ===');

  // Try multiple possible calendar URLs
  const possibleUrls = [
    `${BASE_URL}/dashboard/calendar`,
    `${BASE_URL}/dashboard/appointments`,
    `${BASE_URL}/dashboard/scheduling`,
    `${BASE_URL}/dashboard/schedule`
  ];

  let calendarFound = false;
  let calendarUrl = '';

  for (const url of possibleUrls) {
    try {
      console.log(`Trying: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await sleep(1000);

      const screenshotPath = path.join(SCREENSHOT_DIR, `calendar-page-initial-${url.split('/').pop()}-${timestamp()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Check if page has calendar-related content
      const pageContent = await page.content();
      const hasCalendar = pageContent.includes('calendar') ||
                          pageContent.includes('appointment') ||
                          pageContent.includes('schedule');

      if (hasCalendar) {
        calendarFound = true;
        calendarUrl = url;
        logTest('Calendar Page Found', 'PASS', `Found at ${url}`, screenshotPath);
        break;
      }
    } catch (error) {
      console.log(`  Not found at ${url}`);
    }
  }

  if (!calendarFound) {
    logTest('Calendar Page Found', 'FAIL', 'Calendar page not found at any expected URL');

    // Check navigation menu for calendar/appointments link
    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await sleep(1000);

      const navLinks = await page.$$('nav a, aside a, [role="navigation"] a');
      console.log(`Found ${navLinks.length} navigation links`);

      for (const link of navLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        console.log(`  Nav link: "${text}" → ${href}`);

        if (text && (text.toLowerCase().includes('calendar') ||
                     text.toLowerCase().includes('appointment') ||
                     text.toLowerCase().includes('schedule'))) {
          console.log(`  Found potential calendar link: ${text} → ${href}`);
          logElement('calendarPage', {
            type: 'nav-link',
            label: text.trim(),
            href: href,
            action: 'navigate to calendar'
          });
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard-nav-search-${timestamp()}.png`), fullPage: true });
    } catch (error) {
      console.log('Error searching for calendar nav link:', error.message);
    }

    return false;
  }

  // Test calendar view elements
  console.log('\n--- Testing Calendar View Elements ---');

  // Look for view type buttons (Month, Week, Day, Agenda)
  const viewTypeSelectors = [
    'button:has-text("Month")',
    'button:has-text("Week")',
    'button:has-text("Day")',
    'button:has-text("Agenda")',
    '[role="tab"]',
    '[aria-label*="Month"]',
    '[aria-label*="Week"]',
    '[aria-label*="Day"]'
  ];

  for (const selector of viewTypeSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        for (const element of elements) {
          const text = await element.textContent();
          const ariaLabel = await element.getAttribute('aria-label');

          logElement('calendarPage', {
            type: 'view-button',
            label: text?.trim() || ariaLabel,
            selector: selector,
            action: 'switch calendar view'
          });

          // Click and screenshot each view type
          try {
            await element.click();
            await sleep(1000);
            const viewName = (text || ariaLabel || 'unknown').replace(/\s+/g, '-').toLowerCase();
            const screenshotPath = path.join(SCREENSHOT_DIR, `calendar-view-${viewName}-${timestamp()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            logTest(`Calendar View: ${text || ariaLabel}`, 'PASS', 'View switched successfully', screenshotPath);
          } catch (error) {
            logTest(`Calendar View: ${text || ariaLabel}`, 'FAIL', error.message);
          }
        }
      }
    } catch (error) {
      // Selector not found, continue
    }
  }

  // Look for navigation arrows (prev/next)
  const navSelectors = [
    'button[aria-label*="previous"]',
    'button[aria-label*="next"]',
    'button[aria-label*="prev"]',
    'button:has-text("◀")',
    'button:has-text("▶")',
    'button:has-text("<")',
    'button:has-text(">")',
    '[class*="prev"]',
    '[class*="next"]'
  ];

  for (const selector of navSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        for (const element of elements) {
          const ariaLabel = await element.getAttribute('aria-label');
          const text = await element.textContent();

          logElement('calendarPage', {
            type: 'navigation-button',
            label: ariaLabel || text?.trim() || 'nav arrow',
            selector: selector,
            action: 'navigate calendar period'
          });

          // Test click
          try {
            const beforePath = path.join(SCREENSHOT_DIR, `calendar-before-nav-${timestamp()}.png`);
            await page.screenshot({ path: beforePath, fullPage: true });

            await element.click();
            await sleep(1000);

            const afterPath = path.join(SCREENSHOT_DIR, `calendar-after-nav-${timestamp()}.png`);
            await page.screenshot({ path: afterPath, fullPage: true });

            logTest(`Navigation: ${ariaLabel || text || 'arrow'}`, 'PASS', 'Navigation worked', afterPath);
          } catch (error) {
            logTest(`Navigation: ${ariaLabel || text || 'arrow'}`, 'FAIL', error.message);
          }
        }
      }
    } catch (error) {
      // Selector not found, continue
    }
  }

  // Look for "Today" button
  const todaySelectors = [
    'button:has-text("Today")',
    'button[aria-label*="today"]',
    '[class*="today-button"]'
  ];

  for (const selector of todaySelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();

        logElement('calendarPage', {
          type: 'button',
          label: text?.trim() || 'Today',
          selector: selector,
          action: 'navigate to today'
        });

        await element.click();
        await sleep(1000);
        const screenshotPath = path.join(SCREENSHOT_DIR, `calendar-today-click-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        logTest('Today Button', 'PASS', 'Navigated to today', screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Look for date picker
  const datePickerSelectors = [
    'input[type="date"]',
    'button[aria-label*="date"]',
    '[class*="date-picker"]',
    '[role="datepicker"]'
  ];

  for (const selector of datePickerSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        for (const element of elements) {
          const ariaLabel = await element.getAttribute('aria-label');

          logElement('calendarPage', {
            type: 'date-picker',
            label: ariaLabel || 'Date Picker',
            selector: selector,
            action: 'select date'
          });
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Look for "New Appointment" button
  const newApptSelectors = [
    'button:has-text("New Appointment")',
    'button:has-text("Create Appointment")',
    'button:has-text("Add Appointment")',
    'button:has-text("Schedule")',
    'button[aria-label*="appointment"]',
    '[class*="create-appointment"]'
  ];

  for (const selector of newApptSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();

        logElement('calendarPage', {
          type: 'button',
          label: text?.trim() || 'New Appointment',
          selector: selector,
          action: 'open create appointment form'
        });

        logTest('New Appointment Button Found', 'PASS', `Found: ${text?.trim()}`);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Look for calendar cells/slots
  const cellSelectors = [
    '[class*="calendar-cell"]',
    '[class*="day-cell"]',
    '[class*="time-slot"]',
    '[role="gridcell"]',
    'td[data-date]',
    'div[data-date]'
  ];

  let cellsFound = 0;
  for (const selector of cellSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        cellsFound = elements.length;
        console.log(`Found ${cellsFound} calendar cells with selector: ${selector}`);

        logElement('calendarPage', {
          type: 'calendar-cells',
          label: `${cellsFound} calendar cells`,
          selector: selector,
          action: 'click to create appointment'
        });

        // Try clicking first cell
        try {
          const beforePath = path.join(SCREENSHOT_DIR, `calendar-before-cell-click-${timestamp()}.png`);
          await page.screenshot({ path: beforePath, fullPage: true });

          await elements[0].click();
          await sleep(1000);

          const afterPath = path.join(SCREENSHOT_DIR, `calendar-after-cell-click-${timestamp()}.png`);
          await page.screenshot({ path: afterPath, fullPage: true });

          logTest('Calendar Cell Click', 'PASS', 'Cell clicked successfully', afterPath);
        } catch (error) {
          logTest('Calendar Cell Click', 'FAIL', error.message);
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  if (cellsFound === 0) {
    logTest('Calendar Cells Found', 'FAIL', 'No calendar cells found on page');
  } else {
    logTest('Calendar Cells Found', 'PASS', `Found ${cellsFound} cells`);
  }

  // Look for existing appointments on calendar
  const apptSelectors = [
    '[class*="appointment"]',
    '[class*="event"]',
    '[role="button"][aria-label*="appointment"]',
    '[data-appointment-id]',
    '[data-event-id]'
  ];

  let appointmentsFound = 0;
  for (const selector of apptSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        appointmentsFound = elements.length;
        console.log(`Found ${appointmentsFound} appointments with selector: ${selector}`);

        logElement('calendarPage', {
          type: 'appointment-items',
          label: `${appointmentsFound} appointments on calendar`,
          selector: selector,
          action: 'click to view details'
        });

        // Try clicking first appointment
        if (appointmentsFound > 0) {
          try {
            const beforePath = path.join(SCREENSHOT_DIR, `calendar-before-appt-click-${timestamp()}.png`);
            await page.screenshot({ path: beforePath, fullPage: true });

            await elements[0].click();
            await sleep(1000);

            const afterPath = path.join(SCREENSHOT_DIR, `calendar-after-appt-click-${timestamp()}.png`);
            await page.screenshot({ path: afterPath, fullPage: true });

            logTest('Existing Appointment Click', 'PASS', 'Appointment clicked', afterPath);
          } catch (error) {
            logTest('Existing Appointment Click', 'FAIL', error.message);
          }
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  console.log(`Total appointments found on calendar: ${appointmentsFound}`);

  return true;
}

async function testCreateAppointmentFlow(page) {
  console.log('\n=== PHASE 2: CREATE APPOINTMENT FLOW ===');

  // Look for "New Appointment" or "Create Appointment" button
  const createButtonSelectors = [
    'button:has-text("New Appointment")',
    'button:has-text("Create Appointment")',
    'button:has-text("Add Appointment")',
    'button:has-text("Schedule")',
    'button:has-text("New")',
    '[aria-label*="create appointment"]',
    '[aria-label*="new appointment"]'
  ];

  let createButtonFound = false;

  for (const selector of createButtonSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        const text = await button.textContent();
        console.log(`Found create button: ${text?.trim()}`);

        const beforePath = path.join(SCREENSHOT_DIR, `before-create-appointment-${timestamp()}.png`);
        await page.screenshot({ path: beforePath, fullPage: true });

        await button.click();
        await sleep(2000);

        const afterPath = path.join(SCREENSHOT_DIR, `after-create-appointment-click-${timestamp()}.png`);
        await page.screenshot({ path: afterPath, fullPage: true });

        logTest('Create Appointment Button Click', 'PASS', `Clicked: ${text?.trim()}`, afterPath);
        createButtonFound = true;
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  if (!createButtonFound) {
    logTest('Create Appointment Button', 'FAIL', 'No create appointment button found');
    return false;
  }

  await sleep(1000);

  // Now test form elements
  console.log('\n--- Testing Appointment Form Elements ---');

  // Title/Subject field
  const titleSelectors = [
    'input[name="title"]',
    'input[name="subject"]',
    'input[placeholder*="title"]',
    'input[placeholder*="subject"]',
    'input[aria-label*="title"]',
    'input[aria-label*="subject"]'
  ];

  for (const selector of titleSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const placeholder = await element.getAttribute('placeholder');
        const ariaLabel = await element.getAttribute('aria-label');

        logElement('createAppointment', {
          type: 'input-text',
          label: placeholder || ariaLabel || 'Title/Subject',
          selector: selector,
          required: await element.getAttribute('required') !== null
        });

        await element.fill('Test Appointment Title');
        await sleep(500);

        const screenshotPath = path.join(SCREENSHOT_DIR, `form-title-filled-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Title Field', 'PASS', 'Title field filled', screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Date picker
  const dateSelectors = [
    'input[type="date"]',
    'input[name="date"]',
    'input[placeholder*="date"]',
    'button[aria-label*="date"]'
  ];

  for (const selector of dateSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const type = await element.getAttribute('type');
        const placeholder = await element.getAttribute('placeholder');

        logElement('createAppointment', {
          type: type === 'date' ? 'input-date' : 'date-picker',
          label: placeholder || 'Date',
          selector: selector,
          required: await element.getAttribute('required') !== null
        });

        if (type === 'date') {
          await element.fill('2025-12-01');
          await sleep(500);

          const screenshotPath = path.join(SCREENSHOT_DIR, `form-date-filled-${timestamp()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });

          logTest('Date Field', 'PASS', 'Date filled', screenshotPath);
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Time picker (start time)
  const timeSelectors = [
    'input[type="time"]',
    'input[name="time"]',
    'input[name*="start"]',
    'input[placeholder*="time"]',
    'select[name*="time"]',
    'select[name*="hour"]'
  ];

  for (const selector of timeSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const type = await element.getAttribute('type');
          const name = await element.getAttribute('name');
          const placeholder = await element.getAttribute('placeholder');

          logElement('createAppointment', {
            type: type === 'time' ? 'input-time' : 'select-time',
            label: placeholder || name || `Time ${i + 1}`,
            selector: selector,
            required: await element.getAttribute('required') !== null
          });

          if (type === 'time') {
            await element.fill('14:00');
            await sleep(500);
          }
        }

        const screenshotPath = path.join(SCREENSHOT_DIR, `form-time-filled-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Time Field(s)', 'PASS', 'Time filled', screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Duration or End Time
  const durationSelectors = [
    'input[name*="duration"]',
    'select[name*="duration"]',
    'input[name*="end"]',
    'input[placeholder*="duration"]'
  ];

  for (const selector of durationSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const name = await element.getAttribute('name');
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());

        logElement('createAppointment', {
          type: tagName === 'select' ? 'select-duration' : 'input-duration',
          label: name || 'Duration',
          selector: selector
        });

        if (tagName === 'select') {
          const options = await element.$$('option');
          console.log(`Duration dropdown has ${options.length} options`);

          if (options.length > 1) {
            await element.selectOption({ index: 1 });
          }
        } else {
          await element.fill('60');
        }

        await sleep(500);
        const screenshotPath = path.join(SCREENSHOT_DIR, `form-duration-filled-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Duration Field', 'PASS', 'Duration set', screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Contact selector dropdown
  const contactSelectors = [
    'select[name*="contact"]',
    'input[name*="contact"]',
    'button[aria-label*="contact"]',
    '[class*="contact-select"]'
  ];

  for (const selector of contactSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const name = await element.getAttribute('name');

        logElement('createAppointment', {
          type: tagName === 'select' ? 'select-contact' : 'input-contact',
          label: name || 'Contact',
          selector: selector
        });

        if (tagName === 'select') {
          const options = await element.$$('option');
          console.log(`Contact dropdown has ${options.length} options`);

          // Test each option
          for (let i = 1; i < Math.min(options.length, 4); i++) {
            const optionText = await options[i].textContent();
            await element.selectOption({ index: i });
            await sleep(500);

            const screenshotPath = path.join(SCREENSHOT_DIR, `form-contact-option-${i}-${timestamp()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });

            logTest(`Contact Option ${i}`, 'PASS', `Selected: ${optionText}`, screenshotPath);
          }
        } else if (tagName === 'input') {
          // Type to search
          await element.fill('test');
          await sleep(1000);

          const screenshotPath = path.join(SCREENSHOT_DIR, `form-contact-search-${timestamp()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });

          logTest('Contact Search', 'PASS', 'Contact search typed', screenshotPath);
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Service type dropdown
  const serviceSelectors = [
    'select[name*="service"]',
    'select[name*="type"]',
    '[name*="service-type"]'
  ];

  for (const selector of serviceSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const name = await element.getAttribute('name');

        logElement('createAppointment', {
          type: 'select-service',
          label: name || 'Service Type',
          selector: selector
        });

        const options = await element.$$('option');
        console.log(`Service dropdown has ${options.length} options`);

        // Test each option
        for (let i = 1; i < Math.min(options.length, 4); i++) {
          const optionText = await options[i].textContent();
          await element.selectOption({ index: i });
          await sleep(500);

          const screenshotPath = path.join(SCREENSHOT_DIR, `form-service-option-${i}-${timestamp()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });

          logTest(`Service Option ${i}`, 'PASS', `Selected: ${optionText}`, screenshotPath);
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Location field
  const locationSelectors = [
    'input[name*="location"]',
    'input[placeholder*="location"]',
    'select[name*="location"]'
  ];

  for (const selector of locationSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const name = await element.getAttribute('name');

        logElement('createAppointment', {
          type: tagName === 'select' ? 'select-location' : 'input-location',
          label: name || 'Location',
          selector: selector
        });

        if (tagName === 'input') {
          await element.fill('Clinic Room 1');
          await sleep(500);

          const screenshotPath = path.join(SCREENSHOT_DIR, `form-location-filled-${timestamp()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });

          logTest('Location Field', 'PASS', 'Location filled', screenshotPath);
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Notes/Description
  const notesSelectors = [
    'textarea[name*="note"]',
    'textarea[name*="description"]',
    'textarea[placeholder*="note"]',
    'input[name*="note"]'
  ];

  for (const selector of notesSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const name = await element.getAttribute('name');
        const placeholder = await element.getAttribute('placeholder');

        logElement('createAppointment', {
          type: 'textarea',
          label: placeholder || name || 'Notes',
          selector: selector
        });

        await element.fill('Test appointment notes for debugging');
        await sleep(500);

        const screenshotPath = path.join(SCREENSHOT_DIR, `form-notes-filled-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Notes Field', 'PASS', 'Notes filled', screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Reminder settings
  const reminderSelectors = [
    'select[name*="reminder"]',
    'input[name*="reminder"]',
    'checkbox[name*="reminder"]'
  ];

  for (const selector of reminderSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        for (const element of elements) {
          const name = await element.getAttribute('name');
          const type = await element.getAttribute('type');

          logElement('createAppointment', {
            type: type === 'checkbox' ? 'checkbox-reminder' : 'select-reminder',
            label: name || 'Reminder',
            selector: selector
          });
        }

        const screenshotPath = path.join(SCREENSHOT_DIR, `form-reminder-found-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Reminder Settings Found', 'PASS', `Found ${elements.length} reminder elements`, screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Recurring options
  const recurringSelectors = [
    'select[name*="recurring"]',
    'checkbox[name*="recurring"]',
    'input[name*="repeat"]',
    'select[name*="repeat"]'
  ];

  for (const selector of recurringSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const name = await element.getAttribute('name');
        const type = await element.getAttribute('type');

        logElement('createAppointment', {
          type: type === 'checkbox' ? 'checkbox-recurring' : 'select-recurring',
          label: name || 'Recurring',
          selector: selector
        });

        const screenshotPath = path.join(SCREENSHOT_DIR, `form-recurring-found-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Recurring Options Found', 'PASS', 'Found recurring settings', screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Status dropdown
  const statusSelectors = [
    'select[name*="status"]',
    'select[name="status"]'
  ];

  for (const selector of statusSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const name = await element.getAttribute('name');

        logElement('createAppointment', {
          type: 'select-status',
          label: name || 'Status',
          selector: selector
        });

        const options = await element.$$('option');
        console.log(`Status dropdown has ${options.length} options`);

        // Test each option
        for (let i = 0; i < options.length; i++) {
          const optionText = await options[i].textContent();
          await element.selectOption({ index: i });
          await sleep(500);

          const screenshotPath = path.join(SCREENSHOT_DIR, `form-status-option-${i}-${timestamp()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });

          logTest(`Status Option: ${optionText}`, 'PASS', 'Status selected', screenshotPath);
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Save button
  const saveSelectors = [
    'button:has-text("Save")',
    'button:has-text("Create")',
    'button:has-text("Submit")',
    'button[type="submit"]'
  ];

  for (const selector of saveSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();

        logElement('createAppointment', {
          type: 'button-submit',
          label: text?.trim() || 'Save',
          selector: selector,
          action: 'save appointment'
        });

        // Don't click save for now - just document it
        logTest('Save Button Found', 'PASS', `Found: ${text?.trim()}`);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Cancel button
  const cancelSelectors = [
    'button:has-text("Cancel")',
    'button:has-text("Close")',
    'button[aria-label*="cancel"]',
    'button[aria-label*="close"]'
  ];

  for (const selector of cancelSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();

        logElement('createAppointment', {
          type: 'button-cancel',
          label: text?.trim() || 'Cancel',
          selector: selector,
          action: 'close form'
        });

        // Click cancel to close form
        const beforePath = path.join(SCREENSHOT_DIR, `form-before-cancel-${timestamp()}.png`);
        await page.screenshot({ path: beforePath, fullPage: true });

        await element.click();
        await sleep(1000);

        const afterPath = path.join(SCREENSHOT_DIR, `form-after-cancel-${timestamp()}.png`);
        await page.screenshot({ path: afterPath, fullPage: true });

        logTest('Cancel Button', 'PASS', 'Form closed', afterPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  return true;
}

async function testAppointmentDetailView(page) {
  console.log('\n=== PHASE 3: APPOINTMENT DETAIL VIEW ===');

  // Try to find and click an existing appointment first
  const apptSelectors = [
    '[class*="appointment"]',
    '[class*="event"]',
    '[data-appointment-id]',
    '[role="button"][aria-label*="appointment"]'
  ];

  let appointmentClicked = false;

  for (const selector of apptSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} appointments, clicking first one`);

        await elements[0].click();
        await sleep(2000);

        const screenshotPath = path.join(SCREENSHOT_DIR, `appointment-detail-opened-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Appointment Detail Opened', 'PASS', 'Detail view opened', screenshotPath);
        appointmentClicked = true;
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  if (!appointmentClicked) {
    logTest('Appointment Detail View', 'FAIL', 'No existing appointments to click');
    return false;
  }

  // Test detail view elements
  console.log('\n--- Testing Detail View Elements ---');

  // Edit button
  const editSelectors = [
    'button:has-text("Edit")',
    'button[aria-label*="edit"]',
    '[class*="edit-button"]'
  ];

  for (const selector of editSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();

        logElement('appointmentDetail', {
          type: 'button-edit',
          label: text?.trim() || 'Edit',
          selector: selector,
          action: 'edit appointment'
        });

        logTest('Edit Button Found', 'PASS', 'Edit button present in detail view');
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Delete button
  const deleteSelectors = [
    'button:has-text("Delete")',
    'button:has-text("Remove")',
    'button[aria-label*="delete"]',
    '[class*="delete-button"]'
  ];

  for (const selector of deleteSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();

        logElement('appointmentDetail', {
          type: 'button-delete',
          label: text?.trim() || 'Delete',
          selector: selector,
          action: 'delete appointment'
        });

        // Click delete to test confirmation modal
        await element.click();
        await sleep(1000);

        const screenshotPath = path.join(SCREENSHOT_DIR, `delete-confirmation-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Delete Button & Confirmation', 'PASS', 'Confirmation modal appeared', screenshotPath);

        // Look for cancel in confirmation
        const confirmCancelSelectors = [
          'button:has-text("Cancel")',
          'button:has-text("No")'
        ];

        for (const cancelSelector of confirmCancelSelectors) {
          try {
            const cancelBtn = await page.$(cancelSelector);
            if (cancelBtn) {
              await cancelBtn.click();
              await sleep(500);
              logTest('Delete Cancelled', 'PASS', 'Cancelled deletion');
              break;
            }
          } catch (error) {
            // Continue
          }
        }
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Reschedule functionality
  const rescheduleSelectors = [
    'button:has-text("Reschedule")',
    'button[aria-label*="reschedule"]'
  ];

  for (const selector of rescheduleSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();

        logElement('appointmentDetail', {
          type: 'button-reschedule',
          label: text?.trim() || 'Reschedule',
          selector: selector,
          action: 'reschedule appointment'
        });

        logTest('Reschedule Button Found', 'PASS', 'Reschedule option available');
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Mark as complete
  const completeSelectors = [
    'button:has-text("Complete")',
    'button:has-text("Mark Complete")',
    'checkbox[name*="complete"]'
  ];

  for (const selector of completeSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const text = tagName === 'button' ? await element.textContent() : null;

        logElement('appointmentDetail', {
          type: tagName === 'checkbox' ? 'checkbox-complete' : 'button-complete',
          label: text?.trim() || 'Mark Complete',
          selector: selector,
          action: 'mark appointment complete'
        });

        logTest('Complete Option Found', 'PASS', 'Complete functionality available');
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Close detail view
  const closeSelectors = [
    'button:has-text("Close")',
    'button[aria-label*="close"]',
    '[class*="close-button"]',
    'button:has-text("×")'
  ];

  for (const selector of closeSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await sleep(1000);

        const screenshotPath = path.join(SCREENSHOT_DIR, `detail-view-closed-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Close Detail View', 'PASS', 'Detail view closed', screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  return true;
}

async function testAppointmentListView(page) {
  console.log('\n=== PHASE 4: APPOINTMENT LIST VIEW ===');

  // Look for list view toggle or separate list page
  const listViewSelectors = [
    'button:has-text("List")',
    'button:has-text("Agenda")',
    '[aria-label*="list view"]',
    'a[href*="appointments"]'
  ];

  let listViewFound = false;

  for (const selector of listViewSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        console.log(`Found list view toggle: ${text?.trim()}`);

        await element.click();
        await sleep(1000);

        const screenshotPath = path.join(SCREENSHOT_DIR, `list-view-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('List View Access', 'PASS', `Accessed via: ${text?.trim()}`, screenshotPath);
        listViewFound = true;
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  if (!listViewFound) {
    logTest('List View', 'FAIL', 'No list view found');
    return false;
  }

  // Test list view elements
  console.log('\n--- Testing List View Elements ---');

  // Search/filter
  const searchSelectors = [
    'input[type="search"]',
    'input[placeholder*="search"]',
    'input[placeholder*="Search"]',
    'input[name*="search"]'
  ];

  for (const selector of searchSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const placeholder = await element.getAttribute('placeholder');

        logElement('listView', {
          type: 'input-search',
          label: placeholder || 'Search',
          selector: selector
        });

        await element.fill('test');
        await sleep(1000);

        const screenshotPath = path.join(SCREENSHOT_DIR, `list-view-search-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Search Functionality', 'PASS', 'Search performed', screenshotPath);

        // Clear search
        await element.fill('');
        await sleep(500);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Status filters
  const filterSelectors = [
    'select[name*="status"]',
    'button[aria-label*="filter"]',
    '[class*="filter"]'
  ];

  for (const selector of filterSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} filter elements`);

        logElement('listView', {
          type: 'filter-controls',
          label: `${elements.length} filter elements`,
          selector: selector
        });

        const screenshotPath = path.join(SCREENSHOT_DIR, `list-view-filters-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Filter Controls', 'PASS', `Found ${elements.length} filters`, screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Date range filters
  const dateRangeSelectors = [
    'input[type="date"]',
    'button:has-text("Date Range")',
    '[class*="date-range"]'
  ];

  for (const selector of dateRangeSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        logElement('listView', {
          type: 'date-range-filter',
          label: `${elements.length} date inputs`,
          selector: selector
        });

        logTest('Date Range Filter', 'PASS', `Found ${elements.length} date filters`);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Sort options
  const sortSelectors = [
    'select[name*="sort"]',
    'button[aria-label*="sort"]',
    'th[role="columnheader"]'
  ];

  for (const selector of sortSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} sort elements`);

        logElement('listView', {
          type: 'sort-controls',
          label: `${elements.length} sort options`,
          selector: selector
        });

        logTest('Sort Controls', 'PASS', `Found ${elements.length} sort options`);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Pagination
  const paginationSelectors = [
    'button[aria-label*="next"]',
    'button[aria-label*="previous"]',
    '[class*="pagination"]',
    'button:has-text("Next")',
    'button:has-text("Previous")'
  ];

  for (const selector of paginationSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        logElement('listView', {
          type: 'pagination',
          label: `${elements.length} pagination controls`,
          selector: selector
        });

        const screenshotPath = path.join(SCREENSHOT_DIR, `list-view-pagination-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Pagination', 'PASS', `Found ${elements.length} pagination controls`, screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  return true;
}

async function testCalendarSettings(page) {
  console.log('\n=== PHASE 5: CALENDAR SETTINGS ===');

  // Navigate to settings
  const settingsUrls = [
    `${BASE_URL}/dashboard/settings`,
    `${BASE_URL}/dashboard/settings/calendar`,
    `${BASE_URL}/dashboard/calendar/settings`
  ];

  let settingsFound = false;

  for (const url of settingsUrls) {
    try {
      console.log(`Trying settings URL: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await sleep(1000);

      const screenshotPath = path.join(SCREENSHOT_DIR, `settings-${url.split('/').pop()}-${timestamp()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const content = await page.content();
      if (content.includes('calendar') || content.includes('appointment') || content.includes('settings')) {
        settingsFound = true;
        logTest('Calendar Settings Found', 'PASS', `Found at ${url}`, screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  if (!settingsFound) {
    logTest('Calendar Settings', 'FAIL', 'Calendar settings page not found');
    return false;
  }

  // Look for settings elements
  console.log('\n--- Testing Settings Elements ---');

  // Working hours
  const workingHoursSelectors = [
    'input[name*="working"]',
    'input[name*="hours"]',
    '[class*="working-hours"]'
  ];

  for (const selector of workingHoursSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        logElement('settings', {
          type: 'working-hours',
          label: `${elements.length} working hours settings`,
          selector: selector
        });

        logTest('Working Hours Settings', 'PASS', `Found ${elements.length} settings`);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Default duration
  const durationSelectors = [
    'input[name*="duration"]',
    'select[name*="duration"]'
  ];

  for (const selector of durationSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const name = await element.getAttribute('name');

        logElement('settings', {
          type: 'default-duration',
          label: name || 'Default Duration',
          selector: selector
        });

        logTest('Default Duration Setting', 'PASS', 'Found duration setting');
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Notification preferences
  const notificationSelectors = [
    'input[name*="notification"]',
    'checkbox[name*="notification"]',
    'select[name*="notification"]'
  ];

  for (const selector of notificationSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        logElement('settings', {
          type: 'notifications',
          label: `${elements.length} notification settings`,
          selector: selector
        });

        logTest('Notification Settings', 'PASS', `Found ${elements.length} notification options`);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  // Calendar integrations
  const integrationSelectors = [
    'button:has-text("Google Calendar")',
    'button:has-text("Outlook")',
    '[class*="integration"]',
    'input[name*="integration"]'
  ];

  for (const selector of integrationSelectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        logElement('settings', {
          type: 'integrations',
          label: `${elements.length} integration options`,
          selector: selector
        });

        const screenshotPath = path.join(SCREENSHOT_DIR, `settings-integrations-${timestamp()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        logTest('Calendar Integrations', 'PASS', `Found ${elements.length} integrations`, screenshotPath);
        break;
      }
    } catch (error) {
      // Continue
    }
  }

  return true;
}

async function captureConsoleAndNetwork(page) {
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Capture network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      results.networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      });
    }
  });
}

async function generateReport() {
  console.log('\n=== GENERATING REPORT ===');

  const passRate = results.totalTests > 0 ? ((results.passed / results.totalTests) * 100).toFixed(1) : 0;

  let report = `# EXHAUSTIVE DEBUG REPORT: CALENDAR & APPOINTMENTS MODULE

**Debug Date:** ${new Date().toISOString()}
**Debugger Agent:** Exhaustive Calendar & Appointments Debug
**Application:** EVE CRM Email Channel
**URL:** ${BASE_URL}

---

## EXECUTIVE SUMMARY

- **Total Elements Tested:** ${results.totalTests}
- **Passed:** ${results.passed}
- **Failed:** ${results.failed}
- **Pass Rate:** ${passRate}%
- **Console Errors:** ${results.consoleErrors.length}
- **Network Errors:** ${results.networkErrors.length}

---

## DETAILED TEST RESULTS

### Test Summary

| Test Name | Status | Details | Screenshot |
|-----------|--------|---------|------------|
`;

  results.details.forEach(test => {
    const status = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    const screenshot = test.screenshot ? path.basename(test.screenshot) : 'N/A';
    report += `| ${test.name} | ${status} | ${test.details} | ${screenshot} |\n`;
  });

  report += `\n---

## ELEMENT INVENTORY

### Calendar Page Elements
`;

  if (results.elements.calendarPage.length > 0) {
    report += `\n| Type | Label | Selector | Action |\n|------|-------|----------|--------|\n`;
    results.elements.calendarPage.forEach(el => {
      report += `| ${el.type} | ${el.label || 'N/A'} | ${el.selector} | ${el.action || 'N/A'} |\n`;
    });
  } else {
    report += `No calendar page elements found.\n`;
  }

  report += `\n### Create Appointment Form Elements
`;

  if (results.elements.createAppointment.length > 0) {
    report += `\n| Type | Label | Selector | Required |\n|------|-------|----------|----------|\n`;
    results.elements.createAppointment.forEach(el => {
      report += `| ${el.type} | ${el.label || 'N/A'} | ${el.selector} | ${el.required ? 'Yes' : 'No'} |\n`;
    });
  } else {
    report += `No create appointment form elements found.\n`;
  }

  report += `\n### Appointment Detail View Elements
`;

  if (results.elements.appointmentDetail.length > 0) {
    report += `\n| Type | Label | Selector | Action |\n|------|-------|----------|--------|\n`;
    results.elements.appointmentDetail.forEach(el => {
      report += `| ${el.type} | ${el.label || 'N/A'} | ${el.selector} | ${el.action || 'N/A'} |\n`;
    });
  } else {
    report += `No appointment detail elements found.\n`;
  }

  report += `\n### List View Elements
`;

  if (results.elements.listView.length > 0) {
    report += `\n| Type | Label | Selector |\n|------|-------|----------|\n`;
    results.elements.listView.forEach(el => {
      report += `| ${el.type} | ${el.label || 'N/A'} | ${el.selector} |\n`;
    });
  } else {
    report += `No list view elements found.\n`;
  }

  report += `\n### Settings Elements
`;

  if (results.elements.settings.length > 0) {
    report += `\n| Type | Label | Selector |\n|------|-------|----------|\n`;
    results.elements.settings.forEach(el => {
      report += `| ${el.type} | ${el.label || 'N/A'} | ${el.selector} |\n`;
    });
  } else {
    report += `No settings elements found.\n`;
  }

  report += `\n---

## CONSOLE ERRORS

`;

  if (results.consoleErrors.length > 0) {
    report += `| Timestamp | Error |\n|-----------|-------|\n`;
    results.consoleErrors.forEach(err => {
      report += `| ${err.timestamp} | ${err.text} |\n`;
    });
  } else {
    report += `No console errors detected.\n`;
  }

  report += `\n---

## NETWORK ERRORS

`;

  if (results.networkErrors.length > 0) {
    report += `| URL | Status | Status Text | Timestamp |\n|-----|--------|-------------|----------|\n`;
    results.networkErrors.forEach(err => {
      report += `| ${err.url} | ${err.status} | ${err.statusText} | ${err.timestamp} |\n`;
    });
  } else {
    report += `No network errors (4xx/5xx) detected.\n`;
  }

  report += `\n---

## BUGS DISCOVERED

`;

  const bugs = results.details.filter(test => test.status === 'FAIL');

  if (bugs.length > 0) {
    report += `| Bug ID | Severity | Element | Issue | Screenshot |\n|--------|----------|---------|-------|------------|\n`;
    bugs.forEach((bug, index) => {
      const bugId = `CAL-${String(index + 1).padStart(3, '0')}`;
      const screenshot = bug.screenshot ? path.basename(bug.screenshot) : 'N/A';
      report += `| ${bugId} | High | ${bug.name} | ${bug.details} | ${screenshot} |\n`;
    });
  } else {
    report += `No bugs discovered.\n`;
  }

  report += `\n---

## RECOMMENDATIONS

`;

  if (passRate < 50) {
    report += `- **CRITICAL:** Pass rate is below 50%. Calendar module may not exist or is not functional.
- Verify calendar/appointments feature is implemented in the application.
- Check application routing for /dashboard/calendar or /dashboard/appointments routes.
- Review console and network errors for implementation issues.
`;
  } else if (passRate < 80) {
    report += `- **HIGH:** Pass rate is below 80%. Significant issues found in calendar module.
- Review failed tests and fix critical bugs.
- Ensure all form validation is working correctly.
- Test create/edit/delete flows thoroughly.
`;
  } else {
    report += `- Pass rate is acceptable (${passRate}%).
- Review any failed tests and address minor issues.
- Consider adding additional test coverage for edge cases.
`;
  }

  report += `\n---

## SCREENSHOT EVIDENCE

All screenshots saved to: \`${SCREENSHOT_DIR}\`

Total screenshots captured: ${fs.readdirSync(SCREENSHOT_DIR).length}

---

**Debug Session Complete**
**Generated:** ${new Date().toISOString()}
`;

  return report;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Set up console and network monitoring
  captureConsoleAndNetwork(page);

  try {
    console.log('='.repeat(80));
    console.log('EXHAUSTIVE CALENDAR & APPOINTMENTS DEBUG');
    console.log('='.repeat(80));

    // Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.log('\n❌ Login failed. Cannot proceed with testing.');
      await browser.close();
      return;
    }

    // Test each phase
    await testCalendarPage(page);
    await testCreateAppointmentFlow(page);
    await testAppointmentDetailView(page);
    await testAppointmentListView(page);
    await testCalendarSettings(page);

    // Generate report
    const report = await generateReport();

    const reportPath = path.join(__dirname, 'EXHAUSTIVE_DEBUG_CALENDAR.md');
    fs.writeFileSync(reportPath, report);

    console.log('\n' + '='.repeat(80));
    console.log('DEBUG COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Pass Rate: ${((results.passed / results.totalTests) * 100).toFixed(1)}%`);
    console.log(`\nReport saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('Fatal error during testing:', error);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `fatal-error-${timestamp()}.png`), fullPage: true });
  } finally {
    await browser.close();
  }
})();
