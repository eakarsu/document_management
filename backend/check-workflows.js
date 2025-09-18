const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflows() {
  try {
    // Check if the problematic document exists
    const doc = await prisma.document.findUnique({
      where: { id: 'cmfn3a0or001bfjsq65sspnx6' }
    });

    console.log('Document cmfn3a0or001bfjsq65sspnx6 exists?', doc ? 'YES' : 'NO');

    // Check all workflow instances
    const workflows = await prisma.jsonWorkflowInstance.findMany({
      include: {
        document: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    console.log('\nAll workflow instances:');
    workflows.forEach(w => {
      console.log('  -', w.documentId, w.document?.title || 'NO DOCUMENT', 'Status:', w.status);
    });

    // Check for orphaned workflow instances
    const orphaned = workflows.filter(w => !w.document);
    if (orphaned.length > 0) {
      console.log('\n⚠️ Orphaned workflow instances (document deleted):');
      orphaned.forEach(w => {
        console.log('  - Workflow', w.id, 'for document', w.documentId);
      });

      // Delete orphaned workflow instances
      await prisma.jsonWorkflowInstance.deleteMany({
        where: {
          documentId: {
            in: orphaned.map(w => w.documentId)
          }
        }
      });
      console.log('✅ Deleted', orphaned.length, 'orphaned workflow instances');
    }

    // Get documents with proper 8-stage workflows
    console.log('\n📄 Documents with valid workflows:');
    const validDocs = await prisma.document.findMany({
      where: {
        jsonWorkflowInstances: {
          some: {}
        }
      },
      include: {
        jsonWorkflowInstances: {
          select: {
            id: true,
            status: true,
            currentStageId: true
          }
        }
      }
    });

    validDocs.forEach(doc => {
      console.log('  -', doc.id, doc.title);
      doc.jsonWorkflowInstances.forEach(w => {
        console.log('     Workflow:', w.id, 'Stage:', w.currentStageId, 'Status:', w.status);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflows();