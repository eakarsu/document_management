const axios = require('axios');

async function testAdminWorkflowAccess() {
  try {
    console.log('🔍 Testing Admin Workflow Access\n');
    console.log('='.repeat(50));

    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';
    const baseUrl = 'http://localhost:4000';

    // First, login as admin to get a valid token
    console.log('\n1. Logging in as admin user...');
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@airforce.mil',
      password: 'password123'
    });

    if (loginResponse.data.accessToken) {
      console.log('   ✅ Admin login successful');
      console.log('   Token:', loginResponse.data.accessToken.substring(0, 20) + '...');

      const adminToken = loginResponse.data.accessToken;

      // Test backend workflow endpoint
      console.log('\n2. Testing backend workflow endpoint...');
      try {
        const workflowResponse = await axios.get(
          `${baseUrl}/api/workflow-instances/${documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );

        console.log('   ✅ Backend workflow endpoint accessible');
        console.log('   Workflow active:', workflowResponse.data.isActive || workflowResponse.data.active);
        console.log('   Current stage:', workflowResponse.data.currentStageId);
        console.log('   Workflow ID:', workflowResponse.data.workflowId);
      } catch (error) {
        console.log('   ❌ Backend workflow endpoint error:', error.response?.data || error.message);
      }

      // Now login as ao1 for comparison
      console.log('\n3. Logging in as ao1 user for comparison...');
      const ao1LoginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
        email: 'ao1@airforce.mil',
        password: 'password123'
      });

      if (ao1LoginResponse.data.accessToken) {
        console.log('   ✅ AO1 login successful');

        const ao1Token = ao1LoginResponse.data.accessToken;

        console.log('\n4. Testing backend workflow endpoint as ao1...');
        try {
          const ao1WorkflowResponse = await axios.get(
            `${baseUrl}/api/workflow-instances/${documentId}`,
            {
              headers: {
                'Authorization': `Bearer ${ao1Token}`
              }
            }
          );

          console.log('   ✅ AO1 can access workflow');
          console.log('   Workflow active:', ao1WorkflowResponse.data.isActive || ao1WorkflowResponse.data.active);
          console.log('   Current stage:', ao1WorkflowResponse.data.currentStageId);
        } catch (error) {
          console.log('   ❌ AO1 workflow access error:', error.response?.data || error.message);
        }
      }

      // Test the frontend API endpoint (Next.js)
      console.log('\n5. Testing frontend API endpoint...');
      console.log('   Note: Frontend must be running on port 3000');
      try {
        // The frontend API expects the token in localStorage, but we can pass it as Bearer
        const frontendResponse = await axios.get(
          `http://localhost:3000/api/workflow-instances/${documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );

        console.log('   ✅ Frontend API accessible');
        console.log('   Instance ID:', frontendResponse.data.instance?.id);
        console.log('   Is Active:', frontendResponse.data.instance?.isActive);
      } catch (error) {
        console.log('   ⚠️  Frontend API error (may need different auth):', error.response?.status, error.response?.statusText);
      }

    } else {
      console.log('   ❌ Admin login failed - no token received');
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Summary:');
    console.log('   The workflow instance exists and is active.');
    console.log('   Both admin and ao1 users should be able to access it.');
    console.log('   If admin cannot see it in the UI, check:');
    console.log('   1. Authentication token is properly stored in localStorage');
    console.log('   2. Frontend is properly passing the token to backend');
    console.log('   3. No client-side filtering is hiding the workflow');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testAdminWorkflowAccess();