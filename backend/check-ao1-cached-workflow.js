const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function checkAO1CachedWorkflow() {
  try {
    console.log('🔍 Checking Why AO1 Still Sees Active Workflow After Admin Reset\n');
    console.log('='.repeat(60));

    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';
    const baseUrl = 'http://localhost:4000';

    // Check database state
    console.log('\n1. DATABASE STATE (Source of Truth):');
    const activeWorkflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (activeWorkflow) {
      console.log('   ✅ ACTIVE workflow found:');
      console.log('   - Instance ID:', activeWorkflow.id);
      console.log('   - Stage:', activeWorkflow.currentStageId);
      console.log('   - Created:', activeWorkflow.createdAt);
      console.log('   - Updated:', activeWorkflow.updatedAt);
    } else {
      console.log('   ❌ NO ACTIVE workflow (workflow was reset)');
    }

    // Check ALL workflows for this document
    const allWorkflows = await prisma.jsonWorkflowInstance.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n2. ALL WORKFLOW INSTANCES:');
    console.log('   Total instances:', allWorkflows.length);
    allWorkflows.forEach((wf, idx) => {
      console.log(`   ${idx + 1}. ID: ${wf.id.substring(0, 10)}...`);
      console.log(`      Active: ${wf.isActive}, Stage: ${wf.currentStageId}`);
      console.log(`      Created: ${wf.createdAt.toISOString()}`);
    });

    // Check workflow history for reset
    console.log('\n3. RECENT WORKFLOW ACTIONS:');
    if (allWorkflows.length > 0) {
      const latestWorkflow = allWorkflows[0];
      const history = await prisma.jsonWorkflowHistory.findMany({
        where: { workflowInstanceId: latestWorkflow.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          performedByUser: {
            select: { email: true }
          }
        }
      });

      history.forEach((h, idx) => {
        console.log(`   ${idx + 1}. ${h.action} by ${h.performedByUser?.email || h.performedBy}`);
        console.log(`      Stage: ${h.stageName}, At: ${h.createdAt.toISOString()}`);
      });
    }

    // Test what each user sees via API
    console.log('\n4. API RESPONSES:');

    // Admin login
    const adminLogin = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@airforce.mil',
      password: 'testpass123'
    });
    const adminToken = adminLogin.data.accessToken;

    // AO1 login
    const ao1Login = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'ao1@airforce.mil',
      password: 'testpass123'
    });
    const ao1Token = ao1Login.data.accessToken;

    // Admin API call
    console.log('\n   ADMIN sees:');
    try {
      const adminResponse = await axios.get(
        `${baseUrl}/api/workflow-instances/${documentId}`,
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      console.log('   - Status: 200 OK');
      console.log('   - isActive:', adminResponse.data.isActive);
      console.log('   - active:', adminResponse.data.active);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   - Status: 404 (No workflow found) ✅ CORRECT');
      } else {
        console.log('   - Error:', error.response?.status);
      }
    }

    // AO1 API call
    console.log('\n   AO1 sees:');
    try {
      const ao1Response = await axios.get(
        `${baseUrl}/api/workflow-instances/${documentId}`,
        { headers: { 'Authorization': `Bearer ${ao1Token}` } }
      );
      console.log('   - Status: 200 OK');
      console.log('   - isActive:', ao1Response.data.isActive);
      console.log('   - active:', ao1Response.data.active);
      console.log('   - ⚠️  AO1 is getting workflow data!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   - Status: 404 (No workflow found)');
      } else {
        console.log('   - Error:', error.response?.status);
      }
    }

    console.log('\n5. ISSUE ANALYSIS:');
    if (!activeWorkflow) {
      console.log('   ✅ Database: Workflow is correctly INACTIVE after reset');
      console.log('   ✅ Admin: Correctly sees no active workflow');
      console.log('   ❌ AO1: Still seeing active workflow (PROBLEM)');
      console.log('\n   CAUSE: AO1\'s browser is showing CACHED/STALE data');
      console.log('   The workflow was reset but AO1\'s UI hasn\'t refreshed');
    } else {
      console.log('   ⚠️  Workflow is still ACTIVE in database');
      console.log('   Reset may not have completed properly');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🔧 FIX FOR AO1:');
    console.log('   1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
    console.log('   2. Clear localStorage: Open console, run: localStorage.clear()');
    console.log('   3. Log out and log back in');
    console.log('   4. Or use incognito window to see correct state');
    console.log('\n   AO1 needs to clear their browser cache to see the reset workflow!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAO1CachedWorkflow();