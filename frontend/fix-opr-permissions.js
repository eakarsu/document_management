const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOPRPermissions() {
  try {
    // Update OPR role to include document:view permission
    const oprRole = await prisma.role.update({
      where: { id: 'cmf2tm7360001hdoy8n02vtom' },  // OPR role ID
      data: {
        permissions: ['document:view', 'CREATE_DOCUMENT', 'EDIT_DOCUMENT', 'SUBMIT_FOR_REVIEW']
      }
    });

    console.log('✅ Updated OPR role permissions:', oprRole.permissions);

    // Also update all other Air Force roles to have document:view permission
    const rolesToUpdate = ['PCM', 'Legal', 'AFDPO', 'Front Office', 'Department Sub-reviewer'];

    for (const roleName of rolesToUpdate) {
      const role = await prisma.role.findFirst({
        where: { name: roleName }
      });

      if (role) {
        const currentPermissions = role.permissions || [];
        if (!currentPermissions.includes('document:view')) {
          const updated = await prisma.role.update({
            where: { id: role.id },
            data: {
              permissions: ['document:view', ...currentPermissions]
            }
          });
          console.log(`✅ Updated ${roleName} role permissions:`, updated.permissions);
        }
      }
    }

  } catch (error) {
    console.error('Error updating permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOPRPermissions();