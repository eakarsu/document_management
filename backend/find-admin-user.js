const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findAdminUser() {
  try {
    console.log('🔍 FINDING ADMIN USERS');
    console.log('======================\n');

    // Find all users with Admin role
    const adminUsers = await prisma.user.findMany({
      include: { role: true },
      where: {
        role: {
          name: 'Admin'
        }
      }
    });

    console.log(`Found ${adminUsers.length} Admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Admin User:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role?.name}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   First Name: ${user.firstName}`);
      console.log(`   Last Name: ${user.lastName}`);
    });

    // Find all roles
    console.log('\n📋 ALL ROLES IN SYSTEM:');
    const allRoles = await prisma.role.findMany();
    allRoles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.name} (ID: ${role.id})`);
    });

    // Find users with airforce.mil email
    console.log('\n✈️ ALL AIRFORCE.MIL USERS:');
    const airforceUsers = await prisma.user.findMany({
      where: {
        email: { endsWith: '@airforce.mil' }
      },
      include: { role: true }
    });

    airforceUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - Role: ${user.role?.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAdminUser();