const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDocumentOrg() {
  try {
    // The organizationId from the user's JWT token
    const correctOrgId = 'cmeys45f10000jp4iccb6f59u';
    
    // Update the document to use the correct organization
    const updatedDoc = await prisma.document.update({
      where: { id: 'cmffo4zta0001125e4twigu39' },
      data: { 
        organizationId: correctOrgId,
        createdById: 'cmeys45qj000ojp4izc4fumqb' // admin user ID from token
      }
    });
    
    console.log('✅ Document updated successfully!');
    console.log('Document ID:', updatedDoc.id);
    console.log('New Organization ID:', updatedDoc.organizationId);
    console.log('Title:', updatedDoc.title);
    
    // Verify the fix
    const verifyDoc = await prisma.document.findUnique({
      where: { id: 'cmffo4zta0001125e4twigu39' },
      select: {
        id: true,
        title: true,
        organizationId: true,
        createdById: true
      }
    });
    
    console.log('\n📋 Verification:');
    console.log(JSON.stringify(verifyDoc, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDocumentOrg();