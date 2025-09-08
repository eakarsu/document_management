const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDocumentInDatabase() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  const mergedContent = '<p>Section 1.1.2: The text here contains Replace wit test that needs improvement.</p>';
  
  console.log('=== UPDATING DOCUMENT IN DATABASE ===');
  console.log('Document ID:', documentId);
  console.log('New content:', mergedContent);
  
  try {
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          content: mergedContent,
          lastOPRUpdate: new Date().toISOString(),
          mergedByScript: true,
          draftFeedback: [{
            changeFrom: 'sdlgsdfgsdfgsdfgsdf',
            changeTo: 'Replace wit test'
          }]
        }
      }
    });
    
    console.log('\n✅ DOCUMENT UPDATED SUCCESSFULLY!');
    console.log('Title:', updated.title);
    console.log('Old text "sdlgsdfgsdfgsdfgsdf": REMOVED ✅');
    console.log('New text "Replace wit test": ADDED ✅');
    console.log('\nCustom fields:', updated.customFields);
    
  } catch (error) {
    console.error('❌ Error updating document:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateDocumentInDatabase();