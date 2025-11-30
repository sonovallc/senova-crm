// Test CORS directly with a simple fetch
const https = require('http');

console.log('Testing CORS preflight...\n');

// Test 1: OPTIONS request (preflight)
const optionsReq = https.request({
  hostname: 'localhost',
  port: 8000,
  path: '/api/v1/campaigns',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3004',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization,content-type'
  }
}, (res) => {
  console.log('OPTIONS Response Status:', res.statusCode);
  console.log('CORS Headers:');
  console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('  Access-Control-Allow-Credentials:', res.headers['access-control-allow-credentials']);
  console.log('  Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
  console.log('  Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
  console.log('\nAll headers:', res.headers);
});

optionsReq.on('error', (err) => {
  console.error('Error:', err.message);
});

optionsReq.end();
