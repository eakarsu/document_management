const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database...');
    
    const currentOrgId = 'cmed6dm7f0000ioaciudpllci';
    
    // Get all documents count
    const totalDocuments = await prisma.document.count();
    console.log(`Total documents in database: ${totalDocuments}`);
    
    // Get documents for current org
    const orgDocuments = await prisma.document.count({
      where: {
        organizationId: currentOrgId
      }
    });
    console.log(`Documents for org ${currentOrgId}: ${orgDocuments}`);
    
    // Get list of documents with titles
    const documents = await prisma.document.findMany({
      where: {
        organizationId: currentOrgId
      },
      select: {
        id: true,
        title: true,
        organizationId: true
      }
    });
    
    console.log('\nDocuments in database:');
    documents.forEach(doc => {
      console.log(`- ${doc.title} (${doc.id}) - Org: ${doc.organizationId}`);
    });
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
