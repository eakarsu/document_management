/**
 * Test and fix workflow reset functionality
 */

const axios = require('axios');

async function testResetWorkflow() {
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@demo.mil',
      password: 'password123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully');
    
    // 2. Get current workflow status
    const documentId = 'doc_technical_980lvau4';
    console.log(`\n2. Getting workflow status for document: ${documentId}`);
    
    const statusResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Current workflow state:', {
      currentStage: statusResponse.data.currentStageName,
      status: statusResponse.data.status,
      stageId: statusResponse.data.currentStageId
    });
    
    // 3. Test reset endpoint
    console.log('\n3. Testing reset endpoint...');
    
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
    
    console.log('Reset response:', resetResponse.data);
    
    // 4. Verify workflow was reset
    console.log('\n4. Verifying workflow was reset...');
    
    const verifyResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Workflow state after reset:', {
      currentStage: verifyResponse.data.currentStageName,
      status: verifyResponse.data.status,
      stageId: verifyResponse.data.currentStageId
    });
    
    // Check if reset worked
    if (verifyResponse.data.currentStageName === 'Upload Document') {
      console.log('\n✅ SUCCESS: Workflow was reset to Stage 1 (Upload Document)');
    } else {
      console.log(`\n❌ FAILURE: Workflow is still at ${verifyResponse.data.currentStageName}`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\nThe reset endpoint might not be registered. Let me check the routes...');
    }
  }
}

testResetWorkflow();