const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflow() {
  try {
    const instance = await prisma.workflowInstance.findFirst({
      where: { documentId: 'cmfn33ifj000pfjsqyo04fb7p' }
    });

    if (instance) {
      console.log('='.repeat(60));
      console.log('WORKFLOW INSTANCE STATUS');
      console.log('='.repeat(60));
      console.log('Document ID:', instance.documentId);
      console.log('Current Stage ID:', instance.currentStageId);
      console.log('Current Stage Name:', instance.currentStageName);
      console.log('Status:', instance.status);
      console.log('Type:', instance.type);
      console.log('='.repeat(60));

      // Also check the document status
      const doc = await prisma.document.findUnique({
        where: { id: 'cmfn33ifj000pfjsqyo04fb7p' }
      });

      if (doc) {
        console.log('DOCUMENT STATUS');
        console.log('='.repeat(60));
        console.log('Title:', doc.title);
        console.log('Status:', doc.status);
        console.log('Workflow Instance ID:', doc.workflowInstanceId);
      }
    } else {
      console.log('No workflow instance found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflow();
