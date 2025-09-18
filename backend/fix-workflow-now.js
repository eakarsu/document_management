const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWorkflowNow() {
  try {
    console.log('🔧 FIXING WORKFLOW ISSUE NOW\n');
    console.log('='.repeat(60));

    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

    console.log('\n1. CURRENT STATE:');
    const workflow = await prisma.jsonWorkflowInstance.findFirst({
      where: { documentId, isActive: true }
    });

    if (workflow) {
      console.log('   ✅ Found active workflow');
      console.log('   Stage:', workflow.currentStageId);
      console.log('   Active:', workflow.isActive);

      console.log('\n2. DEACTIVATING WORKFLOW (What reset should do):');
      await prisma.jsonWorkflowInstance.update({
        where: { id: workflow.id },
        data: { isActive: false }
      });

      console.log('   ✅ Workflow deactivated!');
      console.log('   Now both admin and ao1 will see "No active workflow"');
      console.log('   They can start a new workflow when ready.');
    } else {
      console.log('   ❌ No active workflow found');
      console.log('   Already deactivated.');
    }

    // Verify
    const checkActive = await prisma.jsonWorkflowInstance.findFirst({
      where: { documentId, isActive: true }
    });

    console.log('\n3. VERIFICATION:');
    console.log('   Active workflow exists?', checkActive ? '❌ YES (still problem)' : '✅ NO (fixed!)');

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DONE! Now:');
    console.log('   1. Both admin and ao1 should see "No active workflow"');
    console.log('   2. Either user can start a new workflow');
    console.log('   3. Make sure both users refresh their browsers');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWorkflowNow();