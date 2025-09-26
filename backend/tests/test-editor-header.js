const fetch = require('node-fetch');

async function testEditorHeader() {
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
  console.log('Logged in');

  // Create document with DAFMAN template
  const createRes = await fetch('http://localhost:4000/api/documents/create-with-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'Editor Header Test',
      templateId: 'dafman-template',
      category: 'POLICY'
    })
  });

  const result = await createRes.json();
  const docId = result.document.id;
  console.log('Created document:', docId);

  // Fetch document
  const getRes = await fetch(`http://localhost:4000/api/documents/${docId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const doc = await getRes.json();
  const cf = doc.document.customFields;

  console.log('\n=== Editor Page Data Check ===');
  console.log('Document ID:', docId);
  console.log('Has headerHtml:', !!cf.headerHtml);
  console.log('headerHtml includes seal img:', cf.headerHtml ? cf.headerHtml.includes('<img') : false);
  console.log('headerHtml includes styles:', cf.headerHtml ? cf.headerHtml.includes('<style>') : false);
  console.log('headerHtml includes header-table:', cf.headerHtml ? cf.headerHtml.includes('header-table') : false);

  console.log('\n=== Content Separation ===');
  console.log('editableContent has header:', cf.editableContent ?
    (cf.editableContent.includes('BY ORDER OF') || cf.editableContent.includes('DEPARTMENT OF')) : false);
  console.log('editableContent starts with TOC:', cf.editableContent ?
    cf.editableContent.trim().startsWith('<h2>TABLE OF CONTENTS') : false);

  console.log('\n✅ Ready for viewing:');
  console.log(`Document View: http://localhost:3000/documents/${docId}`);
  console.log(`Editor View: http://localhost:3000/editor/${docId}`);

  console.log('\n📋 Summary:');
  console.log('- Header HTML stored separately in customFields.headerHtml');
  console.log('- Content without header stored in customFields.editableContent');
  console.log('- Both pages should display formatted header from headerHtml');
  console.log('- No duplicate headers should appear');

  console.log('\n(Document preserved for manual testing - not auto-deleted)');
}

testEditorHeader().catch(console.error);