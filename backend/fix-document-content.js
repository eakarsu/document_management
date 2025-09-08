const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDocumentContent() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  // RESTORE ORIGINAL CONTENT (before we messed it up)
  const originalContent = '<p>Section 1.1.2: The text here contains sdlgsdfgsdfgsdfgsdf that needs improvement.</p>';
  
  console.log('=== FIXING DOCUMENT CONTENT ===');
  console.log('Document ID:', documentId);
  console.log('Restoring original content:', originalContent);
  
  try {
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          content: originalContent,
          draftFeedback: [{
            changeFrom: 'sdlgsdfgsdfgsdfgsdf',
            changeTo: 'Replace wit test'
          }]
        }
      }
    });
    
    console.log('\n✅ DOCUMENT CONTENT RESTORED!');
    console.log('Title:', updated.title);
    console.log('Content now has original text with "sdlgsdfgsdfgsdfgsdf"');
    console.log('\nCustom fields:', updated.customFields);
    
  } catch (error) {
    console.error('❌ Error fixing document:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDocumentContent();