const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAO2Permissions() {
  try {
    console.log('🔍 Checking AO2 User Permissions\n');
    console.log('='.repeat(50));

    // Find ao2 user
    const ao2User = await prisma.user.findUnique({
      where: { email: 'ao2@airforce.mil' },
      include: {
        role: true
      }
    });

    if (ao2User) {
      console.log('\n✅ AO2 User found:');
      console.log('   ID:', ao2User.id);
      console.log('   Email:', ao2User.email);
      console.log('   Name:', ao2User.firstName, ao2User.lastName);
      console.log('   Role:', ao2User.role?.name || 'No role');
      console.log('   Role ID:', ao2User.roleId);
      console.log('   Permissions:', ao2User.role?.permissions || []);
    } else {
      console.log('❌ AO2 user not found');
    }

    // Check ao1 for comparison
    const ao1User = await prisma.user.findUnique({
      where: { email: 'ao1@airforce.mil' },
      include: {
        role: true
      }
    });

    if (ao1User) {
      console.log('\n📊 AO1 User for comparison:');
      console.log('   Email:', ao1User.email);
      console.log('   Role:', ao1User.role?.name || 'No role');
      console.log('   Permissions:', ao1User.role?.permissions || []);
    }

    // Check all ACTION_OFFICER role users
    console.log('\n📋 All ACTION_OFFICER role users:');
    const actionOfficerRole = await prisma.role.findFirst({
      where: { name: 'ACTION_OFFICER' }
    });

    if (actionOfficerRole) {
      const aoUsers = await prisma.user.findMany({
        where: { roleId: actionOfficerRole.id },
        select: { email: true, firstName: true, lastName: true }
      });

      aoUsers.forEach(user => {
        console.log('   -', user.email, `(${user.firstName} ${user.lastName})`);
      });
    }

    console.log('\n' + '='.repeat(50));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAO2Permissions();