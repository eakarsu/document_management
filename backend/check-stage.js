const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflow() {
  try {
    const instance = await prisma.workflowInstance.findFirst({
      where: { documentId: 'cmfn33ifj000pfjsqyo04fb7p' }
    });

    if (instance) {
      console.log('Current Stage ID:', instance.currentStageId);
      console.log('Current Stage Name:', instance.currentStageName);
      console.log('Status:', instance.status);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflow();