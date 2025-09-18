const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificAdmin() {
  try {
    console.log('🔍 CHECKING SPECIFIC ADMIN USER');
    console.log('=================================\n');

    // Check the user from JWT logs getting 400 errors
    const userId = 'cmeys45qj000ojp4izc4fumqb'; // admin@demo.mil

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Role ID: ${user.roleId}`);
    console.log(`   Role Name: ${user.role?.name}`);
    console.log(`   Role: ${JSON.stringify(user.role, null, 2)}`);

    // Check what role name comparison would be
    const userRole = user.role?.name;
    console.log(`\n🔍 Role Check Results:`);
    console.log(`   userRole: "${userRole}"`);
    console.log(`   userRole === 'Admin': ${userRole === 'Admin'}`);
    console.log(`   userRole === 'ADMIN': ${userRole === 'ADMIN'}`);

    // Also check the admin@airforce.mil user
    console.log('\n👤 CHECKING admin@airforce.mil:');
    const airforceAdmin = await prisma.user.findUnique({
      where: { email: 'admin@airforce.mil' },
      include: { role: true }
    });

    if (airforceAdmin) {
      console.log(`   Email: ${airforceAdmin.email}`);
      console.log(`   User ID: ${airforceAdmin.id}`);
      console.log(`   Role ID: ${airforceAdmin.roleId}`);
      console.log(`   Role Name: ${airforceAdmin.role?.name}`);

      const airforceRole = airforceAdmin.role?.name;
      console.log(`\n🔍 Airforce Admin Role Check:`);
      console.log(`   userRole: "${airforceRole}"`);
      console.log(`   userRole === 'Admin': ${airforceRole === 'Admin'}`);
    } else {
      console.log('   ❌ admin@airforce.mil not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificAdmin();