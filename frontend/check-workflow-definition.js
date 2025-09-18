const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflowDefinition() {
  try {
    // Find the workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId: 'cmflk2dek000djr0fl6s6106u'
      }
    });

    if (workflowInstance) {
      console.log('Workflow Instance Found:');
      console.log('- ID:', workflowInstance.id);
      console.log('- Is Active:', workflowInstance.isActive);
      console.log('- Current Stage ID:', workflowInstance.currentStageId);

      const def = workflowInstance.workflowDefinition;
      console.log('\nWorkflow Definition:');
      console.log('- Name:', def.name);
      console.log('- Version:', def.version);
      console.log('- Type:', def.type);

      console.log('\nStages:');
      def.stages.forEach(stage => {
        console.log(`  - ${stage.id}: ${stage.name} (Order: ${stage.stageOrder}, isStartingStage: ${stage.isStartingStage || false})`);
      });

      // Check for starting stage
      const startingStage = def.stages.find(s => s.isStartingStage);
      if (startingStage) {
        console.log('\n✅ Starting stage found:', startingStage.id);
      } else {
        console.log('\n❌ No starting stage found!');
        console.log('First stage by order:', def.stages.find(s => s.stageOrder === 1)?.id);
      }
    } else {
      console.log('No workflow instance found for this document');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflowDefinition();