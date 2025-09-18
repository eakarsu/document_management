const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdminAirforce() {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash('testpass123', 10);

    // Get the Admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' }
    });

    if (!adminRole) {
      console.error('❌ Admin role not found');
      return;
    }

    // Get the default organization
    const organization = await prisma.organization.findFirst();

    if (!organization) {
      console.error('❌ No organization found');
      return;
    }

    // Create or update admin@airforce.mil
    const admin = await prisma.user.upsert({
      where: { email: 'admin@airforce.mil' },
      update: {
        passwordHash: passwordHash,
        firstName: 'Workflow',
        lastName: 'Administrator',
        isActive: true,
        emailVerified: true
      },
      create: {
        email: 'admin@airforce.mil',
        username: 'workflowadmin',
        firstName: 'Workflow',
        lastName: 'Administrator',
        passwordHash: passwordHash,
        isActive: true,
        emailVerified: true,
        department: 'Administration',
        jobTitle: 'Workflow Admin',
        roleId: adminRole.id,
        organizationId: organization.id
      }
    });

    console.log('✅ Admin user created/updated:');
    console.log('   Email: admin@airforce.mil');
    console.log('   Password: testpass123');
    console.log('   Role: Admin');
    console.log('   ID:', admin.id);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAirforce();