const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function realFix() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  console.log('=== REAL FIX - PRESERVE ALL FIELDS ===\n');
  
  try {
    // Step 1: Get FULL document with ALL fields
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    console.log('1. CURRENT DOCUMENT:');
    console.log('   All customFields keys:', Object.keys(document.customFields || {}));
    console.log('   Current content:', document.customFields?.content);
    
    // Step 2: Get feedback
    const feedback = document.customFields?.draftFeedback?.[0];
    if (!feedback) {
      console.log('No feedback found');
      return;
    }
    
    console.log('\n2. FEEDBACK:');
    console.log('   changeFrom:', feedback.changeFrom);
    console.log('   changeTo:', feedback.changeTo);
    
    // Step 3: Apply merge to content ONLY
    const content = document.customFields?.content || '';
    const mergedContent = content.replaceAll(
      feedback.changeFrom,
      feedback.changeTo
    );
    
    console.log('\n3. MERGE:');
    console.log('   Before:', content);
    console.log('   After:', mergedContent);
    
    // Step 4: Update - PRESERVE ALL EXISTING FIELDS
    const existingCustomFields = document.customFields || {};
    const updatedCustomFields = {
      ...existingCustomFields,  // KEEP EVERYTHING
      content: mergedContent    // ONLY UPDATE CONTENT
    };
    
    console.log('\n4. UPDATE - PRESERVING FIELDS:');
    console.log('   Keeping fields:', Object.keys(existingCustomFields));
    console.log('   Only updating: content');
    
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: updatedCustomFields
      }
    });
    
    // Step 5: Verify
    const final = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    console.log('\n5. VERIFICATION:');
    console.log('   Final content:', final.customFields?.content);
    console.log('   All fields preserved:', Object.keys(final.customFields || {}));
    console.log('   Feedback still there:', !!final.customFields?.draftFeedback);
    
    if (mergedContent === final.customFields?.content) {
      console.log('\n✅ SUCCESS: Content updated correctly');
      console.log('   Only the specific text was replaced');
      console.log('   All other fields preserved');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

realFix();