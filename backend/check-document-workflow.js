const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocumentWorkflow() {
  try {
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p'; // The document shown in screenshots

    console.log(`\n🔍 Checking workflow for document: ${documentId}\n`);

    // Check if document exists
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        createdBy: {
          select: {
            email: true,
            id: true
          }
        }
      }
    });

    if (!doc) {
      console.log('❌ Document not found!');
      return;
    }

    console.log('✅ Document found:');
    console.log('   Title:', doc.title);
    console.log('   Created by:', doc.createdBy?.email);
    console.log('   Status:', doc.status);
    console.log();

    // Check for workflow instances
    const workflowInstances = await prisma.jsonWorkflowInstance.findMany({
      where: { documentId }
    });

    console.log(`📋 Workflow instances found: ${workflowInstances.length}`);

    if (workflowInstances.length > 0) {
      for (const instance of workflowInstances) {
        console.log('\n   Instance details:');
        console.log('     ID:', instance.id);
        console.log('     Workflow ID:', instance.workflowId);
        console.log('     Current Stage:', instance.currentStageId);
        console.log('     Is Active:', instance.isActive);
        console.log('     Status:', instance.status);
        console.log('     Created:', instance.createdAt);
        console.log('     Updated:', instance.updatedAt);

        // Check metadata
        const metadata = instance.metadata;
        if (metadata && typeof metadata === 'object') {
          const metadataObj = metadata;
          if (metadataObj.stages) {
            console.log('     Has workflow definition in metadata: YES');
            console.log('     Number of stages:', metadataObj.stages.length);
          } else {
            console.log('     Has workflow definition in metadata: NO');
          }
        }
      }
    } else {
      console.log('\n⚠️ No workflow instances found for this document!');
      console.log('This is why admin sees "No workflow found"');

      // Let's create one
      console.log('\n🔧 Creating workflow instance for document...');

      // Find a workflow to use
      const workflow = await prisma.workflows.findFirst({
        where: {
          OR: [
            { id: 'distributed-review-workflow' },
            { name: { contains: 'Distributed' } }
          ]
        }
      });

      if (workflow) {
        const newInstance = await prisma.jsonWorkflowInstance.create({
          data: {
            documentId: documentId,
            workflowId: workflow.id,
            currentStageId: 'stage1',
            isActive: true,
            metadata: workflow.definition || {}
          }
        });

        console.log('✅ Created workflow instance:');
        console.log('   ID:', newInstance.id);
        console.log('   Workflow ID:', newInstance.workflowId);
        console.log('   Current Stage:', newInstance.currentStageId);
      } else {
        console.log('❌ No workflow definition found in database');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentWorkflow();