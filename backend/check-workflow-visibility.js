const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function checkWorkflowVisibility() {
  try {
    console.log('🔍 Checking Workflow Visibility for Admin vs AO1\n');
    console.log('='.repeat(60));

    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';
    const baseUrl = 'http://localhost:4000';

    // Check database directly
    console.log('\n1. DATABASE STATE:');
    const workflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (workflow) {
      console.log('   ✅ Active workflow found in database');
      console.log('   - Instance ID:', workflow.id);
      console.log('   - Workflow ID:', workflow.workflowId);
      console.log('   - Current Stage:', workflow.currentStageId);
      console.log('   - Is Active:', workflow.isActive);
      console.log('   - Created:', workflow.createdAt);
    } else {
      console.log('   ❌ No active workflow in database');
    }

    // Test admin access
    console.log('\n2. ADMIN API ACCESS:');
    const adminLogin = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@airforce.mil',
      password: 'testpass123'
    });

    if (adminLogin.data.accessToken) {
      const adminToken = adminLogin.data.accessToken;

      try {
        const adminResponse = await axios.get(
          `${baseUrl}/api/workflow-instances/${documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );

        console.log('   Admin sees:');
        console.log('   - Status:', adminResponse.status);
        console.log('   - isActive:', adminResponse.data.isActive);
        console.log('   - active:', adminResponse.data.active);
        console.log('   - currentStageId:', adminResponse.data.currentStageId);
      } catch (error) {
        console.log('   Admin error:', error.response?.status, error.response?.data?.error);
      }
    }

    // Test ao1 access
    console.log('\n3. AO1 API ACCESS:');
    const ao1Login = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'ao1@airforce.mil',
      password: 'testpass123'
    });

    if (ao1Login.data.accessToken) {
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

        console.log('   AO1 sees:');
        console.log('   - Status:', ao1Response.status);
        console.log('   - isActive:', ao1Response.data.isActive);
        console.log('   - active:', ao1Response.data.active);
        console.log('   - currentStageId:', ao1Response.data.currentStageId);
      } catch (error) {
        console.log('   AO1 error:', error.response?.status, error.response?.data?.error);
      }
    }

    console.log('\n4. ISSUE ANALYSIS:');
    if (workflow) {
      console.log('   Workflow EXISTS in database and is ACTIVE');
      console.log('   Both admin and ao1 should see it');
      console.log('   If admin doesn\'t see it in UI:');
      console.log('   - Clear browser cache (Ctrl+Shift+R)');
      console.log('   - Check if they\'re looking at the same document');
      console.log('   - Logout and login again');
    } else {
      console.log('   No active workflow in database');
      console.log('   Need to start a new workflow');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflowVisibility();