const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestDocs() {
  try {
    const result = await prisma.document.deleteMany({
      where: {
        OR: [
          { title: { startsWith: 'Test' } },
          { title: { contains: 'Editor Header Test' } }
        ]
      }
    });

    console.log(`Deleted ${result.count} test documents`);
  } catch (error) {
    console.error('Error cleaning up test documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestDocs();