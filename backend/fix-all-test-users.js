const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixAllTestUsers() {
  try {
    console.log('🔍 Checking and fixing all workflow test users...\n');
    
    const testUsers = [
      'opr@demo.mil',
      'coordinator.test@af.mil', 
      'legal@demo.mil',
      'afdpo.analyst@demo.mil',
      'admin@demo.mil'
    ];
    
    for (const email of testUsers) {
      console.log(`🔍 Checking: ${email}`);
      
      const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true }
      });
      
      if (user) {
        // Test current password
        const isValidPassword = await bcrypt.compare('password123', user.passwordHash);
        console.log(`  👤 ${user.firstName} ${user.lastName}`);
        console.log(`  🏷️ Role: ${user.role?.name || 'No Role'}`);
        console.log(`  🔐 Password valid: ${isValidPassword}`);
        
        if (!isValidPassword) {
          console.log(`  🔄 Updating password...`);
          const hashedPassword = await bcrypt.hash('password123', 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
          });
          console.log(`  ✅ Password updated`);
        }
      } else {
        console.log(`  ❌ User not found: ${email}`);
      }
      
      console.log('');
    }
    
    console.log('✅ All test users checked and passwords updated!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllTestUsers();