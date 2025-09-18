const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listDocumentsWithWorkflows() {
  try {
    // Get all documents
    const docs = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        createdById: true,
        jsonWorkflowInstances: {
          select: {
            id: true,
            currentStageId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('Recent documents:');
    docs.forEach(doc => {
      const hasWorkflow = doc.jsonWorkflowInstances.length > 0;
      console.log('  -', doc.id);
      console.log('    Title:', doc.title);
      console.log('    Has workflow:', hasWorkflow ? 'YES' : 'NO');
      if (hasWorkflow) {
        console.log('    Stage:', doc.jsonWorkflowInstances[0].currentStageId);
      }
    });

    // Check the problematic document specifically
    console.log('\n🔍 Checking document cmfn3a0or001bfjsq65sspnx6:');
    const problemDoc = await prisma.document.findUnique({
      where: { id: 'cmfn3a0or001bfjsq65sspnx6' },
      include: {
        jsonWorkflowInstances: true
      }
    });

    if (problemDoc) {
      console.log('   Title:', problemDoc.title);
      console.log('   Has workflow instance:', problemDoc.jsonWorkflowInstances.length > 0);

      // Create a workflow instance for this document if it doesn't have one
      if (problemDoc.jsonWorkflowInstances.length === 0) {
        console.log('   ⚠️ Creating missing workflow instance...');

        // Check if 8-stage workflow exists
        const workflow = await prisma.workflows.findFirst({
          where: {
            OR: [
              { id: '8-stage-review' },
              { name: { contains: '8-stage' } }
            ]
          }
        });

        if (workflow) {
          await prisma.jsonWorkflowInstance.create({
            data: {
              documentId: problemDoc.id,
              workflowId: workflow.id,
              currentStageId: 'stage1',
              isActive: true,
              metadata: workflow.definition
            }
          });
          console.log('   ✅ Created workflow instance for document');
        } else {
          console.log('   ❌ No 8-stage workflow found in database');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listDocumentsWithWorkflows();