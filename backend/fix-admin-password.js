const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@airforce.mil' }
    });

    if (user) {
      console.log('Admin user found');
      console.log('Current passwordHash exists:', !!user.passwordHash);

      // Set password
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { email: 'admin@airforce.mil' },
        data: {
          passwordHash: hashedPassword,
          emailVerified: true
        }
      });
      console.log('✅ Admin password updated to: password123');
    } else {
      console.log('Admin user not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();