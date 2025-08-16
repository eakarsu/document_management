const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVersions() {
  try {
    console.log('Checking document versions...');
    
    const currentOrgId = 'cmed6dm7f0000ioaciudpllci';
    
    // Count total documents
    const totalDocuments = await prisma.document.count({
      where: {
        organizationId: currentOrgId
      }
    });
    console.log(`Total unique documents: ${totalDocuments}`);
    
    // Count total versions
    const totalVersions = await prisma.documentVersion.count({
      where: {
        document: {
          organizationId: currentOrgId
        }
      }
    });
    console.log(`Total document versions: ${totalVersions}`);
    
    // Get documents with their version counts
    const documentsWithVersions = await prisma.document.findMany({
      where: {
        organizationId: currentOrgId
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            versions: true
          }
        }
      }
    });
    
    console.log('\nDocuments and their version counts:');
    documentsWithVersions.forEach(doc => {
      console.log(`- ${doc.title}: ${doc._count.versions} versions`);
    });
    
    // Check if dashboard might be counting versions instead of documents
    const dashboardCount = totalVersions;
    console.log(`\nIf dashboard shows ${dashboardCount}, it's counting versions not documents`);
    console.log(`UI should show ${totalDocuments} documents, not ${dashboardCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVersions();
