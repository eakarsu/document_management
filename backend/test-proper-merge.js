const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProperMerge() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma'; // test dcoumnc 4
  
  console.log('=== TEST PROPER MERGE - DO NOT REPLACE WHOLE DOCUMENT ===\n');
  
  try {
    // Step 1: Get FULL document from database
    console.log('1. GETTING DOCUMENT FROM DATABASE:');
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    console.log('   Title:', document.title);
    console.log('   Document ID:', document.id);
    
    // Step 2: Set up test data with original content and new feedback
    console.log('\n2. SETTING UP TEST DATA:');
    
    // Reset to known state with test content
    const testContent = '<p>Section 1.1.2: The text here contains sdlgsdfgsdfgsdfgsdf that needs improvement.</p>';
    const newFeedback = {
      changeFrom: 'sdlgsdfgsdfgsdfgsdf',
      changeTo: 'Replace wit test'
    };
    
    console.log('   Original content:', testContent);
    console.log('   Feedback:', newFeedback);
    
    // Update document with test content and feedback
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          content: testContent,
          draftFeedback: [newFeedback]
        }
      }
    });
    
    console.log('   ✓ Document updated with test content and feedback');
    
    // Step 3: Get the document again to apply merge
    console.log('\n3. APPLYING MERGE:');
    const docToMerge = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    const currentContent = docToMerge.customFields?.content || '';
    const feedback = docToMerge.customFields?.draftFeedback?.[0];
    
    console.log('   Current content:', currentContent);
    console.log('   Looking for:', feedback.changeFrom);
    console.log('   Replacing with:', feedback.changeTo);
    
    // Do the replacement - ONLY replace the specific text
    const mergedContent = currentContent.replaceAll(
      feedback.changeFrom,
      feedback.changeTo
    );
    
    console.log('\n4. RESULT:');
    console.log('   Before:', currentContent);
    console.log('   After:', mergedContent);
    
    // Step 4: Save ONLY the content field, keep everything else
    console.log('\n5. SAVING TO DATABASE:');
    
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          content: mergedContent,
          draftFeedback: [feedback], // Keep the feedback
          mergedAt: new Date().toISOString()
        }
      }
    });
    
    console.log('   ✓ Saved to database');
    
    // Step 5: Verify the result
    console.log('\n6. VERIFICATION:');
    const final = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    console.log('   Final content:', final.customFields?.content);
    console.log('   Has feedback:', !!final.customFields?.draftFeedback);
    
    // Check if replacement worked correctly
    if (final.customFields?.content?.includes('Replace wit test')) {
      console.log('\n✅ SUCCESS: Text was replaced correctly!');
      console.log('   "sdlgsdfgsdfgsdfgsdf" → "Replace wit test"');
    } else {
      console.log('\n❌ FAILED: Text was not replaced');
    }
    
    // Check document wasn't destroyed
    if (final.customFields?.content?.includes('Section 1.1.2')) {
      console.log('✅ Document structure preserved');
    } else {
      console.log('❌ Document structure lost');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testProperMerge();