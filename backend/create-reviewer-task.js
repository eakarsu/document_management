const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createReviewerTask() {
  try {
    // Get reviewer user
    let reviewer = await prisma.user.findUnique({
      where: { email: 'ops.reviewer1@airforce.mil' },
      include: { role: true }
    });

    if (!reviewer) {
      console.log('Creating reviewer user...');
      const role = await prisma.role.findFirst({ where: { name: 'SUB_REVIEWER' } }) ||
                   await prisma.role.create({ data: { name: 'SUB_REVIEWER', description: 'Sub-reviewer' } });

      const org = await prisma.organization.findFirst({ where: { name: 'Operations' } }) ||
                  await prisma.organization.create({ data: { name: 'Operations', code: 'OPS' } });

      const bcrypt = require('bcryptjs');
      reviewer = await prisma.user.create({
        data: {
          email: 'ops.reviewer1@airforce.mil',
          password: await bcrypt.hash('testpass123', 10),
          firstName: 'James',
          lastName: 'Wilson',
          roleId: role.id,
          organizationId: org.id
        }
      });
      console.log('Created reviewer:', reviewer.email);
    } else {
      console.log('Found reviewer:', reviewer.email, 'ID:', reviewer.id);
    }

    // Check if task exists
    const existingTask = await prisma.workflowTask.findFirst({
      where: { assignedToId: reviewer.id, status: 'PENDING' }
    });

    if (existingTask) {
      console.log('Reviewer already has a pending task');
    } else {
      console.log('Creating new task for reviewer...');

      // Get the workflow instance
      const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
        where: { documentId: 'cmfn33ifj000pfjsqyo04fb7p', isActive: true }
      });

      const task = await prisma.workflowTask.create({
        data: {
          workflowId: 'cmf2pmgl8000s20lao29cydiq',
          assignedToId: reviewer.id,
          createdById: reviewer.id,
          stepNumber: 3,
          status: 'PENDING',
          title: 'Review Document: AIR FORCE INSTRUCTION 10-1701',
          description: 'Please review and provide feedback',
          formData: {
            documentId: 'cmfn33ifj000pfjsqyo04fb7p',
            stageId: '3.5',
            workflowInstanceId: workflowInstance?.id
          }
        }
      });
      console.log('Created task:', task.id);
    }

    // Grant document permission
    const permission = await prisma.documentPermission.findFirst({
      where: { documentId: 'cmfn33ifj000pfjsqyo04fb7p', userId: reviewer.id }
    });

    if (!permission) {
      await prisma.documentPermission.create({
        data: {
          documentId: 'cmfn33ifj000pfjsqyo04fb7p',
          userId: reviewer.id,
          permission: 'READ'
        }
      });
      console.log('Granted READ permission to document');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createReviewerTask();