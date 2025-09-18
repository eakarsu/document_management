const { PrismaClient } = require('@prisma/client');
const { EightStageWorkflowService } = require('./dist/services/EightStageWorkflowService');

const prisma = new PrismaClient();
const workflowService = new EightStageWorkflowService();

async function testAdminWorkflowVisibility() {
  console.log('\n=== Testing Admin Workflow Visibility ===\n');

  // Step 1: Find a document with an active workflow
  console.log('1. Finding documents with active workflows...');
  const activeWorkflows = await prisma.jsonWorkflowInstance.findMany({
    where: { isActive: true },
    include: {
      history: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  console.log(`   Found ${activeWorkflows.length} active workflows\n`);

  if (activeWorkflows.length === 0) {
    console.log('   ❌ No active workflows found. Creating one...');

    // Find a document to start workflow on
    const document = await prisma.document.findFirst();
    if (document) {
      console.log(`   Starting workflow for document: ${document.id}`);

      // Create a workflow
      const result = await workflowService.createWorkflowInstance({
        documentId: document.id,
        oprUserId: 'test-user',
        organizationId: 'test-org',
        metadata: { testCreated: true }
      });

      console.log('   ✅ Workflow created:', result);

      // Verify it's active
      const newWorkflow = await prisma.jsonWorkflowInstance.findFirst({
        where: {
          documentId: document.id,
          isActive: true
        }
      });

      if (newWorkflow) {
        console.log('   ✅ New workflow is active:', newWorkflow.id);
        activeWorkflows.push(newWorkflow);
      }
    }
  }

  // Step 2: Test each active workflow with the service method
  console.log('2. Testing service visibility for each active workflow...\n');

  for (const workflow of activeWorkflows.slice(0, 3)) {
    console.log(`   Testing workflow ${workflow.id}:`);
    console.log(`   - Document ID: ${workflow.documentId}`);
    console.log(`   - Is Active in DB: ${workflow.isActive}`);
    console.log(`   - Current Stage: ${workflow.currentStageId}`);

    // Test the service method
    const serviceResult = await workflowService.getWorkflowByDocumentId(workflow.documentId);

    if (serviceResult.success && serviceResult.workflow) {
      const returnedActive = serviceResult.workflow.is_active;
      console.log(`   - Service returns is_active: ${returnedActive}`);

      if (returnedActive !== workflow.isActive) {
        console.log(`   ❌ MISMATCH: DB says ${workflow.isActive}, Service returns ${returnedActive}`);
      } else if (returnedActive) {
        console.log(`   ✅ Correctly showing as active`);
      } else {
        console.log(`   ⚠️ Both show as inactive (workflow might be completed)`);
      }
    } else {
      console.log(`   ❌ Service did not return workflow`);
    }
    console.log();
  }

  // Step 3: Test API endpoint simulation
  console.log('3. Simulating what the frontend would see...\n');

  if (activeWorkflows.length > 0) {
    const testDoc = activeWorkflows[0].documentId;
    console.log(`   Testing document: ${testDoc}`);

    // This is what the API endpoint calls
    const apiResult = await workflowService.getWorkflowByDocumentId(testDoc);

    console.log('   API Response structure:');
    console.log('   - success:', apiResult.success);
    console.log('   - has workflow:', !!apiResult.workflow);

    if (apiResult.workflow) {
      console.log('   - workflow.is_active:', apiResult.workflow.is_active);
      console.log('   - workflow.current_stage:', apiResult.workflow.current_stage);
      console.log('   - workflow.id:', apiResult.workflow.id);

      // This is what determines UI visibility
      if (apiResult.workflow.is_active) {
        console.log('\n   ✅ WORKFLOW SHOULD BE VISIBLE IN UI');
      } else {
        console.log('\n   ❌ WORKFLOW WILL NOT BE VISIBLE IN UI (is_active = false)');
      }
    }
  }

  // Step 4: Check for any inconsistencies
  console.log('\n4. Checking for data inconsistencies...\n');

  const inactiveButShouldBeActive = await prisma.jsonWorkflowInstance.findMany({
    where: {
      isActive: false,
      completedAt: null  // Not completed but marked inactive
    }
  });

  if (inactiveButShouldBeActive.length > 0) {
    console.log(`   ⚠️ Found ${inactiveButShouldBeActive.length} workflows marked inactive but not completed`);
    console.log('   These might be causing visibility issues');

    // Fix them
    console.log('   Fixing these workflows...');
    for (const wf of inactiveButShouldBeActive) {
      await prisma.jsonWorkflowInstance.update({
        where: { id: wf.id },
        data: { isActive: true }
      });
    }
    console.log('   ✅ Fixed inactive workflows');
  } else {
    console.log('   ✅ No data inconsistencies found');
  }

  console.log('\n=== Test Complete ===\n');
  await prisma.$disconnect();
}

testAdminWorkflowVisibility().catch(console.error);