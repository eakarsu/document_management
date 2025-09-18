const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function debugAdminWorkflowVisibility() {
  try {
    console.log('🔍 Debugging Admin Workflow Visibility Issue\n');
    console.log('='.repeat(60));

    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';
    const baseUrl = 'http://localhost:4000';

    // Check the workflow instance directly
    console.log('\n1. DATABASE CHECK - Workflow Instance:');
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (workflowInstance) {
      console.log('   ✅ Active workflow found in database');
      console.log('   Instance ID:', workflowInstance.id);
      console.log('   Workflow ID:', workflowInstance.workflowId);
      console.log('   Current Stage:', workflowInstance.currentStageId);
      console.log('   Is Active:', workflowInstance.isActive);
      console.log('   Updated:', workflowInstance.updatedAt);
    } else {
      console.log('   ❌ No active workflow found');
    }

    // Login as admin and check API response
    console.log('\n2. API CHECK - Admin Login:');
    const adminLogin = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@airforce.mil',
      password: 'testpass123'
    });

    if (adminLogin.data.accessToken) {
      console.log('   ✅ Admin logged in successfully');
      const adminToken = adminLogin.data.accessToken;

      // Check workflow endpoint
      console.log('\n3. API CHECK - Workflow Endpoint as Admin:');
      try {
        const workflowResponse = await axios.get(
          `${baseUrl}/api/workflow-instances/${documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );

        console.log('   Response status:', workflowResponse.status);
        console.log('   Response data:');
        console.log('   - success:', workflowResponse.data.success);
        console.log('   - isActive:', workflowResponse.data.isActive);
        console.log('   - active:', workflowResponse.data.active);
        console.log('   - instance?.isActive:', workflowResponse.data.instance?.isActive);
        console.log('   - currentStageId:', workflowResponse.data.currentStageId);

        // Log full response for debugging
        console.log('\n   Full response structure:');
        console.log(JSON.stringify(workflowResponse.data, null, 2));

      } catch (error) {
        console.log('   ❌ Error fetching workflow:', error.response?.data || error.message);
      }
    }

    // Login as ao1 and check API response for comparison
    console.log('\n4. API CHECK - ao1 Login (for comparison):');
    const ao1Login = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'ao1@airforce.mil',
      password: 'testpass123'
    });

    if (ao1Login.data.accessToken) {
      console.log('   ✅ ao1 logged in successfully');
      const ao1Token = ao1Login.data.accessToken;

      try {
        const ao1Response = await axios.get(
          `${baseUrl}/api/workflow-instances/${documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${ao1Token}`
            }
          }
        );

        console.log('\n   ao1 Response:');
        console.log('   - success:', ao1Response.data.success);
        console.log('   - isActive:', ao1Response.data.isActive);
        console.log('   - active:', ao1Response.data.active);
        console.log('   - instance?.isActive:', ao1Response.data.instance?.isActive);

      } catch (error) {
        console.log('   ❌ Error:', error.response?.data || error.message);
      }
    }

    // Check if this is a workflow reset issue
    console.log('\n5. WORKFLOW RESET CHECK:');
    const allWorkflows = await prisma.jsonWorkflowInstance.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' }
    });

    console.log('   Total workflow instances for document:', allWorkflows.length);
    allWorkflows.forEach((wf, index) => {
      console.log(`   ${index + 1}. Created: ${wf.createdAt}, Active: ${wf.isActive}, Stage: ${wf.currentStageId}`);
    });

    // Check if it's related to the recent reset
    const mostRecent = allWorkflows[0];
    if (mostRecent && !mostRecent.isActive) {
      console.log('\n   ⚠️  Most recent workflow is INACTIVE!');
      console.log('   This happens after admin resets workflow.');
      console.log('   Workflow needs to be restarted.');
    }

    console.log('\n6. POSSIBLE CAUSES:');
    console.log('   1. Workflow was reset by admin (creates inactive instance)');
    console.log('   2. API returning different data for admin vs regular users');
    console.log('   3. Frontend caching issue');
    console.log('   4. Permission-based visibility rules');

    console.log('\n' + '='.repeat(60));
    console.log('\n🔧 SOLUTION:');
    console.log('   If workflow is inactive after reset:');
    console.log('   1. Click "Start Selected Workflow" button');
    console.log('   2. This will reactivate the workflow');
    console.log('   3. Then all users can see it again');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminWorkflowVisibility();