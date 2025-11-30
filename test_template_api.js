// Test template API to verify body_html is returned
const http = require('http');

async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:8000');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== TEMPLATE API TEST ===\n');

  // Login
  console.log('1. Logging in...');
  const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'admin@evebeautyma.com',
    password: 'TestPass123!'
  });
  if (loginRes.status !== 200) {
    console.log('Login failed:', loginRes.data);
    return;
  }
  const token = loginRes.data.access_token;
  console.log('✓ Login successful\n');

  // Get templates list
  console.log('2. Fetching templates list...');
  const templatesRes = await makeRequest('GET', '/api/v1/email-templates', null, token);
  console.log('Status:', templatesRes.status);

  if (templatesRes.status === 200 && templatesRes.data.items) {
    console.log(`✓ Found ${templatesRes.data.items.length} templates\n`);

    // Check first template
    const firstTemplate = templatesRes.data.items[0];
    console.log('3. First template details:');
    console.log('   - ID:', firstTemplate.id);
    console.log('   - Name:', firstTemplate.name);
    console.log('   - Subject:', firstTemplate.subject);
    console.log('   - body_html exists:', 'body_html' in firstTemplate);
    console.log('   - body_html length:', firstTemplate.body_html?.length || 0);
    console.log('   - body_html preview:', (firstTemplate.body_html || '').substring(0, 200));
    console.log();

    // Get single template by ID
    console.log('4. Fetching single template by ID...');
    const singleRes = await makeRequest('GET', `/api/v1/email-templates/${firstTemplate.id}`, null, token);
    console.log('Status:', singleRes.status);

    if (singleRes.status === 200) {
      const template = singleRes.data;
      console.log('Single template response:');
      console.log('   - ID:', template.id);
      console.log('   - Name:', template.name);
      console.log('   - Subject:', template.subject);
      console.log('   - body_html exists:', 'body_html' in template);
      console.log('   - body_html length:', template.body_html?.length || 0);
      console.log('   - body_html preview:', (template.body_html || '').substring(0, 200));

      if (template.body_html && template.body_html.length > 0) {
        console.log('\n✅ API RETURNS body_html CORRECTLY');
        console.log('   The bug is in the FRONTEND, not the API');
      } else {
        console.log('\n❌ API DOES NOT RETURN body_html');
        console.log('   The bug is in the BACKEND API');
      }
    }
  }
}

main().catch(console.error);
