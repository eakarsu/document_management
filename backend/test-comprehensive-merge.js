const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();
const fs = require('fs');

const API_URL = 'http://localhost:4000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function testComprehensiveMerge() {
  console.log('=== COMPREHENSIVE MERGE TEST - SENTENCES & SPELLING ===\n');
  
  const documentId = 'doc_test_comprehensive_mfbcsram';
  
  try {
    // Step 1: Load document
    console.log('Step 1: Loading comprehensive test document...');
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    console.log('✅ Document loaded:', document.title);
    
    const feedbackItems = document.customFields?.draftFeedback || [];
    console.log('   Total feedback items:', feedbackItems.length);
    
    // Step 2: Process feedback with intelligent ordering
    console.log('\nStep 2: Processing feedback with cascading change handling...\n');
    
    // Sort feedback: sentence changes first, then word changes
    const sortedFeedback = [...feedbackItems].sort((a, b) => {
      const aWords = a.changeFrom.split(' ').length;
      const bWords = b.changeFrom.split(' ').length;
      // Process longer changes first (sentences before words)
      return bWords - aWords;
    });
    
    console.log('📋 Processing order:');
    console.log('   Sentence rephrasings first:', sortedFeedback.filter(f => f.changeFrom.split(' ').length > 5).length);
    console.log('   Then spelling corrections:', sortedFeedback.filter(f => f.changeFrom.split(' ').length <= 5).length);
    
    let currentContent = document.customFields?.content || '';
    const testResults = [];
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    
    console.log('\n' + '─'.repeat(70));
    
    for (let i = 0; i < sortedFeedback.length; i++) {
      const feedback = sortedFeedback[i];
      const changeType = feedback.changeFrom.split(' ').length > 5 ? 'SENTENCE' : 'WORD';
      
      console.log(`\n[${i + 1}/${sortedFeedback.length}] ${changeType} - ${feedback.commentType}/${feedback.severity}`);
      console.log(`   Component: ${feedback.component}`);
      
      if (feedback.changeFrom.length > 80) {
        console.log(`   From: "${feedback.changeFrom.substring(0, 80)}..."`);
        console.log(`   To:   "${feedback.changeTo.substring(0, 80)}..."`);
      } else {
        console.log(`   From: "${feedback.changeFrom}"`);
        console.log(`   To:   "${feedback.changeTo}"`);
      }
      
      // Check if the text still exists (might have been changed by previous feedback)
      if (!currentContent.includes(feedback.changeFrom)) {
        console.log('   ⚠️  SKIPPED: Text already changed by previous feedback');
        
        // Try to find if the changeTo text is already there
        if (currentContent.includes(feedback.changeTo)) {
          console.log('   ✓ Target text already present (likely from cascading change)');
        } else {
          // Check for partial match
          const partialSearch = feedback.changeFrom.substring(0, Math.min(30, feedback.changeFrom.length));
          if (currentContent.includes(partialSearch)) {
            console.log('   ℹ️  Partial match found but full text differs');
          }
        }
        
        skippedCount++;
        testResults.push({
          feedbackId: feedback.id,
          status: 'SKIPPED',
          type: feedback.commentType,
          severity: feedback.severity,
          changeType: changeType,
          reason: 'Text already modified'
        });
        continue;
      }
      
      // Call merge endpoint
      console.log('   🔄 Processing merge...');
      
      const mergeResponse = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: currentContent,
          feedback: feedback,
          mode: 'ai'
        })
      });
      
      if (mergeResponse.ok) {
        const result = await mergeResponse.json();
        
        if (result.success && result.mergedContent) {
          // Verify the change
          const oldTextGone = !result.mergedContent.includes(feedback.changeFrom);
          const newTextPresent = result.mergedContent.includes(feedback.changeTo);
          
          if (oldTextGone && newTextPresent) {
            console.log('   ✅ SUCCESS: Text replaced correctly');
            currentContent = result.mergedContent;
            successCount++;
            
            testResults.push({
              feedbackId: feedback.id,
              status: 'SUCCESS',
              type: feedback.commentType,
              severity: feedback.severity,
              changeType: changeType
            });
          } else {
            console.log('   ❌ FAILED: Verification failed');
            console.log('      Old text removed:', oldTextGone);
            console.log('      New text added:', newTextPresent);
            failureCount++;
            
            testResults.push({
              feedbackId: feedback.id,
              status: 'FAILED',
              type: feedback.commentType,
              severity: feedback.severity,
              changeType: changeType,
              reason: 'Verification failed'
            });
          }
        } else {
          console.log('   ❌ FAILED: No merged content returned');
          failureCount++;
          
          testResults.push({
            feedbackId: feedback.id,
            status: 'FAILED',
            type: feedback.commentType,
            severity: feedback.severity,
            changeType: changeType,
            reason: 'No content returned'
          });
        }
      } else {
        const errorBody = await mergeResponse.text();
        console.log('   ❌ ERROR:', mergeResponse.status);
        
        // Parse error if it's JSON
        try {
          const error = JSON.parse(errorBody);
          if (error.details?.changeFrom) {
            console.log('      Text not found:', error.details.changeFrom.substring(0, 50) + '...');
          }
        } catch (e) {
          console.log('      Error:', errorBody);
        }
        
        failureCount++;
        
        testResults.push({
          feedbackId: feedback.id,
          status: 'ERROR',
          type: feedback.commentType,
          severity: feedback.severity,
          changeType: changeType,
          reason: `API error ${mergeResponse.status}`
        });
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Step 3: Save results
    console.log('\n' + '═'.repeat(70));
    console.log('Step 3: Saving results...');
    
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...document.customFields,
          content: currentContent,
          testCompleted: true,
          testResults: testResults,
          lastTest: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ Document saved with merged content');
    
    // Step 4: Summary
    console.log('\n' + '═'.repeat(70));
    console.log('TEST RESULTS SUMMARY');
    console.log('═'.repeat(70));
    
    console.log('\n📊 Overall Statistics:');
    console.log('   Total feedback:', sortedFeedback.length);
    console.log('   Successful:', successCount);
    console.log('   Failed:', failureCount);
    console.log('   Skipped (cascading):', skippedCount);
    console.log('   Success rate:', ((successCount / (successCount + failureCount)) * 100).toFixed(1) + '%');
    
    console.log('\n📈 By Change Type:');
    const sentenceResults = testResults.filter(r => r.changeType === 'SENTENCE');
    const wordResults = testResults.filter(r => r.changeType === 'WORD');
    
    console.log('   Sentences:', sentenceResults.filter(r => r.status === 'SUCCESS').length + '/' + sentenceResults.length);
    console.log('   Words:', wordResults.filter(r => r.status === 'SUCCESS').length + '/' + wordResults.length);
    
    console.log('\n📈 By Severity:');
    const critical = testResults.filter(r => r.severity === 'CRITICAL');
    const major = testResults.filter(r => r.severity === 'MAJOR');
    const minor = testResults.filter(r => r.severity === 'MINOR');
    
    console.log('   Critical:', critical.filter(r => r.status === 'SUCCESS').length + '/' + critical.length);
    console.log('   Major:', major.filter(r => r.status === 'SUCCESS').length + '/' + major.length);
    console.log('   Minor:', minor.filter(r => r.status === 'SUCCESS').length + '/' + minor.length);
    
    // Check specific issues
    console.log('\n🔍 Cascading Change Analysis:');
    const skipped = testResults.filter(r => r.status === 'SKIPPED');
    if (skipped.length > 0) {
      console.log('   Items affected by previous changes:', skipped.length);
      skipped.forEach(s => {
        console.log(`   - ${s.feedbackId}: ${s.reason}`);
      });
    } else {
      console.log('   No cascading conflicts detected');
    }
    
    // Write log
    const logContent = {
      timestamp: new Date().toISOString(),
      documentId: documentId,
      documentTitle: document.title,
      totalFeedback: sortedFeedback.length,
      successful: successCount,
      failed: failureCount,
      skipped: skippedCount,
      successRate: ((successCount / (successCount + failureCount)) * 100).toFixed(1) + '%',
      results: testResults
    };
    
    fs.writeFileSync(
      'comprehensive-test-log.json',
      JSON.stringify(logContent, null, 2)
    );
    
    console.log('\n📝 Test log saved to: comprehensive-test-log.json');
    
    // Final verdict
    console.log('\n' + '═'.repeat(70));
    if (successCount === sortedFeedback.length - skippedCount) {
      console.log('🎉 PERFECT! All applicable feedback merged successfully!');
    } else if (successCount > (sortedFeedback.length - skippedCount) * 0.8) {
      console.log('✅ GOOD - Most feedback merged successfully');
    } else {
      console.log('❌ NEEDS IMPROVEMENT - Many merges failed');
    }
    console.log('═'.repeat(70));
    
    console.log('\n🔗 View document: http://localhost:3000/documents/' + documentId);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting comprehensive merge test...\n');
testComprehensiveMerge();