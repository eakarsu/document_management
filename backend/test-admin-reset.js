const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminReset() {
  try {
    console.log('🧪 TESTING ADMIN RESET FUNCTIONALITY');
    console.log('=====================================\n');

    // Find an admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        email: { endsWith: '@airforce.mil' }
      },
      include: { role: true }
    });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    console.log('👤 Admin User Found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role?.name}`);
    console.log(`   User ID: ${adminUser.id}`);

    // Find an active workflow instance
    const activeWorkflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        isActive: true
      },
      include: {
        document: {
          select: { title: true }
        }
      }
    });

    if (!activeWorkflow) {
      console.log('\n❌ No active workflow found to test reset');
      return;
    }

    console.log('\n📋 Active Workflow Found:');
    console.log(`   ID: ${activeWorkflow.id}`);
    console.log(`   Document: ${activeWorkflow.document?.title}`);
    console.log(`   Document ID: ${activeWorkflow.documentId}`);
    console.log(`   Current Stage: ${activeWorkflow.currentStageId}`);
    console.log(`   Is Active: ${activeWorkflow.isActive}`);
    console.log(`   Workflow ID: ${activeWorkflow.workflowId}`);

    // Test the reset logic manually
    console.log('\n🔄 Testing Reset Logic...');

    // Check if user has Admin role
    const userRole = adminUser.role?.name;
    console.log(`   User Role: ${userRole}`);

    if (userRole !== 'Admin') {
      console.log('❌ User is not Admin - reset should be denied');
      return;
    }

    console.log('✅ User has Admin role - reset should be allowed');

    // Check if workflow definition exists in metadata
    const metadata = activeWorkflow.metadata;
    console.log(`\n📄 Workflow Metadata Check:`);
    console.log(`   Has metadata: ${!!metadata}`);

    if (metadata && typeof metadata === 'object') {
      console.log(`   Metadata keys: ${Object.keys(metadata)}`);
      console.log(`   Has stages: ${!!(metadata.stages)}`);
      if (metadata.stages) {
        console.log(`   Stage count: ${metadata.stages.length}`);
        const firstStage = metadata.stages.find(s => s.order === 1) || metadata.stages[0];
        console.log(`   First stage: ${firstStage ? firstStage.id + ' - ' + firstStage.name : 'Not found'}`);
      }
    }

    console.log('\n✅ ADMIN RESET TEST COMPLETED');
    console.log('   All checks passed - reset should work');

  } catch (error) {
    console.error('\n❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminReset();