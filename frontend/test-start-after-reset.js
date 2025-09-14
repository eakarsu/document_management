/**
 * Test starting workflow after reset
 */

const axios = require('axios');

async function testStartAfterReset() {
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
    
    // 2. Check current workflow status
    console.log(`\n2. Checking current workflow status...`);
    const statusResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Current workflow:', {
      isActive: statusResponse.data.isActive,
      currentStage: statusResponse.data.currentStageName,
      id: statusResponse.data.id
    });
    
    // 3. Try to start workflow
    console.log('\n3. Attempting to start workflow...');
    
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
      
      console.log('Start response:', startResponse.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('❌ Cannot start:', error.response.data.error);
        
        // If workflow exists but is inactive, we need to reactivate it
        if (statusResponse.data.id && !statusResponse.data.isActive) {
          console.log('\n4. Workflow exists but is inactive. Reactivating...');
          
          // Try to update the existing workflow to active
          const updateResponse = await axios.patch(
            `http://localhost:4000/api/workflow-instances/${statusResponse.data.id}`,
            { isActive: true },
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Reactivation response:', updateResponse.data);
        }
      } else {
        throw error;
      }
    }
    
    // 5. Check final status
    console.log('\n5. Checking final workflow status...');
    const finalResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Final workflow:', {
      isActive: finalResponse.data.isActive,
      currentStage: finalResponse.data.currentStageName
    });
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
  }
}

testStartAfterReset();