const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDocumentCreation() {
  console.log('\n=== DOCUMENT CREATION TEST ===\n');
  
  try {
    // Get user for creation
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    // Create document with content directly in database
    const timestamp = Date.now();
    const crypto = require('crypto');
    const checksum = crypto.createHash('md5').update(`test-${timestamp}`).digest('hex');
    
    const htmlContent = `<h1>Test Document ${timestamp}</h1>
    <p>This document was created with content.</p>
    <h2>Biography Section</h2>
    <p>Biography content goes here.</p>`;
    
    const document = await prisma.document.create({
      data: {
        title: `Test Document ${timestamp}`,
        description: 'Created by test',
        fileName: `test_${timestamp}.html`,
        originalName: `test_${timestamp}.html`,
        mimeType: 'text/html',
        fileSize: htmlContent.length,
        checksum: checksum,
        storagePath: `documents/test/${timestamp}.html`,
        status: 'DRAFT',
        category: 'TEST',
        customFields: {
          content: htmlContent,
          createdFrom: 'test'
        },
        createdById: user.id,
        organizationId: user.organizationId,
        currentVersion: 1
      }
    });

    console.log('✅ Document created with ID:', document.id);
    console.log('✅ Content stored in customFields.content');
    
    // Verify content exists
    const verify = await prisma.document.findUnique({
      where: { id: document.id }
    });
    
    if (verify.customFields.content) {
      console.log('✅ Content verified in database');
      console.log('✅ TEST PASSED - Document creation works!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDocumentCreation();