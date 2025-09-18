const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    // Count all users
    const userCount = await prisma.user.count();
    console.log('📊 Total users in database:', userCount);

    // List all users
    const users = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { name: true } },
        organization: { select: { name: true } },
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📋 Recent Users (showing all):');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}: ${user.firstName} ${user.lastName} (${user.role?.name || 'No role'}) - ${user.isActive ? 'Active' : 'Inactive'}`);
    });

    // Group by role
    const roleGroups = {};
    users.forEach(user => {
      const roleName = user.role?.name || 'No Role';
      if (!roleGroups[roleName]) roleGroups[roleName] = 0;
      roleGroups[roleName]++;
    });

    console.log('\n📊 Users by Role:');
    Object.entries(roleGroups).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });

    // Check for inactive users
    const inactiveCount = await prisma.user.count({ where: { isActive: false } });
    console.log(`\n⚠️  Inactive users: ${inactiveCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();