// Direct API test for Bug #1: Contact Edit Persistence
const https = require('http');

const API_BASE = 'http://localhost:8000';

async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('=== BUG #1 API TEST: Contact Edit Persistence ===\n');

  // Step 1: Login
  console.log('Step 1: Logging in...');
  const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'admin@evebeautyma.com',
    password: 'TestPass123!'
  });

  if (loginRes.status !== 200) {
    console.log('❌ Login failed:', loginRes.data);
    return;
  }

  const token = loginRes.data.access_token;
  console.log('✓ Login successful\n');

  // Step 2: Get first contact
  console.log('Step 2: Getting contact list...');
  const contactsRes = await makeRequest('GET', '/api/v1/contacts/?page=1&page_size=1', null, token);

  if (contactsRes.status !== 200 || !contactsRes.data.items || contactsRes.data.items.length === 0) {
    console.log('❌ Failed to get contacts:', contactsRes.data);
    return;
  }

  const contact = contactsRes.data.items[0];
  console.log(`✓ Found contact: ${contact.first_name} ${contact.last_name} (ID: ${contact.id})\n`);

  // Step 3: Update the contact's first_name
  const timestamp = Date.now();
  const newFirstName = `EDITED_${timestamp}`;

  console.log(`Step 3: Updating first_name to "${newFirstName}"...`);
  const updateRes = await makeRequest('PUT', `/api/v1/contacts/${contact.id}`, {
    first_name: newFirstName
  }, token);

  console.log('Update response status:', updateRes.status);
  console.log('Update response data:', JSON.stringify(updateRes.data, null, 2).substring(0, 500));

  if (updateRes.status !== 200) {
    console.log('❌ Update failed!');
    return;
  }
  console.log('✓ Update returned 200 OK\n');

  // Step 4: Re-fetch the contact to verify persistence
  console.log('Step 4: Re-fetching contact to verify persistence...');
  const verifyRes = await makeRequest('GET', `/api/v1/contacts/${contact.id}`, null, token);

  if (verifyRes.status !== 200) {
    console.log('❌ Failed to re-fetch contact:', verifyRes.data);
    return;
  }

  const updatedContact = verifyRes.data;
  console.log(`Updated contact first_name: "${updatedContact.first_name}"`);
  console.log(`Expected: "${newFirstName}"`);

  if (updatedContact.first_name === newFirstName) {
    console.log('\n✅ SUCCESS! Contact edit persisted to database!');
    console.log('Bug #1 is FIXED!');
  } else {
    console.log('\n❌ FAILURE! Contact edit did NOT persist!');
    console.log(`Expected: "${newFirstName}"`);
    console.log(`Got: "${updatedContact.first_name}"`);
    console.log('Bug #1 is NOT fixed!');
  }
}

main().catch(console.error);
