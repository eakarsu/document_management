const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPassword() {
  const email = 'ao1@airforce.mil';
  const passwordToTest = '1HM1kiYLKP9^uIkb';

  console.log('\n🔍 Testing password for:', email);
  console.log('🔍 Password to test:', passwordToTest);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      passwordHash: true,
      isActive: true,
      emailVerified: true,
    },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  console.log('\n✅ User found:');
  console.log('   Name:', user.firstName, user.lastName);
  console.log('   Email:', user.email);
  console.log('   Active:', user.isActive);
  console.log('   Email Verified:', user.emailVerified);
  console.log('   Password Hash:', user.passwordHash.substring(0, 20) + '...');

  const isMatch = await bcrypt.compare(passwordToTest, user.passwordHash);

  console.log('\n🔐 Password verification:', isMatch ? '✅ MATCH!' : '❌ NO MATCH');

  if (!isMatch) {
    console.log('\n❌ The password in PRODUCTION_CREDENTIALS.txt does not match the database.');
    console.log('💡 Try running: npm run seed:production again');
  } else {
    console.log('\n✅ Password is correct! Login should work.');
  }

  await prisma.$disconnect();
}

testPassword().catch(console.error);
