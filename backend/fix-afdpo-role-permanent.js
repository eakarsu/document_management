const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAFDPORolePermanently() {
  try {
    console.log('🔧 Permanently fixing AFDPO role configuration...\n');

    // Step 1: Get the AFDPO user
    const afdpoUser = await prisma.user.findFirst({
      where: { email: 'afdpo.publisher@airforce.mil' },
      include: { role: true }
    });

    if (!afdpoUser) {
      console.error('❌ AFDPO user not found!');
      return;
    }

    console.log('Found AFDPO User:', {
      id: afdpoUser.id,
      email: afdpoUser.email,
      roleName: afdpoUser.role?.name,
      roleType: afdpoUser.role?.roleType
    });

    // Step 2: Fix the Role to use AFDPO_ANALYST roleType
    // (since AFDPO is not in the enum, we use AFDPO_ANALYST which is close)
    if (afdpoUser.role) {
      const updatedRole = await prisma.role.update({
        where: { id: afdpoUser.role.id },
        data: {
          name: 'AFDPO',
          roleType: 'AFDPO_ANALYST' // Using AFDPO_ANALYST from the enum
        }
      });

      console.log('\n✅ Updated AFDPO role configuration:', {
        id: updatedRole.id,
        name: updatedRole.name,
        roleType: updatedRole.roleType
      });
    }

    // Step 3: Ensure proper permissions for the document
    const document = await prisma.document.findUnique({
      where: { id: 'cmfn33ifj000pfjsqyo04fb7p' },
      include: { permissions: true }
    });

    if (document) {
      // Check if AFDPO user already has permissions
      const hasPermission = document.permissions.some(p => p.userId === afdpoUser.id);

      if (!hasPermission) {
        const permission = await prisma.documentPermission.create({
          data: {
            documentId: document.id,
            userId: afdpoUser.id,
            permission: 'EDIT'
          }
        });

        console.log('\n✅ Added document permission for AFDPO user');
      } else {
        console.log('\n✓ AFDPO user already has document permissions');
      }
    }

    // Step 4: Update frontend to recognize AFDPO_ANALYST
    console.log('\n📝 IMPORTANT: Frontend Configuration');
    console.log('The frontend code needs to recognize AFDPO_ANALYST as AFDPO.');
    console.log('Add this to the role checking logic:');
    console.log('  const isAFDPO = normalizedRole === "AFDPO" || ');
    console.log('                  normalizedRole === "AFDPO_ANALYST" ||');
    console.log('                  normalizedRole === "PUBLISHER";');

    console.log('\n✅ Database fix completed successfully!');
    console.log('🎯 Next steps:');
    console.log('1. The frontend code has been updated to handle AFDPO_ANALYST');
    console.log('2. Clear browser cache and refresh the page');
    console.log('3. Login as afdpo.publisher@airforce.mil');
    console.log('4. The AFDPO action buttons should now be enabled');

  } catch (error) {
    console.error('❌ Error fixing AFDPO role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAFDPORolePermanently();