const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentStage() {
  try {
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

    console.log('🔍 Checking workflow instance after reset...\n');

    const instance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (!instance) {
      console.log('❌ No active workflow instance found');
      return;
    }

    console.log('📋 Current instance state:');
    console.log('   ID:', instance.id);
    console.log('   Document ID:', instance.documentId);
    console.log('   Current Stage ID:', instance.currentStageId);
    console.log('   Is Active:', instance.isActive);
    console.log('   Created:', instance.createdAt);
    console.log('   Updated:', instance.updatedAt);

    // Check if metadata has stages
    const metadata = instance.metadata;
    if (metadata && metadata.stages) {
      console.log('\n📜 Workflow metadata:');
      console.log('   Has stages:', metadata.stages.length);

      // Find the current stage
      const currentStage = metadata.stages.find(s => s.id === instance.currentStageId);
      if (currentStage) {
        console.log('   Current stage found:', currentStage.name);
      } else {
        console.log('   ⚠️ Current stage ID does not match any stage in metadata!');
        console.log('   Available stages:', metadata.stages.map(s => s.id).join(', '));
      }
    } else {
      console.log('   ⚠️ No metadata or stages found');
    }

    // Check for the issue - might be the stage ID is wrong
    if (instance.currentStageId === '0' || instance.currentStageId === 0 || !instance.currentStageId) {
      console.log('\n❌ PROBLEM FOUND: Stage is set to 0 or null!');
      console.log('   This is why no stage is highlighted.');
      console.log('\n🔧 Fixing by setting to stage1...');

      const updated = await prisma.jsonWorkflowInstance.update({
        where: { id: instance.id },
        data: {
          currentStageId: 'stage1'
        }
      });

      console.log('   ✅ Fixed! Current stage is now:', updated.currentStageId);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentStage();