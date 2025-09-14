const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAndCreateCoordinatorUser() {
  try {
    console.log('🔍 Checking coordinator user...\n');
    
    // Check if coordinator.test@af.mil exists
    const coordinatorUser = await prisma.user.findUnique({
      where: { email: 'coordinator.test@af.mil' },
      include: {
        role: true
      }
    });
    
    if (coordinatorUser) {
      console.log('✅ Coordinator user found:');
      console.log(`📧 Email: ${coordinatorUser.email}`);
      console.log(`👤 Name: ${coordinatorUser.firstName} ${coordinatorUser.lastName}`);
      console.log(`🏷️ Role: ${coordinatorUser.role?.name || 'No Role'}`);
      console.log(`🔑 Password hash: ${coordinatorUser.passwordHash ? 'Set' : 'Not Set'}`);
      
      // Test password
      const isValidPassword = await bcrypt.compare('password123', coordinatorUser.passwordHash);
      console.log(`🔐 Password 'password123' valid: ${isValidPassword}`);
      
      if (!isValidPassword) {
        console.log('\n🔄 Updating password...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
          where: { id: coordinatorUser.id },
          data: { passwordHash: hashedPassword }
        });
        console.log('✅ Password updated successfully');
      }
      
    } else {
      console.log('❌ Coordinator user not found! Creating...');
      
      // Get coordinator role
      const coordinatorRole = await prisma.role.findFirst({
        where: { name: 'Coordinator' }
      });
      
      if (!coordinatorRole) {
        console.log('❌ Coordinator role not found!');
        return;
      }
      
      // Get first organization
      const firstOrg = await prisma.organization.findFirst();
      if (!firstOrg) {
        console.log('❌ No organization found!');
        return;
      }
      
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'coordinator.test@af.mil',
          firstName: 'John',
          lastName: 'Coordinator',
          passwordHash: hashedPassword,
          roleId: coordinatorRole.id,
          organizationId: firstOrg.id,
          isActive: true,
          emailVerified: true
        },
        include: {
          role: true
        }
      });
      
      console.log('✅ Coordinator user created:');
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`👤 Name: ${newUser.firstName} ${newUser.lastName}`);
      console.log(`🏷️ Role: ${newUser.role?.name}`);
    }
    
    console.log('\n✅ Coordinator user is ready for login!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateCoordinatorUser();