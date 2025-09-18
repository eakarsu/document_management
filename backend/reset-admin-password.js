const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // New password for admin accounts
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Common admin emails to reset
    const adminEmails = [
      'admin@test.com',
      'admin@admin.com',
      'admin@richmond-dms.com',
      'admin@af.mil',
      'admin@demo.mil'
    ];

    console.log('🔐 Resetting Admin Passwords\n');

    for (const email of adminEmails) {
      const user = await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          isActive: true,
          emailVerified: true
        }
      }).catch(err => {
        console.log(`  ⚠️  ${email} - User not found or update failed`);
        return null;
      });

      if (user) {
        console.log(`  ✅ ${email} - Password reset successful`);
      }
    }

    console.log('\n📝 Admin Login Credentials:');
    console.log('  Email: admin@test.com');
    console.log('  Password: admin123');
    console.log('\n  Alternative admin emails:');
    console.log('  - admin@admin.com');
    console.log('  - admin@richmond-dms.com');
    console.log('  - admin@af.mil');
    console.log('  - admin@demo.mil');
    console.log('  All use password: admin123');

  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();