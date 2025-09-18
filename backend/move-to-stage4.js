const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

if (!prisma.workflowInstance) {
  console.error('❌ PrismaClient not properly initialized');
  process.exit(1);
}

async function moveToStage4() {
  const docId = 'cmflje0jn001pupwzqy3webdj';

  console.log('='.repeat(60));
  console.log('MOVING WORKFLOW TO STAGE 4 (OPR FEEDBACK INCORPORATION)');
  console.log('='.repeat(60));

  try {
    // Get the workflow
    const workflow = await prisma.workflowInstance.findFirst({
      where: { documentId: docId },
      include: {
        tasks: {
          include: {
            assignedTo: true
          }
        }
      }
    });

    if (!workflow) {
      console.log('❌ No workflow found');
      return;
    }

    console.log('\n📋 Current Workflow State:');
    console.log('  Current Stage:', workflow.currentStage);
    console.log('  Status:', workflow.status);

    // Complete all reviewer tasks in stage 3.5
    const reviewerTasks = workflow.tasks.filter(t =>
      t.stage === 3.5 &&
      t.type === 'REVIEW' &&
      t.status !== 'completed'
    );

    if (reviewerTasks.length > 0) {
      console.log('\n✅ Completing remaining reviewer tasks...');
      for (const task of reviewerTasks) {
        await prisma.workflowTask.update({
          where: { id: task.id },
          data: {
            status: 'completed',
            decision: 'submitted',
            completedAt: new Date()
          }
        });
        console.log(`  ✓ Completed task for ${task.assignedTo?.email}`);
      }
    }

    // Update workflow to stage 4
    console.log('\n🚀 Moving workflow to Stage 4...');
    const updated = await prisma.workflowInstance.update({
      where: { id: workflow.id },
      data: {
        currentStage: 4,
        status: 'active',
        metadata: {
          ...workflow.metadata,
          allReviewersComplete: true,
          movedToStage4At: new Date().toISOString()
        }
      }
    });

    // Create OPR task for stage 4
    console.log('\n📝 Creating OPR task for Stage 4...');
    const oprTask = await prisma.workflowTask.create({
      data: {
        workflowId: workflow.id,
        stage: 4,
        name: 'OPR Feedback Incorporation',
        type: 'ACTION',
        status: 'pending',
        assignedToId: workflow.tasks.find(t => t.assignedTo?.email === 'ao1@airforce.mil')?.assignedToId,
        description: 'Incorporate feedback from all reviewers and create updated draft'
      }
    });

    console.log('\n✅ SUCCESS!');
    console.log('  New Stage:', updated.currentStage);
    console.log('  OPR Task Created:', oprTask.id);
    console.log('\n📌 Next Steps:');
    console.log('  1. OPR (ao1@airforce.mil) should log in');
    console.log('  2. Navigate to the OPR Review page');
    console.log('  3. Process the collected feedback');
    console.log('  4. Move to next workflow stage');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

moveToStage4().catch(console.error);