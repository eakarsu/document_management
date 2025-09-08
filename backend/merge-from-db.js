const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require('node-fetch');

async function mergeFromDatabase() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma'; // test dcoumnc 4
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';
  
  console.log('=== MERGE FROM DATABASE - READ ACTUAL FEEDBACK ===\n');
  
  try {
    // Step 1: Read document from database
    console.log('1. READING DOCUMENT FROM DATABASE:');
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    console.log('   Title:', document.title);
    console.log('   ID:', document.id);
    
    // Step 2: Get current content and feedback
    const currentContent = document.customFields?.content || '';
    const feedbackArray = document.customFields?.draftFeedback || [];
    
    console.log('\n2. CURRENT STATE IN DATABASE:');
    console.log('   Content:', currentContent);
    console.log('   Number of feedback items:', feedbackArray.length);
    
    if (feedbackArray.length === 0) {
      console.log('\n❌ No feedback found in database');
      return;
    }
    
    // Step 3: Get first feedback
    const firstFeedback = feedbackArray[0];
    console.log('\n3. FIRST FEEDBACK FROM DATABASE:');
    console.log('   changeFrom:', firstFeedback.changeFrom);
    console.log('   changeTo:', firstFeedback.changeTo);
    if (firstFeedback.appliedAt) {
      console.log('   appliedAt:', firstFeedback.appliedAt);
    }
    
    // Step 4: Call the merge endpoint with database feedback
    console.log('\n4. CALLING MERGE ENDPOINT WITH DATABASE FEEDBACK:');
    
    const response = await fetch('http://localhost:4000/api/feedback-processor/merge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentContent: currentContent,
        feedback: {
          changeFrom: firstFeedback.changeFrom,
          changeTo: firstFeedback.changeTo
        },
        mode: 'manual'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('   ✅ Merge successful!');
      console.log('\n5. RESULT:');
      console.log('   Original:', currentContent);
      console.log('   Merged:', result.mergedContent);
      
      // Verify the change
      if (result.mergedContent.includes(firstFeedback.changeTo)) {
        console.log('\n✅ VERIFICATION: Feedback was applied correctly');
        console.log('   "' + firstFeedback.changeFrom + '" → "' + firstFeedback.changeTo + '"');
      } else {
        console.log('\n❌ VERIFICATION FAILED: Feedback was not applied');
      }
    } else {
      console.log('   ❌ Merge failed:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

mergeFromDatabase();