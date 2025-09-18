const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function grantLegalAccess() {
  try {
    // Find the legal reviewer user
    const legalUser = await prisma.user.findFirst({
      where: { email: 'legal.reviewer@airforce.mil' },
      include: { role: true }
    });

    if (!legalUser) {
      console.error('❌ Legal reviewer user not found');
      return;
    }

    console.log('✅ Found legal reviewer:', legalUser.email, 'Role:', legalUser.role?.name);

    // Find the document at stage 7
    const workflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        currentStageId: '7',
        isActive: true
      }
    });

    if (!workflow) {
      console.error('❌ No active workflow at stage 7 found');
      return;
    }

    console.log('📄 Found document at stage 7:', workflow.documentId);

    // Check if permission already exists
    const existingPermission = await prisma.documentPermission.findFirst({
      where: {
        documentId: workflow.documentId,
        userId: legalUser.id
      }
    });

    if (existingPermission) {
      console.log('✅ Legal reviewer already has permission');
    } else {
      // Grant permission
      await prisma.documentPermission.create({
        data: {
          documentId: workflow.documentId,
          userId: legalUser.id,
          permission: 'WRITE',
          grantedAt: new Date()
        }
      });
      console.log('✅ Granted WRITE permission to legal reviewer');
    }

    // Note: WorkflowTask requires a reference to old Workflow table, not JsonWorkflowInstance
    // So we'll skip creating the task for now - the document permission is what matters most
    console.log('📌 Note: Workflow tasks use the old workflow system');

    // Get document details
    const document = await prisma.document.findUnique({
      where: { id: workflow.documentId },
      select: { title: true, status: true }
    });

    console.log('📋 Document:', document?.title);
    console.log('📊 Status:', document?.status);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

grantLegalAccess();