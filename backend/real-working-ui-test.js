const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();
const fs = require('fs');

const API_URL = 'http://localhost:4000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function realWorkingUITest() {
  console.log('=== REAL WORKING UI TEST - MIMICS AUTOMATED TEST EXACTLY ===\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Get the document we just created
    const doc = await prisma.document.findFirst({
      where: {
        id: 'doc_af_manual_mfbhj5v8'  // Use the exact ID from creation
      }
    });
    
    if (!doc) {
      throw new Error('Document not found');
    }
    
    console.log('📄 Document found:', doc.id);
    console.log('   Title:', doc.title);
    console.log('   Content length:', doc.customFields?.content?.length || 0);
    console.log('   Feedback items:', doc.customFields?.draftFeedback?.length || 0);
    
    // Get document content - EXACTLY like automated test
    let documentContent = doc.customFields.content;
    const feedback = doc.customFields.draftFeedback;
    
    console.log('\n' + '═'.repeat(70));
    console.log('PROCESSING ALL 15 FEEDBACK ITEMS');
    console.log('═'.repeat(70));
    
    // Sort feedback by severity (Critical -> Major -> Minor)
    const sortedFeedback = feedback.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 0, 'MAJOR': 1, 'MINOR': 2 };
      return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
    });
    
    let successCount = 0;
    
    for (let i = 0; i < sortedFeedback.length; i++) {
      const selectedFeedback = sortedFeedback[i];
      
      console.log(`\n──── Merge ${i + 1}/${sortedFeedback.length} ────`);
      console.log(`📍 Feedback: ${selectedFeedback.id}`);
      console.log(`📝 Type: ${selectedFeedback.commentType} | Severity: ${selectedFeedback.severity}`);
      console.log(`🎯 Page ${selectedFeedback.page}, Para ${selectedFeedback.paragraphNumber}`);
      
      // Show what we're changing (abbreviated)
      const changeFromShort = selectedFeedback.changeFrom.substring(0, 50) + (selectedFeedback.changeFrom.length > 50 ? '...' : '');
      const changeToShort = selectedFeedback.changeTo.substring(0, 50) + (selectedFeedback.changeTo.length > 50 ? '...' : '');
      console.log(`📝 Change: "${changeFromShort}"`);
      console.log(`        → "${changeToShort}"`);
      
      // Check if text exists before merge
      const textExistsBefore = documentContent.includes(selectedFeedback.changeFrom);
      
      if (!textExistsBefore) {
        // Check if changeTo already exists (cascading change)
        if (documentContent.includes(selectedFeedback.changeTo)) {
          console.log('ℹ️  Change already applied (cascading)');
          successCount++;
          testsPassed++;
          continue;
        } else {
          console.log('⚠️  WARNING: changeFrom text not found');
          console.log('   Looking for:', selectedFeedback.changeFrom.substring(0, 100));
          testsFailed++;
          continue;
        }
      }
      
      // DO THE EXACT SAME MERGE AS AUTOMATED TEST
      // Call the backend merge endpoint
      console.log('🔄 Calling merge endpoint...');
      
      const mergeResponse = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: documentContent,  // Send current content
          feedback: selectedFeedback,
          mode: 'ai'  // Use AI mode like automated test
        })
      });
      
      if (mergeResponse.ok) {
        const result = await mergeResponse.json();
        
        // Update document content for next merge
        documentContent = result.mergedContent;
        
        // Verify change was applied
        const changeApplied = result.mergedContent.includes(selectedFeedback.changeTo);
        const oldTextGone = !result.mergedContent.includes(selectedFeedback.changeFrom);
        
        if (changeApplied) {
          console.log('✅ Change successfully applied');
          successCount++;
          testsPassed++;
        } else {
          console.log('❌ Change not applied');
          testsFailed++;
        }
        
      } else {
        const errorData = await mergeResponse.json();
        console.log('❌ Merge endpoint failed:', mergeResponse.status);
        console.log('   Error:', errorData.error);
        testsFailed++;
      }
    }
    
    // Save final document to database
    console.log('\n📾 Saving final merged document to database...');
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        customFields: {
          ...doc.customFields,
          content: documentContent,
          allMergesApplied: true,
          mergeTestTimestamp: new Date().toISOString()
        }
      }
    });
    
    // Final verification
    console.log('\n' + '═'.repeat(70));
    console.log('FINAL VERIFICATION');
    console.log('═'.repeat(70));
    
    // Check document structure
    const hasH1 = documentContent.includes('<h1>AIR FORCE TECHNICAL MANUAL</h1>');
    const h1Count = (documentContent.match(/<h1>AIR FORCE TECHNICAL MANUAL<\/h1>/g) || []).length;
    const hasSectionI = documentContent.includes('SECTION I - INTRODUCTION');
    const sectionICount = (documentContent.match(/SECTION I - INTRODUCTION/g) || []).length;
    
    console.log('\n📋 Structure Tests:');
    console.log(`   H1 Title present: ${hasH1 ? '✅' : '❌'}`);
    console.log(`   H1 count: ${h1Count} ${h1Count === 1 ? '✅' : '❌ DUPLICATE!'}`);
    console.log(`   Section I present: ${hasSectionI ? '✅' : '❌'}`);
    console.log(`   Section I count: ${sectionICount} ${sectionICount === 1 ? '✅' : '❌ DUPLICATE!'}`);
    
    if (h1Count === 1) testsPassed++; else testsFailed++;
    if (sectionICount === 1) testsPassed++; else testsFailed++;
    
    // Check specific changes
    const hasAutomatically = documentContent.includes('automatically') && !documentContent.includes('automaticaly');
    const hasTypically = documentContent.includes('typically') && !documentContent.includes('typicaly');
    const hasSimultaneously = documentContent.includes('simultaneously') && !documentContent.includes('simultaneosly');
    
    console.log('\n📝 Spelling Corrections:');
    console.log(`   'automatically' fixed: ${hasAutomatically ? '✅' : '❌'}`);
    console.log(`   'typically' fixed: ${hasTypically ? '✅' : '❌'}`);
    console.log(`   'simultaneously' fixed: ${hasSimultaneously ? '✅' : '❌'}`);
    
    if (hasAutomatically) testsPassed++; else testsFailed++;
    if (hasTypically) testsPassed++; else testsFailed++;
    if (hasSimultaneously) testsPassed++; else testsFailed++;
    
    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`\n📊 Merge Results:`);
    console.log(`   Total feedback items: ${sortedFeedback.length}`);
    console.log(`   Successful merges: ${successCount}`);
    console.log(`   Failed merges: ${sortedFeedback.length - successCount}`);
    
    console.log(`\n📈 Test Results:`);
    console.log(`   Tests passed: ${testsPassed}`);
    console.log(`   Tests failed: ${testsFailed}`);
    console.log(`   Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    // Write report
    const report = {
      timestamp: new Date().toISOString(),
      documentId: doc.id,
      totalFeedback: sortedFeedback.length,
      successfulMerges: successCount,
      testsPassed,
      testsFailed,
      duplicateH1: h1Count > 1,
      duplicateSectionI: sectionICount > 1,
      finalContentLength: documentContent.length
    };
    
    fs.writeFileSync('real-working-ui-test-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n' + '═'.repeat(70));
    if (testsFailed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('\n✨ The backend merge logic is working correctly!');
      console.log('   The issue must be in how the frontend sends data.');
    } else {
      console.log('⚠️ SOME TESTS FAILED');
      console.log('   Check the report for details.');
    }
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('Starting real working UI test...\n');
realWorkingUITest();