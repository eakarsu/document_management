const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflow() {
  const docId = 'cmflje0jn001pupwzqy3webdj';

  // Get workflow instance
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
    console.log('No workflow found');
    return;
  }

  console.log('Workflow Instance:', workflow.id);
  console.log('Current Stage:', workflow.currentStage);
  console.log('Status:', workflow.status);
  console.log('');

  // Show active tasks
  console.log('ACTIVE TASKS:');
  const activeTasks = workflow.tasks.filter(t => t.status === 'active' || t.status === 'pending');
  activeTasks.forEach(task => {
    console.log('  -', task.name, '|', task.status, '| Assigned to:', task.assignedTo?.email);
  });

  console.log('');
  console.log('COMPLETED TASKS:');
  const completedTasks = workflow.tasks.filter(t => t.status === 'completed');
  completedTasks.forEach(task => {
    console.log('  -', task.name, '| Completed by:', task.assignedTo?.email, '| Decision:', task.decision);
  });

  console.log('');
  console.log('STAGE 3 DISTRIBUTION TASKS (should be completed):');
  const stage3Tasks = workflow.tasks.filter(t => t.stage === 3);
  stage3Tasks.forEach(task => {
    console.log('  Stage', task.stage, '|', task.name, '|', task.status, '|', task.assignedTo?.email);
  });

  console.log('');
  console.log('STAGE 4 REVIEW COLLECTION TASKS:');
  const stage4Tasks = workflow.tasks.filter(t => t.stage === 4);
  stage4Tasks.forEach(task => {
    console.log('  Stage', task.stage, '|', task.name, '|', task.status, '|', task.assignedTo?.email, '| Type:', task.type);
  });

  await prisma.$disconnect();
}

checkWorkflow().catch(console.error);