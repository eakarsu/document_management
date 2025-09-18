const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStagePermanent() {
  try {
    console.log('🔧 PERMANENT FIX FOR STAGE IDS\n');

    // Fix the specific document first
    const targetDoc = 'cmfn33ifj000pfjsqyo04fb7p';
    const instance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId: targetDoc,
        isActive: true
      }
    });

    if (instance) {
      // The metadata has numeric stage IDs (1, 2, 3...)
      // But currentStageId was set to 'stage1' - fix this
      await prisma.jsonWorkflowInstance.update({
        where: { id: instance.id },
        data: {
          currentStageId: '1' // Match the metadata stage IDs
        }
      });
      console.log('✅ Fixed document', targetDoc, '- set stage to "1"');
    }

    // Fix ALL instances with mismatched stage IDs
    console.log('\n🔍 Checking all workflow instances for stage ID mismatches...');

    const allInstances = await prisma.jsonWorkflowInstance.findMany({
      where: {
        isActive: true
      }
    });

    let fixed = 0;
    for (const inst of allInstances) {
      // Check if currentStageId has 'stage' prefix
      if (inst.currentStageId && inst.currentStageId.startsWith('stage')) {
        // Extract the number
        const stageNumber = inst.currentStageId.replace('stage', '');

        // Update to just the number
        await prisma.jsonWorkflowInstance.update({
          where: { id: inst.id },
          data: {
            currentStageId: stageNumber
          }
        });

        console.log(`  Fixed instance ${inst.id}: stage${stageNumber} → ${stageNumber}`);
        fixed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} instances with stage ID mismatches`);
    console.log('   All instances now use numeric stage IDs matching the workflow metadata');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStagePermanent();