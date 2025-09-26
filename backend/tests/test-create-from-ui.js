const fetch = require('node-fetch');

async function testCreateFromUI() {
  // Login
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@airforce.mil',
      password: 'testpass123'
    })
  });

  const { accessToken } = await loginRes.json();
  console.log('✅ Logged in');

  // Simulate what the UI does when creating a document with DAFMAN template
  const createRes = await fetch('http://localhost:4000/api/documents/create-with-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'UI Created DAFMAN Document',
      description: 'Testing header format',
      templateId: 'dafman-template',  // Now using correct template ID
      category: 'manual'
    })
  });

  if (!createRes.ok) {
    const error = await createRes.text();
    console.error('❌ Creation failed:', error);
    return;
  }

  const result = await createRes.json();
  const docId = result.document.id;
  console.log('✅ Created document:', docId);

  // Fetch to verify header is set up
  const getRes = await fetch(`http://localhost:4000/api/documents/${docId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const doc = await getRes.json();
  const cf = doc.document.customFields;

  console.log('\n📋 Document Creation Results:');
  console.log('='.repeat(40));
  console.log('Template ID used: dafman-template');
  console.log('Has headerHtml:', !!cf.headerHtml);
  console.log('headerHtml length:', cf.headerHtml ? cf.headerHtml.length : 0);
  console.log('Has formatted header:', cf.headerHtml ? cf.headerHtml.includes('header-table') : false);
  console.log('Has seal image:', cf.headerHtml ? cf.headerHtml.includes('<img') : false);

  console.log('\n🔗 URLs to check:');
  console.log(`Editor: http://localhost:3000/editor/${docId}`);
  console.log(`View: http://localhost:3000/documents/${docId}`);

  console.log('\n✅ The header should now be formatted in both pages!');
}

testCreateFromUI().catch(console.error);