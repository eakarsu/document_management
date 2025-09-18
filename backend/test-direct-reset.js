const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectReset() {
  try {
    console.log('🧪 DIRECT ADMIN RESET TEST');
    console.log('==========================\n');

    // Simulate the exact reset logic with admin user
    const adminUserId = 'cmfn4899f0001hasx7wr9xgz0'; // admin@airforce.mil
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p'; // The document with active workflow

    console.log(`👤 Admin User: ${adminUserId}`);
    console.log(`📋 Document: ${documentId}`);

    // Get user and role (same as backend logic)
    const user = await prisma.user.findUnique({
      where: { id: adminUserId },
      include: { role: true }
    });

    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`✅ User role: ${user.role?.name}`);

    const userRole = user.role?.name;
    if (userRole !== 'Admin') {
      console.log('❌ User is not Admin');
      return;
    }

    console.log('✅ User has Admin role');

    // Get workflow instance (same as backend logic)
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' }
    });

    if (!workflowInstance) {
      console.log('❌ No workflow found');
      return;
    }

    console.log(`✅ Workflow found: ${workflowInstance.id}`);
    console.log(`   Is Active: ${workflowInstance.isActive}`);
    console.log(`   Current Stage: ${workflowInstance.currentStageId}`);
    console.log(`   Workflow ID: ${workflowInstance.workflowId}`);

    // Check metadata (same as backend logic)
    const metadata = workflowInstance.metadata;
    console.log(`✅ Has metadata: ${!!metadata}`);

    let workflowDef = null;
    if (metadata && metadata.stages && Array.isArray(metadata.stages)) {
      workflowDef = metadata;
      console.log(`✅ Workflow definition in metadata with ${workflowDef.stages.length} stages`);
    } else {
      console.log('❌ No workflow definition in metadata');
      return;
    }

    // Find first stage (same as backend logic)
    const firstStage = workflowDef.stages.find(s => s.order === 1) || workflowDef.stages[0];

    if (!firstStage) {
      console.log('❌ No first stage found');
      return;
    }

    console.log(`✅ First stage: ${firstStage.name} (ID: ${firstStage.id})`);

    console.log('\n🔄 SIMULATING RESET...');

    // Count existing workflows before reset
    const beforeCount = await prisma.jsonWorkflowInstance.count({
      where: { documentId }
    });
    console.log(`   Workflows before reset: ${beforeCount}`);

    // Simulate deletion (DRY RUN - not actually deleting)
    console.log('   Would delete workflow history...');
    console.log('   Would delete workflow instances...');
    console.log('   Would create new active workflow...');
    console.log('   Would create history entry...');

    console.log('\n✅ RESET SIMULATION COMPLETED');
    console.log('   All logic checks passed');
    console.log('   Reset should work in real application');

  } catch (error) {
    console.error('\n❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectReset();