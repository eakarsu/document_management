const axios = require('axios');

async function testFrontendAPI() {
  try {
    console.log('🔍 Testing Frontend vs Backend API Response Structure\n');
    console.log('='.repeat(60));

    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

    // Login as admin
    console.log('\n1. LOGIN AS ADMIN:');
    const adminLogin = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@airforce.mil',
      password: 'testpass123'
    });

    const adminToken = adminLogin.data.accessToken;
    console.log('   ✅ Admin logged in');

    // Test BACKEND API
    console.log('\n2. BACKEND API Response (port 4000):');
    try {
      const backendResponse = await axios.get(
        `http://localhost:4000/api/workflow-instances/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      console.log('   Structure:');
      console.log('   - Top level keys:', Object.keys(backendResponse.data));
      console.log('   - active:', backendResponse.data.active);
      console.log('   - isActive:', backendResponse.data.isActive);
      console.log('   - instance:', !!backendResponse.data.instance);

    } catch (error) {
      console.log('   ❌ Error:', error.response?.status);
    }

    // Test FRONTEND API
    console.log('\n3. FRONTEND API Response (port 3000):');
    try {
      const frontendResponse = await axios.get(
        `http://localhost:3000/api/workflow-instances/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      console.log('   Structure:');
      console.log('   - Top level keys:', Object.keys(frontendResponse.data));
      console.log('   - success:', frontendResponse.data.success);
      console.log('   - instance:', !!frontendResponse.data.instance);

      if (frontendResponse.data.instance) {
        console.log('\n   Instance object:');
        console.log('   - instance.isActive:', frontendResponse.data.instance.isActive);
        console.log('   - instance.active:', frontendResponse.data.instance.active);
      }

      // Check what the component would see
      console.log('\n4. WHAT THE COMPONENT RECEIVES:');
      const instance = frontendResponse.data;
      console.log('   - instance.active:', instance.active);
      console.log('   - instance.isActive:', instance.isActive);
      console.log('   - instance.instance?.isActive:', instance.instance?.isActive);

      console.log('\n5. COMPONENT LOGIC CHECK:');
      const isActive = instance?.isActive ?? instance?.active;
      console.log('   Component would see isActive as:', isActive);

      if (!isActive) {
        console.log('   ❌ PROBLEM: Component sees workflow as INACTIVE!');
        console.log('   The frontend API wraps data in "instance" object');
        console.log('   But component expects data at top level');
      }

    } catch (error) {
      console.log('   ❌ Error:', error.response?.status, error.response?.data);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🔧 THE ISSUE:');
    console.log('   Frontend API returns: { success: true, instance: {...} }');
    console.log('   Component expects: { active: true, isActive: true, ... }');
    console.log('   Component receives the wrapper object, not the actual instance');
    console.log('\n   This causes admin to see "No active workflow"');
    console.log('   While ao1 might be getting data from a different source/cache');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFrontendAPI();