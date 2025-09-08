const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAndMergeCorrect() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  console.log('=== RESET AND MERGE CORRECTLY ===\n');
  
  try {
    // Step 1: First get current document to preserve all fields
    console.log('1. GET CURRENT DOCUMENT:');
    const current = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    const existingFields = current.customFields || {};
    console.log('   Existing fields to preserve:', Object.keys(existingFields));
    
    // Step 2: Reset content to original WITH feedback
    console.log('\n2. RESET TO ORIGINAL:');
    const resetDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...existingFields,  // KEEP ALL EXISTING FIELDS
          content: '<p>Section 1.1.2: The text here contains sdlgsdfgsdfgsdfgsdf that needs improvement.</p>',
          draftFeedback: [{
            changeFrom: 'sdlgsdfgsdfgsdfgsdf',
            changeTo: 'Replace wit test'
          }]
        }
      }
    });
    
    console.log('   Reset content:', resetDoc.customFields.content);
    console.log('   Feedback ready:', resetDoc.customFields.draftFeedback[0]);
    
    // Step 3: Now apply the merge
    console.log('\n3. APPLY MERGE:');
    const feedback = resetDoc.customFields.draftFeedback[0];
    const mergedContent = resetDoc.customFields.content.replace(
      feedback.changeFrom,
      feedback.changeTo
    );
    
    console.log('   Changed: "' + feedback.changeFrom + '"');
    console.log('   To:      "' + feedback.changeTo + '"');
    
    // Step 4: Save merged content, preserving all other fields
    console.log('\n4. SAVE MERGED CONTENT:');
    const final = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...resetDoc.customFields,  // KEEP ALL FIELDS
          content: mergedContent,     // UPDATE ONLY CONTENT
          mergeApplied: true,
          mergeTime: new Date().toISOString()
        }
      }
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('   BEFORE: ...contains sdlgsdfgsdfgsdfgsdf that needs...');
    console.log('   AFTER:  ...contains Replace wit test that needs...');
    console.log('\n   All customFields preserved:', Object.keys(final.customFields));
    console.log('   Final content:', final.customFields.content);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndMergeCorrect();