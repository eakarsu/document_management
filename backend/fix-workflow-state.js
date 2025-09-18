const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWorkflowState() {
  try {
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

    console.log('🔧 Fixing workflow state for document:', documentId);

    // Create a new workflow instance at Stage 10 (AFDPO Publication)
    const workflowInstance = await prisma.jsonWorkflowInstance.create({
      data: {
        documentId: documentId,
        workflowId: 'hierarchical-distributed-workflow',
        currentStageId: '10', // Stage 10: AFDPO Publication
        isActive: true,
        createdAt: new Date(),
        metadata: {
          restoredFromBug: true,
          originalIssue: 'Workflow instance was incorrectly deleted after leadership approval',
          restoredAt: new Date().toISOString(),
          restoredToStage: 'AFDPO Publication'
        }
      }
    });

    // Create history entry for the restoration
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        stageId: '10',
        stageName: 'AFDPO Publication',
        action: 'WORKFLOW_RESTORED_TO_STAGE_10',
        performedBy: 'system',
        metadata: {
          reason: 'Workflow instance was lost due to auto-completion bug',
          previousStage: '9',
          restoredBy: 'system-fix'
        }
      }
    });

    // Update document status if needed
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'IN_REVIEW' // Change from DRAFT to IN_REVIEW
      }
    });

    console.log('✅ Workflow state restored successfully!');
    console.log('📄 Document is now at Stage 10: AFDPO Publication');
    console.log('👤 AFDPO Publisher (afdpo.publisher@airforce.mil) should now see the document');

    return {
      success: true,
      workflowInstanceId: workflowInstance.id,
      currentStage: '10',
      stageName: 'AFDPO Publication'
    };

  } catch (error) {
    console.error('❌ Error fixing workflow state:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixWorkflowState();