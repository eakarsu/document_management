const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDistribution() {
  try {
    console.log('🔍 Testing Document Distribution to Sub-Reviewers\n');

    // Check for James Wilson (ops.reviewer1@airforce.mil)
    const jamesWilson = await prisma.user.findUnique({
      where: { email: 'ops.reviewer1@airforce.mil' },
      include: {
        role: { select: { name: true } }
      }
    });

    if (!jamesWilson) {
      console.log('❌ James Wilson (ops.reviewer1@airforce.mil) not found!');
      console.log('   Please run: node setup-hierarchical-workflow.js');
      return;
    }

    console.log(`✅ Found user: ${jamesWilson.firstName} ${jamesWilson.lastName}`);
    console.log(`   Email: ${jamesWilson.email}`);
    console.log(`   Role: ${jamesWilson.role?.name}`);
    console.log(`   User ID: ${jamesWilson.id}\n`);

    // Check for workflow tasks assigned to James Wilson
    const tasks = await prisma.workflowTask.findMany({
      where: {
        assignedToId: jamesWilson.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`📋 Workflow Tasks for James Wilson:`);
    if (tasks.length === 0) {
      console.log('   No tasks found');
      console.log('\n💡 To create tasks:');
      console.log('   1. Login as coordinator1@airforce.mil');
      console.log('   2. Click "Distribute to Sub-Reviewers" on a document');
      console.log('   3. Select James Wilson (Operations)');
      console.log('   4. Click Distribute');
    } else {
      tasks.forEach((task, index) => {
        console.log(`\n   Task ${index + 1}:`);
        console.log(`   - Title: ${task.title}`);
        console.log(`   - Status: ${task.status}`);
        console.log(`   - Priority: ${task.priority}`);
        console.log(`   - Created: ${task.createdAt}`);
        if (task.formData) {
          const formData = typeof task.formData === 'string' ? JSON.parse(task.formData) : task.formData;
          console.log(`   - Document ID: ${formData.documentId || 'N/A'}`);
          console.log(`   - Stage ID: ${formData.stageId || 'N/A'}`);
        }
      });
    }

    // Check all sub-reviewers
    console.log('\n📊 All Sub-Reviewers Status:');
    const subReviewers = await prisma.user.findMany({
      where: {
        role: {
          name: 'SUB_REVIEWER'
        }
      },
      include: {
        role: { select: { name: true } },
        organization: { select: { name: true } }
      }
    });

    for (const reviewer of subReviewers) {
      const taskCount = await prisma.workflowTask.count({
        where: { assignedToId: reviewer.id }
      });
      console.log(`   ${reviewer.firstName} ${reviewer.lastName} (${reviewer.email}): ${taskCount} tasks`);
    }

  } catch (error) {
    console.error('Error testing distribution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDistribution();