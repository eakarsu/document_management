const fetch = require('node-fetch');

async function testHeaderConsistency() {
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
  console.log('✅ Logged in as admin@airforce.mil');

  // Create document with DAFMAN template for consistency test
  const createRes = await fetch('http://localhost:4000/api/documents/create-with-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'Header Consistency Test Document',
      templateId: 'dafman-template',
      category: 'POLICY'
    })
  });

  const result = await createRes.json();
  const docId = result.document.id;
  console.log('✅ Created document:', docId);

  // Fetch document to verify header data
  const getRes = await fetch(`http://localhost:4000/api/documents/${docId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const doc = await getRes.json();
  const cf = doc.document.customFields;

  console.log('\n📋 HEADER CONSISTENCY CHECK');
  console.log('='.repeat(50));

  console.log('\n1️⃣ Data Structure:');
  console.log('   - Has headerHtml:', !!cf.headerHtml);
  console.log('   - headerHtml length:', cf.headerHtml ? cf.headerHtml.length : 0);
  console.log('   - Has styles:', cf.headerHtml ? cf.headerHtml.includes('<style>') : false);
  console.log('   - Has seal image:', cf.headerHtml ? cf.headerHtml.includes('<img') : false);
  console.log('   - Has header-table class:', cf.headerHtml ? cf.headerHtml.includes('header-table') : false);

  console.log('\n2️⃣ Content Separation:');
  console.log('   - editableContent has header:', cf.editableContent ?
    cf.editableContent.includes('BY ORDER OF') : false);
  console.log('   - htmlContent header count:',
    cf.htmlContent ? (cf.htmlContent.match(/BY ORDER OF/g) || []).length : 0);

  console.log('\n3️⃣ Header Elements Present:');
  if (cf.headerHtml) {
    console.log('   - BY ORDER OF:', cf.headerHtml.includes('BY ORDER OF'));
    console.log('   - DEPARTMENT OF THE AIR FORCE:', cf.headerHtml.includes('DEPARTMENT OF THE AIR FORCE'));
    console.log('   - Compliance section:', cf.headerHtml.includes('compliance-section'));
    console.log('   - Left column (seal):', cf.headerHtml.includes('left-column'));
    console.log('   - Right column (text):', cf.headerHtml.includes('right-column'));
  }

  console.log('\n4️⃣ URLs to Test:');
  console.log('   📄 Document View Page:');
  console.log(`      http://localhost:3000/documents/${docId}`);
  console.log('   ✏️ Editor Page:');
  console.log(`      http://localhost:3000/editor/${docId}`);

  console.log('\n5️⃣ Expected Behavior:');
  console.log('   ✅ Both pages should display the same formatted header');
  console.log('   ✅ Header should include Air Force seal image');
  console.log('   ✅ Header should have proper table layout');
  console.log('   ✅ No duplicate headers should appear');
  console.log('   ✅ Content should start after the header');

  console.log('\n' + '='.repeat(50));
  console.log('🎯 TEST COMPLETE - Document preserved for manual verification');
  console.log('   Please check both URLs above to confirm headers match');

  return docId;
}

testHeaderConsistency().catch(console.error);