const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();
const fs = require('fs');

const API_URL = 'http://localhost:4000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function automatedOPRReviewTest() {
  console.log('=== AUTOMATED OPR REVIEW TEST - MERGING ALL FEEDBACK ===\n');
  console.log('This test simulates the OPR Review page workflow:');
  console.log('1. Load document with feedback');
  console.log('2. Select and merge each feedback item');
  console.log('3. Verify replacements are correct');
  console.log('4. Save final document\n');
  
  const documentId = 'doc_af_manual_mfbe0ntb'; // Air Force Technical Manual with 15 feedback items
  const testResults = [];
  let totalMerged = 0;
  let failedMerges = 0;
  
  try {
    // Step 1: Load document from database
    console.log('═'.repeat(70));
    console.log('STEP 1: LOADING DOCUMENT FROM DATABASE');
    console.log('═'.repeat(70));
    
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    console.log('✅ Document loaded:', document.title);
    console.log('   Feedback items:', document.customFields?.draftFeedback?.length || 0);
    
    let currentContent = document.customFields?.content || '';
    const feedbackItems = document.customFields?.draftFeedback || [];
    
    // Sort feedback: process sentences first to avoid cascading issues
    const sortedFeedback = [...feedbackItems].sort((a, b) => {
      const aWords = (a.changeFrom || '').split(' ').length;
      const bWords = (b.changeFrom || '').split(' ').length;
      // Process longer changes first (sentences before single words)
      return bWords - aWords;
    });
    
    // Step 2: Process each feedback item
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 2: PROCESSING FEEDBACK ITEMS (Sentences first, then words)');
    console.log('═'.repeat(70));
    console.log('Processing order: Sentences → Words (to avoid cascading conflicts)');
    
    for (let i = 0; i < sortedFeedback.length; i++) {
      const feedback = sortedFeedback[i];
      console.log(`\n──── Feedback ${i + 1}/${sortedFeedback.length} ────`);
      console.log(`📍 Location: Page ${feedback.page}, Para ${feedback.paragraphNumber}, Line ${feedback.lineNumber}`);
      console.log(`👤 POC: ${feedback.pocName} (${feedback.pocPhone})`);
      console.log(`📧 Email: ${feedback.pocEmail}`);
      console.log(`🏷️  Type: ${feedback.commentType} | Severity: ${feedback.severity}`);
      console.log(`📦 Component: ${feedback.component}`);
      
      // Display change preview
      if (feedback.changeFrom.length > 50) {
        console.log(`\n📝 Change: "${feedback.changeFrom.substring(0, 50)}..."`);
        console.log(`        → "${feedback.changeTo.substring(0, 50)}..."`);
      } else {
        console.log(`\n📝 Change: "${feedback.changeFrom}"`);
        console.log(`        → "${feedback.changeTo}"`);
      }
      
      console.log(`💬 Comment: ${feedback.coordinatorComment}`);
      
      // Always use AI mode for all feedback
      let mergeMode = 'ai';
      console.log('\n🤖 Using AI merge mode for all feedback');
      
      // Call merge endpoint
      console.log('🔄 Calling merge endpoint...');
      
      const mergeResponse = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: currentContent,
          feedback: {
            id: feedback.id,
            page: feedback.page,
            paragraphNumber: feedback.paragraphNumber,
            lineNumber: feedback.lineNumber,
            changeFrom: feedback.changeFrom,
            changeTo: feedback.changeTo,
            coordinatorComment: feedback.coordinatorComment,
            coordinatorJustification: feedback.coordinatorJustification,
            pocName: feedback.pocName,
            pocEmail: feedback.pocEmail,
            pocPhone: feedback.pocPhone,
            component: feedback.component,
            commentType: feedback.commentType
          },
          mode: mergeMode
        })
      });
      
      // FIRST: Check if the changeFrom text actually exists in the current content
      const textExists = currentContent.includes(feedback.changeFrom);
      
      if (!textExists) {
        console.log('⚠️  WARNING: changeFrom text not found in document!');
        console.log('   Looking for:', feedback.changeFrom.substring(0, 50) + '...');
        
        // Try to find similar text
        const searchStart = feedback.changeFrom.substring(0, 20);
        const similarIndex = currentContent.indexOf(searchStart);
        if (similarIndex > -1) {
          const actualText = currentContent.substring(similarIndex, similarIndex + 100);
          console.log('   Found similar:', actualText.substring(0, 50) + '...');
        } else {
          console.log('   No similar text found');
        }
      }
      
      if (mergeResponse.ok) {
        const result = await mergeResponse.json();
        
        if (result.success && result.mergedContent) {
          // Verify the change was applied CORRECTLY
          const oldTextGone = !result.mergedContent.includes(feedback.changeFrom);
          const newTextPresent = result.mergedContent.includes(feedback.changeTo);
          
          // For verification, check that the EXACT changeTo text is in the document
          if (textExists && oldTextGone && newTextPresent) {
            console.log('✅ Merge successful and verified!');
            console.log('   Old text existed:', textExists ? '✓' : '✗');
            console.log('   Old text removed:', oldTextGone ? '✓' : '✗');
            console.log('   New text added:', newTextPresent ? '✓' : '✗');
            console.log('   Verified: changeTo text is present in document');
            
            currentContent = result.mergedContent;
            totalMerged++;
            
            testResults.push({
              feedbackId: feedback.id,
              status: 'SUCCESS',
              type: feedback.commentType,
              mode: mergeMode,
              changeApplied: true
            });
          } else {
            console.log('❌ Merge FAILED - verification failed!');
            console.log('   Old text still present:', !oldTextGone);
            console.log('   New text not found:', !newTextPresent);
            
            // Show what we expected vs what we got
            if (!newTextPresent && feedback.changeTo) {
              console.log('\n   EXPECTED changeTo text:');
              console.log('   "' + feedback.changeTo.substring(0, 80) + '..."');
              
              // Try to find what's actually there
              const searchArea = feedback.changeTo.substring(0, 20);
              const actualIndex = result.mergedContent.indexOf(searchArea);
              if (actualIndex === -1) {
                console.log('   ACTUAL: Could not find any similar text in document');
              } else {
                const actualText = result.mergedContent.substring(actualIndex, actualIndex + 100);
                console.log('   ACTUAL text found instead:');
                console.log('   "' + actualText + '..."');
              }
            }
            
            failedMerges++;
            
            testResults.push({
              feedbackId: feedback.id,
              status: 'PARTIAL',
              type: feedback.commentType,
              mode: mergeMode,
              changeApplied: false
            });
          }
        } else {
          console.log('❌ Merge failed - no content returned');
          failedMerges++;
          
          testResults.push({
            feedbackId: feedback.id,
            status: 'FAILED',
            type: feedback.commentType,
            mode: mergeMode,
            changeApplied: false
          });
        }
      } else {
        console.log('❌ Merge endpoint error:', mergeResponse.status);
        failedMerges++;
        
        testResults.push({
          feedbackId: feedback.id,
          status: 'ERROR',
          type: feedback.commentType,
          mode: mergeMode,
          changeApplied: false
        });
      }
      
      // Add small delay between merges
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Step 3: Save final merged document
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 3: SAVING FINAL MERGED DOCUMENT');
    console.log('═'.repeat(70));
    
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...document.customFields,
          content: currentContent,
          mergeTestCompleted: true,
          mergeTestResults: testResults,
          lastMergeTest: new Date().toISOString(),
          totalMerged: totalMerged,
          failedMerges: failedMerges
        }
      }
    });
    
    console.log('✅ Document saved with merged content');
    
    // Step 4: Generate test report
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 4: TEST RESULTS SUMMARY');
    console.log('═'.repeat(70));
    
    console.log('\n📊 MERGE STATISTICS:');
    console.log('   Total feedback items:', sortedFeedback.length);
    console.log('   Successfully merged:', totalMerged);
    console.log('   Failed merges:', failedMerges);
    console.log('   Success rate:', ((totalMerged / sortedFeedback.length) * 100).toFixed(1) + '%');
    
    console.log('\n📈 BY FEEDBACK TYPE:');
    const byType = {
      C: testResults.filter(r => r.type === 'C'),
      M: testResults.filter(r => r.type === 'M'),
      S: testResults.filter(r => r.type === 'S'),
      A: testResults.filter(r => r.type === 'A')
    };
    
    console.log('   Critical (C):', byType.C.filter(r => r.status === 'SUCCESS').length + '/' + byType.C.length);
    console.log('   Major (M):', byType.M.filter(r => r.status === 'SUCCESS').length + '/' + byType.M.length);
    console.log('   Substantive (S):', byType.S.filter(r => r.status === 'SUCCESS').length + '/' + byType.S.length);
    console.log('   Administrative (A):', byType.A.filter(r => r.status === 'SUCCESS').length + '/' + byType.A.length);
    
    console.log('\n🔄 BY MERGE MODE:');
    const aiMerges = testResults.filter(r => r.mode === 'ai');
    const manualMerges = testResults.filter(r => r.mode === 'manual');
    
    console.log('   AI merges:', aiMerges.filter(r => r.status === 'SUCCESS').length + '/' + aiMerges.length);
    console.log('   Manual merges:', manualMerges.filter(r => r.status === 'SUCCESS').length + '/' + manualMerges.length);
    
    // Step 5: Verify final document
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 5: FINAL DOCUMENT VERIFICATION');
    console.log('═'.repeat(70));
    
    // Check for common misspellings that should be fixed
    const shouldBeFixed = [
      'managment', 'approch', 'comunicate', 'comunicates', 
      'transactonal', 'comunicaton', 'infrastucture'
    ];
    
    const stillPresent = shouldBeFixed.filter(word => currentContent.includes(word));
    
    if (stillPresent.length === 0) {
      console.log('\n✅ ALL SPELLING ERRORS FIXED!');
    } else {
      console.log('\n⚠️ Some errors still present:', stillPresent);
    }
    
    // Write test log
    const logContent = {
      timestamp: new Date().toISOString(),
      documentId: documentId,
      totalFeedback: feedbackItems.length,
      successfulMerges: totalMerged,
      failedMerges: failedMerges,
      successRate: ((totalMerged / feedbackItems.length) * 100).toFixed(1) + '%',
      results: testResults
    };
    
    fs.writeFileSync(
      'opr-review-test-log.json',
      JSON.stringify(logContent, null, 2)
    );
    
    console.log('\n📝 Test log saved to: opr-review-test-log.json');
    
    // Final status
    console.log('\n' + '═'.repeat(70));
    if (totalMerged === feedbackItems.length) {
      console.log('🎉 TEST PASSED - ALL FEEDBACK MERGED SUCCESSFULLY!');
    } else if (totalMerged > feedbackItems.length * 0.8) {
      console.log('✅ TEST MOSTLY PASSED - ' + successRate + ' success rate');
    } else {
      console.log('❌ TEST FAILED - Too many merge failures');
    }
    console.log('═'.repeat(70));
    
    console.log('\n🔗 View updated document:');
    console.log('   http://localhost:3000/documents/' + documentId + '/opr-review');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the automated test
console.log('Starting automated OPR Review test...\n');
automatedOPRReviewTest();