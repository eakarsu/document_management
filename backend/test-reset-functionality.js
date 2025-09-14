/**
 * Test reset functionality with the fixed backend
 */

const axios = require('axios');

async function testResetFunctionality() {
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@demo.mil',
      password: 'password123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully');
    
    const documentId = 'doc_technical_980lvau4';
    
    // 2. Reset workflow (should work even if inactive)
    console.log('\n2. Resetting workflow...');
    try {
      const resetResponse = await axios.post(
        `http://localhost:4000/api/workflow-instances/${documentId}/reset`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Reset successful:', resetResponse.data);
    } catch (error) {
      console.error('❌ Reset failed:', error.response?.data || error.message);
      return;
    }
    
    // 3. Check workflow status (should be inactive)
    console.log('\n3. Checking workflow status after reset...');
    const statusResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Workflow status:', {
      active: statusResponse.data.active,
      currentStage: statusResponse.data.currentStageName,
      message: statusResponse.data.message
    });
    
    // 4. Try to reset again (should work)
    console.log('\n4. Resetting workflow again (should work)...');
    try {
      const resetResponse2 = await axios.post(
        `http://localhost:4000/api/workflow-instances/${documentId}/reset`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Second reset successful:', resetResponse2.data);
    } catch (error) {
      console.error('❌ Second reset failed:', error.response?.data || error.message);
    }
    
    // 5. Start workflow after reset
    console.log('\n5. Starting workflow after reset...');
    try {
      const startResponse = await axios.post(
        `http://localhost:4000/api/workflow-instances/${documentId}/start`,
        { workflowId: 'document-review-workflow' },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Start successful:', startResponse.data);
    } catch (error) {
      console.error('❌ Start failed:', error.response?.data || error.message);
    }
    
    // 6. Final status check
    console.log('\n6. Final workflow status...');
    const finalResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Final workflow:', {
      active: finalResponse.data.active,
      currentStage: finalResponse.data.currentStageName
    });
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
  }
}

testResetFunctionality();