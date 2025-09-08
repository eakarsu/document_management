const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:4000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function comprehensiveUITest() {
  console.log('=== COMPREHENSIVE UI INTEGRATION TEST ===\n');
  console.log('This test simulates the complete OPR review workflow:\n');
  console.log('1. Use existing document with feedback');
  console.log('2. Simulate OPR Review page load');
  console.log('3. Select feedback items');
  console.log('4. Merge with AI');
  console.log('5. Verify results\n');
  
  const documentId = 'doc_301ac9c3b9841e2c'; // Document we just created
  let testResults = {
    documentLoad: false,
    feedbackDisplay: false,
    aiMerge: false,
    manualMerge: false,
    contentPreserved: false
  };
  
  try {
    // Step 1: Load document from database
    console.log('STEP 1: LOADING DOCUMENT FROM DATABASE');
    console.log('=' .repeat(50));
    
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      throw new Error('Document not found. Run create-full-document-test.js first');
    }
    
    testResults.documentLoad = true;
    console.log('✅ Document loaded:', document.title);
    console.log('   Pages:', document.customFields?.pageCount || 3);
    console.log('   Feedback items:', document.customFields?.draftFeedback?.length || 0);
    
    // Step 2: Simulate OPR Review page functionality
    console.log('\nSTEP 2: SIMULATING OPR REVIEW PAGE');
    console.log('=' .repeat(50));
    
    const feedback = document.customFields?.draftFeedback || [];
    testResults.feedbackDisplay = feedback.length > 0;
    
    console.log('📋 Displaying feedback items:');
    feedback.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. Page ${item.page}, Para ${item.paragraph}:`);
      console.log(`      "${item.changeFrom}" → "${item.changeTo}"`);
      console.log(`      Type: ${item.type}, POC: ${item.pocName}`);
    });
    
    // Step 3: Test merging critical feedback with AI
    console.log('\nSTEP 3: TESTING AI MERGE FOR CRITICAL FEEDBACK');
    console.log('=' .repeat(50));
    
    const criticalFeedback = feedback.find(f => f.type === 'C');
    if (criticalFeedback) {
      console.log('🎯 Selected critical feedback:');
      console.log('   Page:', criticalFeedback.page);
      console.log('   Change:', `"${criticalFeedback.changeFrom}" → "${criticalFeedback.changeTo}"`);
      console.log('   Comment:', criticalFeedback.comment);
      
      // Get the original content
      const originalContent = document.customFields?.content || '';
      
      // Call merge endpoint with AI mode
      console.log('\n🤖 Calling merge endpoint with AI mode...');
      const mergeResponse = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: originalContent,
          feedback: criticalFeedback,
          mode: 'ai'
        })
      });
      
      if (mergeResponse.ok) {
        const result = await mergeResponse.json();
        testResults.aiMerge = result.success;
        
        console.log('✅ AI merge successful!');
        
        // Verify the change was applied
        if (result.mergedContent && !result.mergedContent.includes(criticalFeedback.changeFrom)) {
          console.log('✅ Text was replaced correctly');
          console.log('   Original text removed:', criticalFeedback.changeFrom);
          console.log('   New text present:', result.mergedContent.includes(criticalFeedback.changeTo));
        }
        
        // Check if document structure preserved
        testResults.contentPreserved = result.mergedContent.includes('Technical Requirements Document');
        console.log('✅ Document structure preserved:', testResults.contentPreserved);
        
      } else {
        console.log('❌ AI merge failed:', mergeResponse.status);
      }
    }
    
    // Step 4: Test manual merge
    console.log('\nSTEP 4: TESTING MANUAL MERGE');
    console.log('=' .repeat(50));
    
    const manualFeedback = feedback.find(f => f.type === 'S');
    if (manualFeedback) {
      console.log('📝 Selected substantive feedback:');
      console.log('   Page:', manualFeedback.page);
      console.log('   Change:', `"${manualFeedback.changeFrom}" → "${manualFeedback.changeTo}"`);
      
      const originalContent = document.customFields?.content || '';
      
      console.log('\n🔧 Calling merge endpoint with manual mode...');
      const mergeResponse = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: originalContent,
          feedback: manualFeedback,
          mode: 'manual'
        })
      });
      
      if (mergeResponse.ok) {
        const result = await mergeResponse.json();
        testResults.manualMerge = result.success;
        
        console.log('✅ Manual merge successful!');
        
        // Verify specific text replacement
        if (result.mergedContent) {
          const oldTextGone = !result.mergedContent.includes(manualFeedback.changeFrom);
          const newTextPresent = result.mergedContent.includes(manualFeedback.changeTo);
          
          console.log('   Old text removed:', oldTextGone ? '✅' : '❌');
          console.log('   New text added:', newTextPresent ? '✅' : '❌');
          
          // Save merged content to database
          if (oldTextGone && newTextPresent) {
            console.log('\n💾 Saving merged content to database...');
            await prisma.document.update({
              where: { id: documentId },
              data: {
                customFields: {
                  ...document.customFields,
                  content: result.mergedContent,
                  lastMerge: new Date().toISOString(),
                  mergedFeedback: [manualFeedback]
                }
              }
            });
            console.log('✅ Saved to database');
          }
        }
      } else {
        console.log('❌ Manual merge failed:', mergeResponse.status);
      }
    }
    
    // Step 5: Final verification
    console.log('\nSTEP 5: FINAL VERIFICATION');
    console.log('=' .repeat(50));
    
    const updatedDoc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    console.log('📊 Test Results:');
    console.log('   Document Load:', testResults.documentLoad ? '✅' : '❌');
    console.log('   Feedback Display:', testResults.feedbackDisplay ? '✅' : '❌');
    console.log('   AI Merge:', testResults.aiMerge ? '✅' : '❌');
    console.log('   Manual Merge:', testResults.manualMerge ? '✅' : '❌');
    console.log('   Content Preserved:', testResults.contentPreserved ? '✅' : '❌');
    
    const allPassed = Object.values(testResults).every(v => v === true);
    
    console.log('\n' + '=' .repeat(50));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('The OPR Review merge functionality is working correctly.');
    } else {
      console.log('⚠️ SOME TESTS FAILED');
      console.log('Please check the failed tests above.');
    }
    
    // Display the OPR Review URL
    console.log('\n📌 To manually test in browser:');
    console.log(`   http://localhost:3000/documents/${documentId}/opr-review`);
    
    // Show sample merged content
    if (updatedDoc?.customFields?.content) {
      console.log('\n📄 Sample of merged content:');
      const content = updatedDoc.customFields.content;
      const sample = content.substring(0, 300);
      console.log('   ' + sample + '...');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comprehensive test
console.log('Starting comprehensive UI integration test...\n');
comprehensiveUITest();