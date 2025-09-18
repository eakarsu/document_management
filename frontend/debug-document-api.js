const fetch = require('node-fetch');

async function testDocumentAccess() {
  try {
    // Step 1: Login as OPR
    console.log('Step 1: Login as OPR user...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'opr@demo.mil', password: 'password123' })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful:', { email: loginData.user.email, userId: loginData.user.id });
    const token = loginData.accessToken;

    // Step 2: Test backend document endpoint directly
    console.log('\nStep 2: Testing backend document endpoint directly...');
    const backendResponse = await fetch('http://localhost:4000/api/documents/cmflk2dek000djr0fl6s6106u', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Backend response status:', backendResponse.status);
    const backendData = await backendResponse.json();
    console.log('Backend response:', JSON.stringify(backendData, null, 2).substring(0, 500));

    // Step 3: Test frontend API endpoint (which forwards to backend)
    console.log('\nStep 3: Testing frontend API endpoint...');
    const frontendResponse = await fetch('http://localhost:3000/api/documents/cmflk2dek000djr0fl6s6106u', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': `accessToken=${token}`
      }
    });

    console.log('Frontend response status:', frontendResponse.status);
    if (!frontendResponse.ok) {
      console.error('Frontend error:', await frontendResponse.text());
    } else {
      const frontendData = await frontendResponse.json();
      console.log('Frontend response:', JSON.stringify(frontendData, null, 2).substring(0, 500));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testDocumentAccess();