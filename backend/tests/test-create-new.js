const fetch = require('node-fetch');

async function testCreateNew() {
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

  // Create with DAFMAN template
  const createRes = await fetch('http://localhost:4000/api/documents/create-with-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'Test New After Fix',
      templateId: 'dafman-template',
      category: 'POLICY'
    })
  });

  const result = await createRes.json();
  console.log('Created:', result.document.id);

  // Fetch to check
  const getRes = await fetch(`http://localhost:4000/api/documents/${result.document.id}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const doc = await getRes.json();
  const cf = doc.document.customFields;
  
  console.log('\n=== Analysis ===');
  console.log('Has headerHtml:', !!cf.headerHtml);
  console.log('headerHtml length:', cf.headerHtml ? cf.headerHtml.length : 0);
  console.log('Has htmlContent with header:', cf.htmlContent ? cf.htmlContent.includes('BY ORDER OF') : false);
  
  if (cf.headerHtml) {
    console.log('\n=== headerHtml content (first 300 chars) ===');
    console.log(cf.headerHtml.substring(0, 300));
  }
  
  console.log('\n=== htmlContent check ===');
  console.log('Has <style>:', cf.htmlContent ? cf.htmlContent.includes('<style>') : false);
  console.log('Has header-table:', cf.htmlContent ? cf.htmlContent.includes('header-table') : false);
}

testCreateNew().catch(console.error);
