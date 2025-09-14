const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestDocument() {
  try {
    // Check if document exists
    const existingDoc = await prisma.document.findUnique({
      where: { id: 'doc_af-manual_test' }
    });
    
    if (existingDoc) {
      console.log('Document already exists:', existingDoc.id);
      return existingDoc;
    }
    
    // Create a test document
    const doc = await prisma.document.create({
      data: {
        id: 'doc_af-manual_test',
        title: 'AIR FORCE INSTRUCTION 36-2903',
        content: 'Test document for workflow testing',
        status: 'draft',
        documentType: 'AF-MANUAL',
        fileName: 'afi-36-2903.pdf',
        originalName: 'AIR_FORCE_INSTRUCTION_36-2903.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000, // 1MB
        checksum: 'sha256:abcd1234efgh5678',
        storagePath: 'uploads/afi-36-2903.pdf',
        metadata: {
          dateCreated: new Date().toISOString()
        },
        organizationId: 'org_af_default',
        userId: 'user_admin_default'
      }
    });
    
    console.log('Created document:', doc.id);
    return doc;
  } catch (error) {
    console.error('Error creating document:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDocument();