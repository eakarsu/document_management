const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAndMergeProperly() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  console.log('=== GET FROM DB AND MERGE PROPERLY ===\n');
  
  try {
    // Step 1: Get FULL document from database
    console.log('1. GETTING FULL DOCUMENT FROM DATABASE:');
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    console.log('   Title:', document.title);
    console.log('   All customFields:', JSON.stringify(document.customFields, null, 2));
    
    // Step 2: Get current content and feedback
    const currentContent = document.customFields?.content || '';
    const feedback = document.customFields?.draftFeedback?.[0];
    
    if (!feedback) {
      console.log('\n❌ No feedback found');
      return;
    }
    
    console.log('\n2. CURRENT STATE:');
    console.log('   Content:', currentContent);
    console.log('   Feedback:', feedback);
    
    // Step 3: Apply merge to content ONLY
    console.log('\n3. MERGING:');
    const mergedContent = currentContent.replace(
      feedback.changeFrom,
      feedback.changeTo
    );
    console.log('   New content:', mergedContent);
    
    // Step 4: Update ONLY the content field, KEEP everything else
    console.log('\n4. UPDATING DATABASE - PRESERVING ALL OTHER FIELDS:');
    
    // Build the update - preserve existing customFields structure
    const existingCustomFields = document.customFields || {};
    const updatedCustomFields = {
      ...existingCustomFields,  // KEEP ALL EXISTING FIELDS
      content: mergedContent,   // UPDATE ONLY CONTENT
      lastMergeTime: new Date().toISOString()
    };
    
    console.log('   Preserved fields:', Object.keys(existingCustomFields));
    console.log('   Updated content field only');
    
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: updatedCustomFields
      }
    });
    
    console.log('\n✅ MERGE COMPLETE - ALL FIELDS PRESERVED!');
    console.log('   Final customFields:', JSON.stringify(updated.customFields, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getAndMergeProperly();