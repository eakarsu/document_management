const { PrismaClient } = require('@prisma/client');
const { EightStageWorkflowService } = require('./dist/services/EightStageWorkflowService');

const prisma = new PrismaClient();
const workflowService = new EightStageWorkflowService();

async function testWorkflowVisibility() {
  const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

  console.log('\n=== Testing Workflow Visibility ===\n');

  // First check what's in the database
  console.log('1. Checking database directly...');
  const dbWorkflow = await prisma.jsonWorkflowInstance.findFirst({
    where: { documentId, isActive: true }
  });

  if (dbWorkflow) {
    console.log('   ✅ Found active workflow in database:');
    console.log('      - ID:', dbWorkflow.id);
    console.log('      - Document ID:', dbWorkflow.documentId);
    console.log('      - Current Stage:', dbWorkflow.currentStageId);
    console.log('      - Is Active:', dbWorkflow.isActive);
    console.log('      - Workflow ID:', dbWorkflow.workflowId);
  } else {
    console.log('   ❌ No active workflow found in database');
  }

  // Now test the service method
  console.log('\n2. Testing EightStageWorkflowService.getWorkflowByDocumentId...');
  try {
    const serviceResult = await workflowService.getWorkflowByDocumentId(documentId);

    if (serviceResult.success && serviceResult.workflow) {
      console.log('   ✅ Service returned workflow:');
      console.log('      - ID:', serviceResult.workflow.id);
      console.log('      - Document ID:', serviceResult.workflow.document_id);
      console.log('      - Current Stage:', serviceResult.workflow.current_stage);
      console.log('      - Is Active:', serviceResult.workflow.is_active);
    } else {
      console.log('   ❌ Service did not return workflow:', serviceResult);
    }
  } catch (error) {
    console.log('   ❌ Service error:', error.message);
  }

  console.log('\n=== Test Complete ===\n');

  await prisma.$disconnect();
}

testWorkflowVisibility().catch(console.error);