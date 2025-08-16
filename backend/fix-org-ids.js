const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrganizationIds() {
  try {
    console.log('Starting organization ID fix...');
    
    // Current user's organization ID
    const currentOrgId = 'cmed6dm7f0000ioaciudpllci';
    
    // Get all documents
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        organizationId: true
      }
    });
    
    console.log(`Found ${documents.length} documents`);
    
    // Update all documents to current organization
    const updateResult = await prisma.document.updateMany({
      where: {
        organizationId: {
          not: currentOrgId
        }
      },
      data: {
        organizationId: currentOrgId
      }
    });
    
    console.log(`Updated ${updateResult.count} documents to organization ID: ${currentOrgId}`);
    
    // Verify the update
    const updatedDocuments = await prisma.document.findMany({
      where: {
        organizationId: currentOrgId
      },
      select: {
        id: true,
        title: true,
        organizationId: true
      }
    });
    
    console.log(`Verification: ${updatedDocuments.length} documents now have correct organization ID`);
    console.log('Organization ID fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing organization IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrganizationIds();