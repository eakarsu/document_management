const fetch = require('node-fetch');

async function testCreateDocument() {
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

  // Create a new document with dafman template
  const createRes = await fetch('http://localhost:4000/api/documents/create-with-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'Test DAFMAN Format Check',
      templateId: 'dafman-template',
      category: 'POLICY'
    })
  });

  const result = await createRes.json();
  console.log('Document created:', result.document.id);

  // Now fetch it back to see what's stored
  const getRes = await fetch(`http://localhost:4000/api/documents/${result.document.id}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const doc = await getRes.json();
  const content = doc.document.customFields.htmlContent || doc.document.customFields.content;

  console.log('\n=== Content Analysis ===');
  console.log('Has <style> tag:', content.includes('<style>'));
  console.log('Has header-table class:', content.includes('header-table'));
  console.log('Has BY ORDER OF:', content.includes('BY ORDER OF'));
  console.log('Content length:', content.length);

  console.log('\n=== First 1000 chars ===');
  console.log(content.substring(0, 1000));

  // Save to file for inspection
  const fs = require('fs');
  fs.writeFileSync('test-document-content.html', content);
  console.log('\nFull content saved to test-document-content.html');

  return result.document.id;
}

testCreateDocument().catch(console.error);