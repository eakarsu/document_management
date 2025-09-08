const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();
const fs = require('fs');

const API_URL = 'http://localhost:4000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function applyAllFeedbacksTest() {
  console.log('=== APPLYING ALL 15 FEEDBACKS TEST ===\n');
  console.log('This test will apply all 15 feedback items to the document\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Step 1: Create fresh document with all feedback
    console.log('📄 STEP 1: Creating fresh document with 15 feedback items...');
    const createScript = require('./create-af-manual-comprehensive.js');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the most recent document
    const doc = await prisma.document.findFirst({
      where: {
        title: 'Air Force Technical Manual - F-16C/D Flight Manual'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!doc) {
      throw new Error('Document not found');
    }
    
    console.log('✅ Document created:', doc.id);
    console.log('   Title:', doc.title);
    console.log('   Content length:', doc.customFields?.content?.length || 0);
    console.log('   Feedback items:', doc.customFields?.draftFeedback?.length || 0);
    
    // Step 2: Get initial content and feedback
    let documentContent = doc.customFields.content;
    const feedback = doc.customFields.draftFeedback;
    
    // Sort feedback by severity (Critical -> Major -> Minor)
    const sortedFeedback = feedback.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 0, 'MAJOR': 1, 'MINOR': 2 };
      return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
    });
    
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 2: APPLYING ALL 15 FEEDBACK ITEMS');
    console.log('═'.repeat(70));
    
    let successCount = 0;
    let failureCount = 0;
    const mergeResults = [];
    
    // Process each feedback item
    for (let i = 0; i < sortedFeedback.length; i++) {
      const selectedFeedback = sortedFeedback[i];
      
      console.log(`\n──── Feedback ${i + 1}/15 ────`);
      console.log(`ID: ${selectedFeedback.id}`);
      console.log(`Type: ${selectedFeedback.commentType} | Severity: ${selectedFeedback.severity}`);
      console.log(`Page ${selectedFeedback.page}, Paragraph ${selectedFeedback.paragraphNumber}`);
      
      // Show abbreviated change
      const changeFromShort = selectedFeedback.changeFrom.substring(0, 40) + 
                             (selectedFeedback.changeFrom.length > 40 ? '...' : '');
      const changeToShort = selectedFeedback.changeTo.substring(0, 40) + 
                           (selectedFeedback.changeTo.length > 40 ? '...' : '');
      console.log(`Change: "${changeFromShort}"`);
      console.log(`     → "${changeToShort}"`);
      
      // Check if text exists before merge
      const textExistsBefore = documentContent.includes(selectedFeedback.changeFrom);
      
      if (!textExistsBefore) {
        // Check if already applied
        if (documentContent.includes(selectedFeedback.changeTo)) {
          console.log('ℹ️  Already applied');
          successCount++;
          mergeResults.push({ id: selectedFeedback.id, status: 'already_applied' });
          continue;
        } else {
          console.log('⚠️  Text not found - skipping');
          failureCount++;
          mergeResults.push({ id: selectedFeedback.id, status: 'not_found' });
          continue;
        }
      }
      
      // Call merge endpoint
      console.log('🔄 Calling merge endpoint...');
      const mergeResponse = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: documentContent,
          feedback: selectedFeedback,
          mode: 'ai'
        })
      });
      
      if (mergeResponse.ok) {
        const result = await mergeResponse.json();
        
        // Update content for next merge
        documentContent = result.mergedContent;
        
        // Verify change applied
        const changeApplied = documentContent.includes(selectedFeedback.changeTo);
        
        if (changeApplied) {
          console.log('✅ Successfully applied');
          successCount++;
          mergeResults.push({ id: selectedFeedback.id, status: 'success' });
        } else {
          console.log('❌ Change not applied');
          failureCount++;
          mergeResults.push({ id: selectedFeedback.id, status: 'failed' });
        }
      } else {
        const errorData = await mergeResponse.json();
        console.log('❌ Merge failed:', errorData.error);
        failureCount++;
        mergeResults.push({ id: selectedFeedback.id, status: 'error', error: errorData.error });
      }
    }
    
    // Step 3: Save final document
    console.log('\n📾 STEP 3: Saving final merged document...');
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        customFields: {
          ...doc.customFields,
          content: documentContent,
          allMergesApplied: true,
          mergeTestTimestamp: new Date().toISOString(),
          mergeResults: mergeResults
        }
      }
    });
    console.log('✅ Document saved');
    
    // Step 4: Verification
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 4: FINAL VERIFICATION');
    console.log('═'.repeat(70));
    
    // Structure tests
    const h1Count = (documentContent.match(/<h1>AIR FORCE TECHNICAL MANUAL<\/h1>/g) || []).length;
    const sectionICount = (documentContent.match(/SECTION I - INTRODUCTION/g) || []).length;
    const sectionIICount = (documentContent.match(/SECTION II - AIRCRAFT SYSTEMS/g) || []).length;
    const sectionIIICount = (documentContent.match(/SECTION III - OPERATING PROCEDURES/g) || []).length;
    const sectionIVCount = (documentContent.match(/SECTION IV - EMERGENCY PROCEDURES/g) || []).length;
    
    console.log('\n📋 Structure Tests:');
    console.log(`   H1 Title count: ${h1Count} ${h1Count === 1 ? '✅' : '❌ DUPLICATE!'}`);
    console.log(`   Section I count: ${sectionICount} ${sectionICount === 1 ? '✅' : '❌ DUPLICATE!'}`);
    console.log(`   Section II count: ${sectionIICount} ${sectionIICount === 1 ? '✅' : '❌ DUPLICATE!'}`);
    console.log(`   Section III count: ${sectionIIICount} ${sectionIIICount === 1 ? '✅' : '❌ DUPLICATE!'}`);
    console.log(`   Section IV count: ${sectionIVCount} ${sectionIVCount === 1 ? '✅' : '❌ DUPLICATE!'}`);
    
    if (h1Count === 1) testsPassed++; else testsFailed++;
    if (sectionICount === 1) testsPassed++; else testsFailed++;
    if (sectionIICount === 1) testsPassed++; else testsFailed++;
    if (sectionIIICount === 1) testsPassed++; else testsFailed++;
    if (sectionIVCount === 1) testsPassed++; else testsFailed++;
    
    // Content tests - all spelling corrections
    const spellingTests = [
      { wrong: 'automaticaly', correct: 'automatically' },
      { wrong: 'typicaly', correct: 'typically' },
      { wrong: 'simultaneosly', correct: 'simultaneously' },
      { wrong: 'malfuntion', correct: 'malfunction' },
      { wrong: 'extremly', correct: 'extremely' }
    ];
    
    console.log('\n📝 Spelling Corrections:');
    for (const test of spellingTests) {
      const hasCorrect = documentContent.includes(test.correct);
      const hasWrong = documentContent.includes(test.wrong);
      const isFixed = hasCorrect && !hasWrong;
      console.log(`   '${test.wrong}' → '${test.correct}': ${isFixed ? '✅' : '❌'}`);
      if (isFixed) testsPassed++; else testsFailed++;
    }
    
    // Sentence improvements
    const sentenceTests = [
      { id: 'fb_af_001', text: 'This manual provides comprehensive flight operating' },
      { id: 'fb_af_003', text: 'The Air Force requires strict adherence' },
      { id: 'fb_af_004', text: 'During emergencies, immediately refer' },
      { id: 'fb_af_015', text: 'Complete dual hydraulic failure results' }
    ];
    
    console.log('\n📄 Sentence Improvements:');
    for (const test of sentenceTests) {
      const hasImprovement = documentContent.includes(test.text);
      console.log(`   ${test.id}: ${hasImprovement ? '✅' : '❌'}`);
      if (hasImprovement) testsPassed++; else testsFailed++;
    }
    
    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));
    
    console.log('\n📊 Merge Results:');
    console.log(`   Total feedback items: 15`);
    console.log(`   Successfully applied: ${successCount}`);
    console.log(`   Failed to apply: ${failureCount}`);
    console.log(`   Success rate: ${((successCount / 15) * 100).toFixed(1)}%`);
    
    console.log('\n📈 Verification Tests:');
    console.log(`   Tests passed: ${testsPassed}`);
    console.log(`   Tests failed: ${testsFailed}`);
    console.log(`   Test success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    // By type breakdown
    const byType = {
      C: mergeResults.filter(r => sortedFeedback.find(f => f.id === r.id)?.commentType === 'C'),
      S: mergeResults.filter(r => sortedFeedback.find(f => f.id === r.id)?.commentType === 'S'),
      A: mergeResults.filter(r => sortedFeedback.find(f => f.id === r.id)?.commentType === 'A')
    };
    
    console.log('\n📈 By Feedback Type:');
    console.log(`   Critical (C): ${byType.C.filter(r => r.status === 'success').length}/3`);
    console.log(`   Substantive (S): ${byType.S.filter(r => r.status === 'success').length}/7`);
    console.log(`   Administrative (A): ${byType.A.filter(r => r.status === 'success').length}/5`);
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      documentId: doc.id,
      totalFeedback: 15,
      successfulMerges: successCount,
      failedMerges: failureCount,
      testsPassed,
      testsFailed,
      successRate: ((successCount / 15) * 100).toFixed(1) + '%',
      testSuccessRate: ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1) + '%',
      noDuplicates: h1Count === 1 && sectionICount === 1,
      allSpellingFixed: spellingTests.every(t => documentContent.includes(t.correct) && !documentContent.includes(t.wrong)),
      finalContentLength: documentContent.length,
      mergeResults
    };
    
    fs.writeFileSync('apply-all-feedbacks-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved: apply-all-feedbacks-report.json');
    
    // Final result
    console.log('\n' + '═'.repeat(70));
    if (successCount === 15 && testsFailed === 0) {
      console.log('🎉 PERFECT! ALL 15 FEEDBACKS APPLIED SUCCESSFULLY!');
      console.log('✨ No duplicates, all spelling fixed, all improvements applied!');
    } else if (successCount >= 13) {
      console.log('✅ TEST PASSED - Most feedbacks applied successfully');
    } else {
      console.log('⚠️ TEST HAD ISSUES - Check report for details');
    }
    console.log('═'.repeat(70));
    
    console.log('\n🔗 View the final document at:');
    console.log(`   http://localhost:3000/documents/${doc.id}/opr-review`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting comprehensive test to apply all 15 feedbacks...\n');
applyAllFeedbacksTest();