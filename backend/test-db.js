const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Testing database connections...');
    
    // Test 1: Count documents
    const documentCount = await prisma.document.count();
    console.log(`✅ Documents in database: ${documentCount}`);
    
    // Test 2: List recent documents
    const recentDocs = await prisma.document.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });
    
    console.log('📋 Recent documents:');
    recentDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.title} (${doc.status}) by ${doc.createdBy.firstName} ${doc.createdBy.lastName}`);
    });
    
    // Test 3: Count users
    const userCount = await prisma.user.count();
    console.log(`✅ Users in database: ${userCount}`);
    
    // Test 4: Count organizations
    const orgCount = await prisma.organization.count();
    console.log(`✅ Organizations in database: ${orgCount}`);
    
    // Test 5: Count roles  
    const roleCount = await prisma.role.count();
    console.log(`✅ Roles in database: ${roleCount}`);
    
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();