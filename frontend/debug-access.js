const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAccess() {
  try {
    // Check OPR user details
    const oprUser = await prisma.user.findUnique({
      where: { email: 'opr@demo.mil' },
      include: {
        role: true,
        organization: true
      }
    });

    console.log('OPR User:', {
      id: oprUser.id,
      email: oprUser.email,
      role: oprUser.role?.name,
      roleId: oprUser.roleId,
      organizationId: oprUser.organizationId,
      permissions: oprUser.role?.permissions
    });

    // Check document
    const documentId = 'cmflk2dek000djr0fl6s6106u';
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (document) {
      console.log('\nDocument:', {
        id: document.id,
        title: document.title,
        organizationId: document.organizationId,
        userId: document.userId,
        status: document.status
      });

      // Check if organizations match
      console.log('\nOrganization match?', oprUser.organizationId === document.organizationId);
    } else {
      console.log('\n❌ Document not found!');
    }

    // Check for active workflows
    const workflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (workflow) {
      console.log('\n✅ Active workflow found:', {
        id: workflow.id,
        workflowDefinition: workflow.workflowDefinition?.name,
        currentStageId: workflow.currentStageId
      });
    } else {
      console.log('\n❌ No active workflow found for this document');
    }

    // Check for OPR role name
    const oprRole = await prisma.role.findUnique({
      where: { id: oprUser.roleId }
    });

    console.log('\nOPR Role details:', {
      id: oprRole.id,
      name: oprRole.name,
      permissions: oprRole.permissions
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAccess();