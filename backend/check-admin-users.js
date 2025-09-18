const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    // Check for admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'admin@airforce.mil' },
          { email: 'admin@demo.mil' },
          { email: 'workflowadmin@airforce.mil' }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('Admin users found:');
    adminUsers.forEach(user => {
      console.log('  -', user.email, '(', user.firstName, user.lastName, ') Role:', user.role?.name);
    });

    // The actual admin user in the system
    const systemAdmin = await prisma.user.findFirst({
      where: {
        role: {
          name: 'Admin'
        }
      },
      select: {
        email: true,
        username: true
      }
    });

    if (systemAdmin) {
      console.log('\n✅ System Admin user:', systemAdmin.email);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();