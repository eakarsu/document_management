const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrgMismatch() {
  try {
    console.log('Analyzing organization mismatch...');
    
    // Current user from JWT token
    const currentUser = 'cme934998a000abwkocovwkrci'; // admin@richmond-dms.com
    const currentUserOrg = 'cme93490b0000bwkohgvjlyvt';
    
    // Target documents org
    const documentsOrg = 'cmed6dm7f0000ioaciudpllci';
    
    console.log(`Frontend user org: ${currentUserOrg}`);
    console.log(`Documents org: ${documentsOrg}`);
    
    // Count documents in each org
    const docsInUserOrg = await prisma.document.count({
      where: { organizationId: currentUserOrg }
    });
    
    const docsInTargetOrg = await prisma.document.count({
      where: { organizationId: documentsOrg }
    });
    
    console.log(`Documents in user's org (${currentUserOrg}): ${docsInUserOrg}`);
    console.log(`Documents in target org (${documentsOrg}): ${docsInTargetOrg}`);
    
    // Check if we should move documents to user's org or move user to documents org
    console.log('\nOptions:');
    console.log('1. Move all 13 documents to user\'s organization');
    console.log('2. Change user to be in documents\' organization');
    
    // Let's see which makes more sense - move documents to the authenticated user's org
    console.log('\nMoving documents to user\'s organization...');
    
    const updateResult = await prisma.document.updateMany({
      where: {
        organizationId: documentsOrg
      },
      data: {
        organizationId: currentUserOrg
      }
    });
    
    console.log(`Moved ${updateResult.count} documents to user's organization`);
    
    // Update Elasticsearch with new organization IDs
    console.log('⚠️  Remember to reindex Elasticsearch with the new organization ID!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrgMismatch();
