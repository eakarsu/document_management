const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWorkflowInstance() {
  try {
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

    console.log('🔧 Fixing workflow instance for document:', documentId);

    // Get the workflow instance
    const instance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (!instance) {
      console.log('❌ No active workflow instance found');
      return;
    }

    console.log('\n📋 Current instance:');
    console.log('   ID:', instance.id);
    console.log('   Current Stage:', instance.currentStageId);
    console.log('   Workflow ID:', instance.workflowId);

    // Get the workflow definition
    const workflow = await prisma.workflow.findUnique({
      where: { id: instance.workflowId }
    });

    if (!workflow) {
      console.log('❌ Workflow not found:', instance.workflowId);
      return;
    }

    console.log('\n📜 Found workflow:', workflow.name);

    // Fix the current stage ID (change from "1" to "stage1")
    const fixedStageId = instance.currentStageId.startsWith('stage')
      ? instance.currentStageId
      : `stage${instance.currentStageId}`;

    // Update the instance with correct stage ID and workflow metadata
    const updated = await prisma.jsonWorkflowInstance.update({
      where: { id: instance.id },
      data: {
        currentStageId: fixedStageId,
        metadata: workflow.definition || {}
      }
    });

    console.log('\n✅ Fixed workflow instance:');
    console.log('   Current Stage:', updated.currentStageId);
    console.log('   Has metadata:', Object.keys(updated.metadata).length > 0 ? 'YES' : 'NO');

    // Verify the metadata has stages
    const metadata = updated.metadata;
    if (metadata && metadata.stages) {
      console.log('   Number of stages:', metadata.stages.length);
      const currentStage = metadata.stages.find(s => s.id === fixedStageId);
      if (currentStage) {
        console.log('   Current stage name:', currentStage.name);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWorkflowInstance();