const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email: 'success@example.com' },
      data: { emailVerified: true }
    });
    
    console.log('✅ User email verified:', user.email);
  } catch (error) {
    console.error('❌ Error verifying user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();