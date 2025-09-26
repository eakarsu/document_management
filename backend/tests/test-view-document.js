const fetch = require('node-fetch');

async function testViewDocument() {
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
      title: 'Test Header Display',
      templateId: 'af-instruction',
      category: 'POLICY'
    })
  });

  const result = await createRes.json();
  const docId = result.document.id;
  console.log('Document created:', docId);

  // Fetch via frontend API (like DocumentViewer does)
  const frontendRes = await fetch(`http://localhost:3000/api/documents/${docId}`, {
    headers: {
      'Cookie': `accessToken=${accessToken}`
    }
  });

  const frontendData = await frontendRes.json();
  
  console.log('\n=== Frontend API Response ===');
  console.log('Has document:', !!frontendData.document);
  console.log('Has customFields:', !!frontendData.document?.customFields);
  console.log('Has headerHtml:', !!frontendData.document?.customFields?.headerHtml);
  console.log('headerHtml length:', frontendData.document?.customFields?.headerHtml?.length || 0);
  
  if (frontendData.document?.customFields?.headerHtml) {
    const header = frontendData.document.customFields.headerHtml;
    console.log('\n=== Header Analysis ===');
    console.log('Has <style>:', header.includes('<style>'));
    console.log('Has .header-table:', header.includes('header-table'));
    console.log('Has .left-column:', header.includes('left-column'));
    console.log('Has .right-column:', header.includes('right-column'));
    console.log('\n=== First 500 chars of header ===');
    console.log(header.substring(0, 500));
  }
}

testViewDocument().catch(console.error);
