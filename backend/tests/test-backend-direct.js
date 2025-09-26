const fetch = require('node-fetch');

async function testBackendDirect() {
  // Login first
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@airforce.mil',
      password: 'testpass123'
    })
  });

  const { accessToken } = await loginRes.json();
  console.log('Logged in successfully');

  // Create a new document
  const createRes = await fetch('http://localhost:4000/api/documents/create-with-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'Test Direct Backend',
      templateId: 'af-manual',
      category: 'POLICY'
    })
  });

  const result = await createRes.json();
  const docId = result.document.id;
  console.log('Document created:', docId);

  // Fetch directly from backend
  const backendRes = await fetch(`http://localhost:4000/api/documents/${docId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const backendData = await backendRes.json();
  
  console.log('\n=== Backend Direct Response ===');
  console.log('Has document:', !!backendData.document);
  console.log('Has customFields:', !!backendData.document?.customFields);
  console.log('customFields keys:', Object.keys(backendData.document?.customFields || {}));
  console.log('Has headerHtml:', !!backendData.document?.customFields?.headerHtml);
  console.log('headerHtml length:', backendData.document?.customFields?.headerHtml?.length || 0);
  
  if (!backendData.document?.customFields?.headerHtml) {
    console.log('\n=== Checking what IS in customFields ===');
    const cf = backendData.document?.customFields || {};
    for (const key in cf) {
      const value = cf[key];
      if (typeof value === 'string') {
        console.log(`${key}: ${value.length} chars`);
      } else {
        console.log(`${key}:`, value);
      }
    }
  } else {
    console.log('\nHeader HTML found, first 200 chars:');
    console.log(backendData.document.customFields.headerHtml.substring(0, 200));
  }
}

testBackendDirect().catch(console.error);
