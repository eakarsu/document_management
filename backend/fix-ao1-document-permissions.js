const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAO1Permissions() {
  try {
    // Get the ao1 user with their role
    const ao1User = await prisma.user.findUnique({
      where: { email: 'ao1@airforce.mil' },
      include: { role: true }
    });

    if (!ao1User) {
      console.log('❌ User ao1@airforce.mil not found');
      return;
    }

    console.log('Found user:', ao1User.email);
    console.log('Current role:', ao1User.role?.name);
    console.log('Current permissions:', ao1User.role?.permissions);

    // Update the role to include document:view permission
    if (ao1User.roleId) {
      const updatedRole = await prisma.role.update({
        where: { id: ao1User.roleId },
        data: {
          permissions: {
            push: 'document:view'
          }
        }
      });

      console.log('✅ Updated role permissions:', updatedRole.permissions);
    }

    // Also directly grant permission to the AI-generated document
    const aiDocument = await prisma.document.findFirst({
      where: { id: 'cmfn33ifj000pfjsqyo04fb7p' }
    });

    if (aiDocument) {
      // Check if permission already exists
      const existingPermission = await prisma.documentPermission.findFirst({
        where: {
          documentId: aiDocument.id,
          userId: ao1User.id
        }
      });

      if (!existingPermission) {
        await prisma.documentPermission.create({
          data: {
            documentId: aiDocument.id,
            userId: ao1User.id,
            permission: 'OWNER',
            grantedAt: new Date()
          }
        });
        console.log('✅ Granted OWNER permission to AI document');
      } else {
        console.log('ℹ️ Permission already exists');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAO1Permissions();