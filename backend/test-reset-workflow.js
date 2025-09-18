const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testResetWorkflow() {
  try {
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';
    const baseUrl = 'http://localhost:4000';

    console.log('🔍 Testing Workflow Reset Behavior\n');
    console.log('='.repeat(50));

    // Check current state
    console.log('\n1. Current workflow state:');
    const currentWorkflow = await prisma.jsonWorkflowInstance.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' }
    });

    if (currentWorkflow) {
      console.log('   Instance ID:', currentWorkflow.id);
      console.log('   Is Active:', currentWorkflow.isActive);
      console.log('   Current Stage:', currentWorkflow.currentStageId);
      console.log('   Created:', currentWorkflow.createdAt);
    } else {
      console.log('   No workflow found');
    }

    // Login as admin
    console.log('\n2. Logging in as admin...');
    const adminLogin = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@airforce.mil',
      password: 'testpass123'
    });

    if (adminLogin.data.accessToken) {
      console.log('   ✅ Admin logged in');
      const adminToken = adminLogin.data.accessToken;

      // Reset workflow
      console.log('\n3. Resetting workflow...');
      try {
        const resetResponse = await axios.post(
          `${baseUrl}/api/workflow-instances/${documentId}/reset`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );
        console.log('   ✅ Workflow reset successful');
        console.log('   Response:', resetResponse.data);
      } catch (error) {
        console.log('   ❌ Reset failed:', error.response?.data || error.message);
      }

      // Check state after reset
      console.log('\n4. Workflow state after reset:');
      const afterReset = await prisma.jsonWorkflowInstance.findMany({
        where: { documentId },
        orderBy: { createdAt: 'desc' }
      });

      console.log('   Total workflow instances:', afterReset.length);
      if (afterReset.length > 0) {
        afterReset.forEach((instance, index) => {
          console.log(`   Instance ${index + 1}:`);
          console.log('     ID:', instance.id);
          console.log('     Is Active:', instance.isActive);
          console.log('     Stage:', instance.currentStageId);
          console.log('     Created:', instance.createdAt);
        });
      }

      // Login as ao1
      console.log('\n5. Logging in as ao1...');
      const ao1Login = await axios.post(`${baseUrl}/api/auth/login`, {
        email: 'ao1@airforce.mil',
        password: 'testpass123'
      });

      if (ao1Login.data.accessToken) {
        console.log('   ✅ AO1 logged in');
        const ao1Token = ao1Login.data.accessToken;

        // Check what ao1 sees
        console.log('\n6. Checking what ao1 sees...');
        try {
          const ao1Response = await axios.get(
            `${baseUrl}/api/workflow-instances/${documentId}`,
            {
              headers: {
                'Authorization': `Bearer ${ao1Token}`
              }
            }
          );
          console.log('   AO1 sees workflow:');
          console.log('     Active:', ao1Response.data.isActive || ao1Response.data.active);
          console.log('     Stage:', ao1Response.data.currentStageId);
        } catch (error) {
          console.log('   AO1 cannot see workflow:', error.response?.status, error.response?.data?.error);
        }

        // Check if there's any auto-start logic
        console.log('\n7. Checking if new workflow is auto-created...');

        // Wait a moment to see if anything changes
        await new Promise(resolve => setTimeout(resolve, 1000));

        const finalState = await prisma.jsonWorkflowInstance.findMany({
          where: { documentId },
          orderBy: { createdAt: 'desc' }
        });

        console.log('   Final workflow count:', finalState.length);
        if (finalState.length > afterReset.length) {
          console.log('   ⚠️ NEW WORKFLOW WAS AUTO-CREATED!');
          const newest = finalState[0];
          console.log('     New ID:', newest.id);
          console.log('     Is Active:', newest.isActive);
          console.log('     Created:', newest.createdAt);
        } else {
          console.log('   No new workflows were created');
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Summary:');
    console.log('- Workflow reset creates an INACTIVE workflow instance');
    console.log('- If ao1 still sees an active workflow, check for:');
    console.log('  1. Auto-start logic in the frontend');
    console.log('  2. Caching issues');
    console.log('  3. Multiple workflow instances');

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testResetWorkflow();