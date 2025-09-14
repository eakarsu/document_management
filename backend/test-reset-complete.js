/**
 * Test to verify reset REALLY works and workflow state is correct
 */

const axios = require('axios');

async function testResetComplete() {
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
    
    // 2. Check CURRENT workflow status
    console.log('\n2. CURRENT workflow status BEFORE reset...');
    const beforeReset = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('BEFORE Reset:', {
      active: beforeReset.data.active,
      currentStage: beforeReset.data.currentStageName,
      stageId: beforeReset.data.currentStageId,
      workflowId: beforeReset.data.workflowId
    });
    
    // 3. Reset workflow
    console.log('\n3. Resetting workflow...');
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
      
      console.log('Reset response:', resetResponse.data);
    } catch (error) {
      console.error('❌ Reset failed:', error.response?.data || error.message);
      return;
    }
    
    // 4. Check workflow status AFTER reset
    console.log('\n4. Workflow status AFTER reset...');
    const afterReset = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('AFTER Reset:', {
      active: afterReset.data.active,
      currentStage: afterReset.data.currentStageName,
      stageId: afterReset.data.currentStageId,
      workflowId: afterReset.data.workflowId,
      message: afterReset.data.message
    });
    
    // 5. Check database directly via raw query
    console.log('\n5. Checking database directly...');
    const dbCheck = await axios.get(
      `http://localhost:4000/api/debug/workflow-instance/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    ).catch(err => {
      console.log('Debug endpoint not available, checking via workflow-instances endpoint');
      return null;
    });
    
    if (dbCheck && dbCheck.data) {
      console.log('Database shows:', dbCheck.data);
    }
    
    // 6. Try to advance workflow (should fail if inactive)
    console.log('\n6. Testing if workflow is REALLY inactive by trying to advance...');
    try {
      const advanceResponse = await axios.post(
        `http://localhost:4000/api/workflow-instances/${documentId}/advance`,
        { 
          targetStageId: '2',
          action: 'SUBMIT'
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('❌ PROBLEM: Workflow advanced even though it should be inactive!', advanceResponse.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ CORRECT: Cannot advance - no active workflow found');
      } else {
        console.error('Advance error:', error.response?.data || error.message);
      }
    }
    
    // 7. Start workflow to verify it's needed
    console.log('\n7. Starting workflow (should work if really inactive)...');
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
      console.error('Start error:', error.response?.data || error.message);
    }
    
    // 8. Final check
    console.log('\n8. FINAL workflow status...');
    const finalCheck = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('FINAL Status:', {
      active: finalCheck.data.active,
      currentStage: finalCheck.data.currentStageName,
      stageId: finalCheck.data.currentStageId
    });
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
  }
}

testResetComplete();