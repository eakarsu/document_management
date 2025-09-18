const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOPRTask() {
  const docId = 'cmflje0jn001pupwzqy3webdj';
  const oprEmail = 'ao1@airforce.mil';

  console.log('='.repeat(60));
  console.log('CHECKING OPR TASK STATUS');
  console.log('='.repeat(60));

  // Get the workflow
  const workflow = await prisma.workflowInstance.findFirst({
    where: { documentId: docId },
    include: {
      tasks: {
        include: {
          assignedTo: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!workflow) {
    console.log('❌ No workflow found');
    return;
  }

  console.log('\n📋 Workflow Info:');
  console.log('  Current Stage:', workflow.currentStage);
  console.log('  Status:', workflow.status);
  console.log('  Is Active:', workflow.isActive);

  // Find OPR tasks
  const oprTasks = workflow.tasks.filter(t =>
    t.assignedTo?.email === oprEmail
  );

  console.log('\n👤 OPR Tasks:', oprTasks.length);
  oprTasks.forEach((task, idx) => {
    console.log(`\n  Task ${idx + 1}:`);
    console.log('    ID:', task.id);
    console.log('    Name:', task.name);
    console.log('    Type:', task.type);
    console.log('    Status:', task.status);
    console.log('    Stage:', task.stage);
    console.log('    Decision:', task.decision || 'none');
    console.log('    Created:', task.createdAt);
    console.log('    Updated:', task.updatedAt);
  });

  // Check if all reviewers have submitted
  const reviewTasks = workflow.tasks.filter(t =>
    t.type === 'REVIEW' &&
    (t.stage === 3 || t.stage === 3.5) &&
    t.assignedTo?.email !== oprEmail
  );

  console.log('\n📊 Reviewer Status:');
  const completedReviews = reviewTasks.filter(t => t.status === 'completed');
  console.log(`  Total Reviewers: ${reviewTasks.length}`);
  console.log(`  Completed Reviews: ${completedReviews.length}`);

  reviewTasks.forEach(task => {
    const status = task.status === 'completed' ? '✅' : '⏳';
    console.log(`    ${status} ${task.assignedTo?.email || 'Unknown'} - ${task.status}`);
  });

  const allReviewersComplete = reviewTasks.length > 0 &&
    reviewTasks.every(t => t.status === 'completed');

  console.log('\n🎯 Analysis:');
  console.log('  All reviewers completed:', allReviewersComplete ? 'YES ✅' : 'NO ❌');
  console.log('  Workflow stage:', workflow.currentStage);

  if (workflow.currentStage === 3.5 && allReviewersComplete) {
    console.log('  ✅ READY FOR OPR TO PROCESS FEEDBACK');
    console.log('  Next step: OPR should move to stage 4 (Feedback Incorporation)');
  } else if (workflow.currentStage === 3.5) {
    console.log('  ⏳ Waiting for all reviewers to complete');
  } else {
    console.log('  Current stage:', workflow.currentStage);
  }

  await prisma.$disconnect();
}

checkOPRTask().catch(console.error);