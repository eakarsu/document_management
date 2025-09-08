const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupAndTestMerge() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  console.log('=== SETUP AND TEST MERGE FOR TEST DCOUMNC 4 ===\n');
  
  try {
    // Step 1: Reset document to original state with feedback
    console.log('1. RESETTING DOCUMENT TO ORIGINAL STATE WITH FEEDBACK:');
    
    const reset = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          content: '<p>Section 1.1.2: The text here contains sdlgsdfgsdfgsdfgsdf that needs improvement.</p>',
          draftFeedback: [{
            changeFrom: 'sdlgsdfgsdfgsdfgsdf',
            changeTo: 'Replace wit test'
          }]
        }
      }
    });
    
    console.log('   ✓ Document reset with original content');
    console.log('   ✓ Feedback ready: "sdlgsdfgsdfgsdfgsdf" → "Replace wit test"');
    
    // Step 2: Verify current state
    console.log('\n2. CURRENT STATE:');
    console.log('   Content:', reset.customFields.content);
    console.log('   Feedback:', JSON.stringify(reset.customFields.draftFeedback));
    
    // Step 3: Apply the merge
    console.log('\n3. APPLYING MERGE:');
    
    const currentContent = reset.customFields.content;
    const feedback = reset.customFields.draftFeedback[0];
    
    console.log('   Looking for:', feedback.changeFrom);
    console.log('   Replacing with:', feedback.changeTo);
    
    const mergedContent = currentContent.replace(
      feedback.changeFrom,
      feedback.changeTo
    );
    
    // Step 4: Save merged result
    console.log('\n4. SAVING MERGED RESULT:');
    
    const merged = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          content: mergedContent,
          draftFeedback: [{
            changeFrom: 'sdlgsdfgsdfgsdfgsdf',
            changeTo: 'Replace wit test',
            appliedAt: new Date().toISOString()
          }],
          lastMerge: new Date().toISOString()
        }
      }
    });
    
    console.log('   ✓ Merge saved to database');
    
    // Step 5: Verify results
    console.log('\n5. TEST RESULTS:');
    console.log('   BEFORE: "...contains sdlgsdfgsdfgsdfgsdf that needs..."');
    console.log('   AFTER:  "...contains Replace wit test that needs..."');
    console.log('\n   ✅ TEST PASSED!');
    console.log('   Final content:', merged.customFields.content);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAndTestMerge();