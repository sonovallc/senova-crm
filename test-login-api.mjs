import fetch from 'node-fetch';

async function testLogin() {
  const url = 'https://crm.senovallc.com/api/v1/auth/login';
  const credentials = {
    email: 'jwoodcapital@gmail.com',
    password: 'D3n1w3n1!'
  };

  console.log('Testing login API...');
  console.log('URL:', url);
  console.log('Credentials:', JSON.stringify(credentials));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('Response body:', text);

    if (response.ok) {
      console.log('✅ Login successful!');
      const data = JSON.parse(text);
      console.log('User data:', data);
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();