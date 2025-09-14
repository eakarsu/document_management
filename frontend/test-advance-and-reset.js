/**
 * Test advancing workflow then resetting it
 */

const axios = require('axios');

async function testAdvanceAndReset() {
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
    
    // 2. Advance workflow to next stage
    console.log('\n2. Advancing workflow to next stage...');
    
    const advanceResponse = await axios.post(
      `http://localhost:4000/api/workflow-instances/${documentId}/advance`,
      {
        targetStageId: '2',
        action: 'UPLOAD_COMPLETE',
        metadata: { comment: 'Test advancement' }
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Advance response:', advanceResponse.data);
    
    // 3. Check current stage
    console.log('\n3. Checking current stage after advancement...');
    const statusResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Current workflow state:', {
      currentStage: statusResponse.data.currentStageName,
      stageId: statusResponse.data.currentStageId
    });
    
    // 4. Now reset the workflow
    console.log('\n4. Resetting workflow back to Stage 1...');
    
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
    
    // 5. Verify reset worked
    console.log('\n5. Verifying reset worked...');
    
    const verifyResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Final workflow state:', {
      currentStage: verifyResponse.data.currentStageName,
      stageId: verifyResponse.data.currentStageId
    });
    
    if (verifyResponse.data.currentStageName === 'Upload Document' && verifyResponse.data.currentStageId === '1') {
      console.log('\n✅ SUCCESS: Workflow advanced to Stage 2 then reset back to Stage 1!');
    } else {
      console.log('\n❌ FAILURE: Reset did not work properly');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
  }
}

testAdvanceAndReset();