const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function ensureAo1Workflow() {
  try {
    console.log('🔧 ENSURING AO1 DOCUMENT HAS PROPER WORKFLOW');
    console.log('===============================================\n');

    // The specific document ID from the screenshot
    const targetDocId = 'cmfn33ifj000pfjsqyo04fb7p';

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

    // Check existing workflow
    const existingWorkflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId: targetDocId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingWorkflow) {
      console.log(`📊 Existing workflow found:`);
      console.log(`   ID: ${existingWorkflow.id}`);
      console.log(`   Active: ${existingWorkflow.isActive}`);
      console.log(`   Current Stage: ${existingWorkflow.currentStageId}`);

      // Delete existing workflow and history
      console.log('\n🗑️ Removing existing workflow...');
      await prisma.jsonWorkflowHistory.deleteMany({
        where: { workflowInstanceId: existingWorkflow.id }
      });
      await prisma.jsonWorkflowInstance.delete({
        where: { id: existingWorkflow.id }
      });
      console.log('   ✅ Existing workflow removed');
    }

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
        action: 'WORKFLOW_ENSURED',
        performedBy: 'system',
        metadata: {
          message: 'Workflow ensured for ao1 document'
        }
      }
    });

    console.log('   ✅ Created history entry');

    console.log('\n✅ AO1 WORKFLOW ENSURED SUCCESSFULLY!');
    console.log('   Document now has proper active workflow');
    console.log('   ao1 should see workflow progress correctly');
    console.log('   Admin can see and reset this workflow');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureAo1Workflow();