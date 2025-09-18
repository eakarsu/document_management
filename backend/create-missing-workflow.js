const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createMissingWorkflow() {
  try {
    console.log('🔧 CREATING MISSING WORKFLOW INSTANCE');
    console.log('=====================================\n');

    // The document that's getting 404 errors
    const targetDocId = 'cmfn3a0or001bfjsq65sspnx6';

    console.log(`📋 Checking document: ${targetDocId}`);

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: targetDocId }
    });

    if (!document) {
      console.log('❌ Document not found');
      return;
    }

    console.log(`📄 Document found: ${document.title}`);

    // Check if workflow already exists
    const existingWorkflow = await prisma.jsonWorkflowInstance.findFirst({
      where: { documentId: targetDocId }
    });

    if (existingWorkflow) {
      console.log(`✅ Workflow already exists: ${existingWorkflow.id}`);
      console.log(`   Active: ${existingWorkflow.isActive}`);
      return;
    }

    console.log('❌ No workflow instance found - creating one...');

    // Load the distributed workflow definition
    const workflowPath = path.join(__dirname, 'workflows', 'distributed-review-workflow.json');

    if (!fs.existsSync(workflowPath)) {
      console.log('❌ Workflow definition file not found');
      return;
    }

    const workflowDefinition = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    console.log(`📜 Loaded workflow: ${workflowDefinition.name}`);
    console.log(`   Stages: ${workflowDefinition.stages.length}`);

    // Find first stage
    const firstStage = workflowDefinition.stages.find(s => s.order === 1) || workflowDefinition.stages[0];

    if (!firstStage) {
      console.log('❌ No first stage found in workflow');
      return;
    }

    console.log(`🎯 First stage: ${firstStage.name} (ID: ${firstStage.id})`);

    // Create new active workflow
    console.log('\n🆕 Creating new active workflow...');
    const newWorkflow = await prisma.jsonWorkflowInstance.create({
      data: {
        documentId: targetDocId,
        workflowId: 'distributed-review-workflow',
        currentStageId: firstStage.id,
        isActive: true,
        completedAt: null,
        metadata: workflowDefinition // Store complete workflow definition
      }
    });

    console.log(`   ✅ Created workflow instance: ${newWorkflow.id}`);
    console.log(`   Current Stage: ${newWorkflow.currentStageId}`);
    console.log(`   Active: ${newWorkflow.isActive}`);

    // Create initial history entry
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: newWorkflow.id,
        stageId: firstStage.id,
        stageName: firstStage.name,
        action: 'WORKFLOW_CREATED',
        performedBy: 'system',
        metadata: {
          message: 'Workflow created for missing workflow instance'
        }
      }
    });

    console.log('   ✅ Created history entry');

    console.log('\n✅ MISSING WORKFLOW CREATED SUCCESSFULLY!');
    console.log('   Reset button should now work for this document');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingWorkflow();