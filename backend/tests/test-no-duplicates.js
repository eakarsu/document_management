const fetch = require('node-fetch');

async function testNoDuplicates() {
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

  // Create document with AF Manual template
  const createRes = await fetch('http://localhost:4000/api/documents/create-with-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'Test No Duplicates',
      templateId: 'af-manual',
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

  console.log('\n=== Duplicate Check ===');
  console.log('Has headerHtml:', !!cf.headerHtml);
  console.log('headerHtml length:', cf.headerHtml ? cf.headerHtml.length : 0);

  // Check for duplicate headers in editableContent
  const editableContent = cf.editableContent || '';
  const hasHeaderInContent = editableContent.includes('BY ORDER OF') ||
                            editableContent.includes('DEPARTMENT OF THE AIR FORCE');

  console.log('Header in editableContent:', hasHeaderInContent);

  // Check for duplicate headers in htmlContent
  const htmlContent = cf.htmlContent || '';
  const headerCount = (htmlContent.match(/BY ORDER OF/g) || []).length;

  console.log('Number of "BY ORDER OF" in htmlContent:', headerCount);

  if (headerCount > 1) {
    console.log('\n❌ DUPLICATE HEADERS FOUND!');
    // Find positions of duplicates
    let pos = htmlContent.indexOf('BY ORDER OF');
    let positions = [];
    while (pos !== -1) {
      positions.push(pos);
      pos = htmlContent.indexOf('BY ORDER OF', pos + 1);
    }
    console.log('Header positions:', positions);
  } else if (headerCount === 1 && cf.headerHtml) {
    console.log('\n✅ NO DUPLICATES - Header properly separated');
  } else {
    console.log('\n⚠️ Unexpected state - check configuration');
  }

  // Clean up test document
  const deleteRes = await fetch(`http://localhost:4000/api/documents/${docId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (deleteRes.ok) {
    console.log('\nTest document cleaned up');
  }
}

testNoDuplicates().catch(console.error);