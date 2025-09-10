const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    let user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'ADMIN'
        }
      });
      console.log('Created test user');
    } else {
      console.log('Test user already exists');
    }
    
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
