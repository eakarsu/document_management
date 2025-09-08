const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function properReset() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  console.log('=== PROPER RESET TO ORIGINAL STATE ===\n');
  
  try {
    // Reset to ORIGINAL state with the text that needs to be replaced
    const reset = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          // Original content with the text that needs replacement
          content: '<p>Section 1.1.2: The text here contains sdlgsdfgsdfgsdfgsdf that needs improvement.</p>',
          // Feedback that will be applied
          draftFeedback: [{
            changeFrom: 'sdlgsdfgsdfgsdfgsdf',
            changeTo: 'Replace wit test'
          }],
          resetAt: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ RESET COMPLETE:');
    console.log('   Content now has: "sdlgsdfgsdfgsdfgsdf"');
    console.log('   Ready for merge: "sdlgsdfgsdfgsdfgsdf" → "Replace wit test"');
    console.log('\n   Full content:', reset.customFields.content);
    console.log('   Feedback:', reset.customFields.draftFeedback);
    
    // Verify the text exists
    const content = reset.customFields.content;
    const searchText = 'sdlgsdfgsdfgsdfgsdf';
    
    if (content.includes(searchText)) {
      console.log('\n✓ VERIFIED: Text "' + searchText + '" exists and can be replaced');
    } else {
      console.log('\n❌ ERROR: Text not found after reset!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

properReset();