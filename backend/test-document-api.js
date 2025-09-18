const fetch = require('node-fetch');

async function testDocumentAPI() {
  try {
    // Login as admin
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@demo.mil',
        password: 'password123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.accessToken;
    console.log('✅ Logged in as admin');

    // Test document API
    const docId = 'cmflk2dek000djr0fl6s6106u';
    console.log('\nTesting document API for ID:', docId);

    const response = await fetch(`http://localhost:4000/api/documents/${docId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Document API Status:', response.status);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Document found!');
      console.log('Full response structure:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', data.error || data.message);
      console.log('Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDocumentAPI();