const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function correctMerge() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  console.log('=== CORRECT MERGE BEHAVIOR ===\n');
  
  try {
    // Step 1: Get the current document with ALL its content
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    console.log('1. CURRENT DOCUMENT:');
    console.log('   Title:', document.title);
    console.log('   Current content:', document.customFields?.content);
    console.log('   Feedback:', document.customFields?.draftFeedback);
    
    // Step 2: Get the full content and feedback
    const currentContent = document.customFields?.content || '';
    const feedback = document.customFields?.draftFeedback?.[0];
    
    if (!feedback) {
      console.log('\n❌ No feedback to merge');
      return;
    }
    
    console.log('\n2. APPLYING MERGE:');
    console.log('   Change from:', feedback.changeFrom);
    console.log('   Change to:', feedback.changeTo);
    
    // Step 3: Do TARGETED replacement - only replace the specific text
    const mergedContent = currentContent.replace(
      feedback.changeFrom,
      feedback.changeTo
    );
    
    console.log('\n3. RESULT:');
    console.log('   Original:', currentContent);
    console.log('   Merged:  ', mergedContent);
    
    // Step 4: Save back, preserving ALL other customFields
    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...document.customFields, // KEEP all existing fields
          content: mergedContent,   // ONLY update content
          lastMerge: new Date().toISOString(),
          mergedCorrectly: true
        }
      }
    });
    
    console.log('\n✅ MERGE COMPLETED CORRECTLY!');
    console.log('   - Only "' + feedback.changeFrom + '" was replaced');
    console.log('   - With "' + feedback.changeTo + '"');
    console.log('   - All other content preserved');
    console.log('\n   Final content:', updatedDoc.customFields?.content);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

correctMerge();