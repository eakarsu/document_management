const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugWorkflowInstance() {
  try {
    const documentId = 'cmflk2dek000djr0fl6s6106u';

    // Find the workflow instance
    const instance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (!instance) {
      console.log('No active workflow instance found');
      return;
    }

    console.log('=== WORKFLOW INSTANCE DEBUG ===');
    console.log('ID:', instance.id);
    console.log('Document ID:', instance.documentId);
    console.log('Workflow ID:', instance.workflowId);
    console.log('Current Stage ID:', instance.currentStageId);
    console.log('Is Active:', instance.isActive);

    console.log('\n=== METADATA STRUCTURE ===');
    const metadata = instance.metadata;
    console.log('Type of metadata:', typeof metadata);
    console.log('Metadata keys:', metadata ? Object.keys(metadata) : 'null');

    if (metadata) {
      console.log('\nChecking for workflow definition:');
      console.log('- Has stages array directly?', !!(metadata.stages && Array.isArray(metadata.stages)));
      console.log('- Has workflowDefinition?', !!metadata.workflowDefinition);
      console.log('- Has definition?', !!metadata.definition);
      console.log('- Has workflow?', !!metadata.workflow);

      // Print first stage if exists
      if (metadata.stages && Array.isArray(metadata.stages)) {
        console.log('\nFirst stage:', metadata.stages[0]);
      } else if (metadata.workflowDefinition?.stages) {
        console.log('\nFirst stage from workflowDefinition:', metadata.workflowDefinition.stages[0]);
      } else if (metadata.definition?.stages) {
        console.log('\nFirst stage from definition:', metadata.definition.stages[0]);
      }

      console.log('\nFull metadata (first 500 chars):');
      console.log(JSON.stringify(metadata, null, 2).substring(0, 500));
    }

    // Also check if workflowId references a workflow
    if (instance.workflowId) {
      console.log('\n=== CHECKING WORKFLOWS TABLE ===');
      const workflow = await prisma.workflow.findUnique({
        where: { id: instance.workflowId }
      });

      if (workflow) {
        console.log('Found workflow:', workflow.id);
        console.log('Has definition?', !!workflow.definition);
        if (workflow.definition) {
          const def = workflow.definition;
          console.log('Definition has stages?', !!(def.stages && Array.isArray(def.stages)));
          console.log('Number of stages:', def.stages?.length);
        }
      } else {
        console.log('No workflow found with ID:', instance.workflowId);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugWorkflowInstance();