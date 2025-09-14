const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugWorkflowState() {
  try {
    console.log('🔍 Checking workflow instances and their states...\n');
    
    // Get all active workflow instances
    const workflowInstances = await prisma.jsonWorkflowInstance.findMany({
      where: { isActive: true },
      include: {
        document: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${workflowInstances.length} active workflow instances:\n`);
    
    for (const instance of workflowInstances) {
      console.log(`📄 Document: ${instance.document.title}`);
      console.log(`🔄 Workflow ID: ${instance.workflowId}`);
      console.log(`📍 Current Stage: ${instance.currentStageId}`);
      console.log(`🔴 Active: ${instance.isActive}`);
      console.log(`🗓️ Created: ${instance.createdAt}`);
      console.log(`🗓️ Updated: ${instance.updatedAt}`);
      console.log(`🗓️ Completed: ${instance.completedAt || 'Not completed'}`);
      console.log(`📊 Metadata:`, instance.metadata);
      
      // Check if this should be completed (Stage 8)
      if (instance.currentStageId === '8') {
        console.log('⚠️ THIS SHOULD BE COMPLETED! Stage 8 reached.');
        if (instance.isActive) {
          console.log('🐛 BUG: Workflow is still active but at final stage!');
        }
      }
      
      console.log('---\n');
    }
    
    // Also check workflow history for the latest instances
    console.log('🕒 Recent workflow history:\n');
    const recentHistory = await prisma.jsonWorkflowHistory.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        document: {
          select: {
            title: true
          }
        }
      }
    });
    
    for (const history of recentHistory) {
      console.log(`📄 ${history.document.title}: Stage ${history.fromStageId} → ${history.toStageId}`);
      console.log(`🔄 Action: ${history.action}`);
      console.log(`🕐 Time: ${history.timestamp}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugWorkflowState();