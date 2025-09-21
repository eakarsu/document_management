const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocument() {
  try {
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

    // Check if document exists
    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (doc) {
      console.log('Document found:', {
        id: doc.id,
        title: doc.title,
        status: doc.status
      });
    } else {
      console.log(`Document ${documentId} not found`);

      // List all documents
      const allDocs = await prisma.document.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      console.log('\nAvailable documents:');
      allDocs.forEach(d => {
        console.log(`- ${d.id}: ${d.title} (${d.status})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocument();