const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixAO1Access() {
  try {
    // Get ao1 user
    const ao1User = await prisma.user.findUnique({
      where: { email: 'ao1@airforce.mil' },
      include: { role: true }
    });

    if (!ao1User) {
      console.log('❌ ao1 user not found');
      return;
    }

    console.log('✅ Found ao1 user:', ao1User.id);
    console.log('   Role:', ao1User.role?.name);
    console.log('   Permissions:', ao1User.role?.permissions);

    // Check all documents for ao1
    const documents = await prisma.document.findMany({
      where: { createdById: ao1User.id }
    });

    console.log('\n📄 Documents created by ao1:');
    documents.forEach(doc => {
      console.log('   -', doc.id, doc.title);
    });

    // Check the AI document
    const aiDoc = await prisma.document.findUnique({
      where: { id: 'cmfn33ifj000pfjsqyo04fb7p' }
    });

    if (!aiDoc) {
      console.log('\n❌ AI Document not found with ID: cmfn33ifj000pfjsqyo04fb7p');
      return;
    }

    console.log('\n🤖 AI Document details:');
    console.log('   ID:', aiDoc.id);
    console.log('   Title:', aiDoc.title);
    console.log('   Created by:', aiDoc.createdById);
    console.log('   Organization:', aiDoc.organizationId);

    // Check permissions for ao1 on AI document
    const existingPermission = await prisma.documentPermission.findFirst({
      where: {
        documentId: aiDoc.id,
        userId: ao1User.id
      }
    });

    if (existingPermission) {
      console.log('\n✅ ao1 already has permission on AI doc:', existingPermission.permission);
    } else {
      console.log('\n⚠️ ao1 has no permission on AI doc - creating OWNER permission...');

      // Create permission with ADMIN level
      const newPermission = await prisma.documentPermission.create({
        data: {
          documentId: aiDoc.id,
          userId: ao1User.id,
          permission: 'ADMIN',
          grantedAt: new Date()
        }
      });

      console.log('✅ Created permission:', newPermission);
    }

    // Also update the document to be owned by ao1 if it's not already
    if (aiDoc.createdById !== ao1User.id) {
      console.log('\n🔄 Updating document owner to ao1...');
      await prisma.document.update({
        where: { id: aiDoc.id },
        data: {
          createdById: ao1User.id,
          organizationId: ao1User.organizationId
        }
      });
      console.log('✅ Document ownership updated');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixAO1Access();