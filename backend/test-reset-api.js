const fetch = require('node-fetch');

async function testResetAPI() {
  try {
    console.log('🧪 TESTING RESET API DIRECTLY');
    console.log('==============================\n');

    // Admin user credentials (you can get this from the test)
    const adminUserId = 'cmfn4899f0001hasx7wr9xgz0'; // admin@airforce.mil
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p'; // The document with active workflow

    // Simulate login to get token (we'll use a simple JWT for testing)
    const testToken = 'Bearer test-admin-token-' + adminUserId;

    console.log(`📋 Testing reset for document: ${documentId}`);
    console.log(`👤 Using admin user: ${adminUserId}`);

    // Call the backend reset API directly (backend runs on port 4000)
    const response = await fetch(`http://localhost:4000/api/workflow-instances/${documentId}/reset`, {
      method: 'POST',
      headers: {
        'Authorization': testToken,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response Status: ${response.status}`);

    const result = await response.json();
    console.log('📄 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ RESET API CALL SUCCEEDED');
    } else {
      console.log('❌ RESET API CALL FAILED');
    }

  } catch (error) {
    console.error('❌ Error testing reset API:', error);
  }
}

testResetAPI();