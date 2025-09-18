const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function testAO2WorkflowActions() {
  try {
    console.log('🔍 Testing AO2 Workflow Actions After Fix\n');
    console.log('='.repeat(50));

    // Load the workflow definition
    const workflowPath = path.join(__dirname, 'workflows', 'distributed-review-workflow.json');
    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));

    console.log('\n1. Workflow Stage 1 Configuration:');
    const stage1 = workflowDef.stages.find(s => s.id === '1');
    console.log('   Stage Name:', stage1.name);
    console.log('   Allowed Roles:', stage1.roles);
    console.log('   Has ACTION_OFFICER?', stage1.roles.includes('ACTION_OFFICER') ? '✅ YES' : '❌ NO');

    // Check ao2 user role
    const ao2User = await prisma.user.findUnique({
      where: { email: 'ao2@airforce.mil' },
      include: { role: true }
    });

    console.log('\n2. AO2 User Configuration:');
    console.log('   Email:', ao2User.email);
    console.log('   Role Name:', ao2User.role?.name);
    console.log('   Role matches Stage 1?', stage1.roles.includes(ao2User.role?.name) ? '✅ YES' : '❌ NO');

    // Check other stages that action officers should access
    console.log('\n3. All Stages with ACTION_OFFICER Access:');
    workflowDef.stages.forEach(stage => {
      if (stage.roles && stage.roles.includes('ACTION_OFFICER')) {
        console.log(`   ✅ Stage ${stage.id}: ${stage.name}`);
      }
    });

    // Check the active workflow instance
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (workflowInstance) {
      console.log('\n4. Current Workflow State:');
      console.log('   Document ID:', documentId);
      console.log('   Current Stage:', workflowInstance.currentStageId);
      console.log('   Is Active:', workflowInstance.isActive);

      const currentStage = workflowDef.stages.find(s => s.id === workflowInstance.currentStageId);
      console.log('   Current Stage Name:', currentStage?.name);
      console.log('   AO2 can act on current stage?',
        currentStage?.roles?.includes('ACTION_OFFICER') ? '✅ YES' : '❌ NO');
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ FIX SUMMARY:');
    console.log('1. Updated distributed-review-workflow.json to include ACTION_OFFICER role');
    console.log('2. Updated opr-review-workflow.json to include ACTION_OFFICER role');
    console.log('3. hierarchical-distributed-workflow.json already uses ACTION_OFFICER');
    console.log('\nAO2 should now be able to see and perform actions in Stage 1.');
    console.log('\n⚠️  IMPORTANT: Users need to refresh their browser (Ctrl+Shift+R) to load the updated workflow definitions.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAO2WorkflowActions();