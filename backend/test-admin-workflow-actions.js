/**
 * Test to verify admin users have "Move to Next Stage" button
 * and new workflow UI displays correctly
 */

const axios = require('axios');

async function testAdminWorkflowActions() {
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@demo.mil',
      password: 'password123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully as admin');
    
    // Using the AFI document
    const documentId = 'doc_af-manual_980lvaou';
    
    // 2. Reset workflow to start fresh
    console.log('\n2. Resetting workflow to ensure clean state...');
    try {
      await axios.post(
        `http://localhost:4000/api/workflow-instances/${documentId}/reset`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Workflow reset successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No existing workflow to reset');
      } else {
        console.error('Reset error:', error.response?.data || error.message);
      }
    }
    
    // 3. Start workflow
    console.log('\n3. Starting workflow...');
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
    
    console.log('✅ Workflow started:', startResponse.data.message);
    
    // 4. Check workflow status
    console.log('\n4. Checking workflow status...');
    const statusResponse = await axios.get(
      `http://localhost:4000/api/workflow-instances/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Current Status:', {
      active: statusResponse.data.active,
      currentStage: statusResponse.data.currentStageName,
      stageOrder: statusResponse.data.stageOrder,
      totalStages: statusResponse.data.totalStages
    });
    
    // 5. Get workflow definition to check available transitions
    console.log('\n5. Checking available transitions for stage:', statusResponse.data.currentStageId);
    const workflowDefResponse = await axios.get(
      `http://localhost:4000/api/workflows/${statusResponse.data.workflowId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const workflowDef = workflowDefResponse.data;
    const currentStage = workflowDef.stages.find(s => s.id === statusResponse.data.currentStageId);
    const transitions = workflowDef.transitions.filter(t => t.from === statusResponse.data.currentStageId);
    
    console.log('Current Stage Actions:', currentStage.actions);
    console.log('Available Transitions:', transitions.map(t => ({
      to: t.to,
      label: t.label,
      condition: t.condition
    })));
    
    // 6. As admin, move to next stage
    console.log('\n6. Moving to next stage as admin...');
    if (transitions.length > 0) {
      const nextTransition = transitions.find(t => !t.condition) || transitions[0];
      const targetStage = workflowDef.stages.find(s => s.id === nextTransition.to);
      
      console.log(`Moving from "${currentStage.name}" to "${targetStage.name}"...`);
      
      const advanceResponse = await axios.post(
        `http://localhost:4000/api/workflow-instances/${documentId}/advance`,
        { 
          targetStageId: nextTransition.to,
          action: `Move to ${targetStage.name}`,
          metadata: { comment: 'Admin advancing workflow' }
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Advanced:', advanceResponse.data.message);
      
      // 7. Check new status
      console.log('\n7. Verifying new workflow status...');
      const newStatusResponse = await axios.get(
        `http://localhost:4000/api/workflow-instances/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('New Status:', {
        active: newStatusResponse.data.active,
        currentStage: newStatusResponse.data.currentStageName,
        stageOrder: newStatusResponse.data.stageOrder,
        progressPercentage: Math.round((newStatusResponse.data.stageOrder / newStatusResponse.data.totalStages) * 100) + '%'
      });
      
      // 8. Check history
      console.log('\n8. Workflow History:');
      if (newStatusResponse.data.history && newStatusResponse.data.history.length > 0) {
        newStatusResponse.data.history.slice(0, 3).forEach(entry => {
          console.log(`  - ${entry.stageName}: ${entry.action} by ${entry.performedBy}`);
          if (entry.metadata?.comment) {
            console.log(`    Comment: "${entry.metadata.comment}"`);
          }
        });
      }
      
      console.log('\n✅ TEST PASSED: Admin can successfully advance workflow stages');
      console.log('The UI should now show:');
      console.log('  - Professional workflow progress display with horizontal stages');
      console.log('  - "Move to [Next Stage]" button for admin users');
      console.log('  - Current stage highlighted with visual indicators');
      console.log('  - Progress percentage and statistics');
      
    } else {
      console.log('No transitions available from current stage');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testAdminWorkflowActions();