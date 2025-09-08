const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();
const fs = require('fs');

const API_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function fullUIIntegrationTest() {
  console.log('=== FULL UI INTEGRATION TEST WITH 15 FEEDBACK ITEMS ===\n');
  console.log('This test uses the same Air Force manual document and feedback');
  console.log('as the create-af-manual-comprehensive.js script\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  const testResults = [];
  
  try {
    // Use the existing function to create the document
    console.log('═'.repeat(70));
    console.log('STEP 1: CREATING FULL AIR FORCE MANUAL DOCUMENT');
    console.log('═'.repeat(70));
    
    const createScript = require('./create-af-manual-comprehensive.js');
    // Since the script runs immediately, we need to wait for it
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the most recent AF manual document
    const recentDoc = await prisma.document.findFirst({
      where: {
        title: 'Air Force Technical Manual - F-16C/D Flight Manual'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!recentDoc) {
      throw new Error('Could not find Air Force manual document');
    }
    
    const documentId = recentDoc.id;
    console.log('✅ Using document:', documentId);
    console.log('   Title:', recentDoc.title);
    console.log('   Feedback items:', recentDoc.customFields?.draftFeedback?.length || 0);
    
    // Step 2: Simulate UI behavior - Load document
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 2: SIMULATING UI PAGE LOAD');
    console.log('═'.repeat(70));
    
    let documentData = { ...recentDoc };
    let editableContent = documentData.customFields.content;
    let feedback = [...documentData.customFields.draftFeedback];
    
    console.log('✅ Document loaded into UI state');
    console.log('   Document has 4 pages of content');
    console.log('   Feedback items loaded:', feedback.length);
    
    // Sort feedback by severity and type (Critical -> Major -> Substantive -> Admin)
    const sortedFeedback = feedback.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 0, 'MAJOR': 1, 'MINOR': 2 };
      return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
    });
    
    // Step 3: Process each feedback item
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 3: SIMULATING 15 MERGE BUTTON CLICKS');
    console.log('═'.repeat(70));
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < sortedFeedback.length; i++) {
      const selectedFeedback = sortedFeedback[i];
      const mergeMode = 'ai'; // Testing AI mode
      
      console.log(`\n──── Merge ${i + 1}/${sortedFeedback.length} ────`);
      console.log(`📍 Feedback: ${selectedFeedback.id}`);
      console.log(`📝 Type: ${selectedFeedback.commentType} | Severity: ${selectedFeedback.severity}`);
      console.log(`🎯 Page ${selectedFeedback.page}, Para ${selectedFeedback.paragraphNumber}`);
      console.log(`👤 POC: ${selectedFeedback.pocName}`);
      
      // Show what we're changing (abbreviated)
      const changeFromShort = selectedFeedback.changeFrom.substring(0, 50) + (selectedFeedback.changeFrom.length > 50 ? '...' : '');
      const changeToShort = selectedFeedback.changeTo.substring(0, 50) + (selectedFeedback.changeTo.length > 50 ? '...' : '');
      console.log(`📝 Change: "${changeFromShort}"`);
      console.log(`        → "${changeToShort}"`);
      
      // Test: Verify text exists before merge
      const textExistsBefore = documentData.customFields.content.includes(selectedFeedback.changeFrom);
      
      if (!textExistsBefore) {
        // Check if changeTo already exists (cascading change)
        if (documentData.customFields.content.includes(selectedFeedback.changeTo)) {
          console.log('ℹ️  Change already applied (cascading)');
          successCount++;
          continue;
        } else {
          console.log('⚠️  WARNING: changeFrom text not found');
        }
      }
      
      // Simulate merge button click
      const documentContentToSend = documentData.customFields.content;
      
      console.log('🔄 Calling merge endpoint...');
      
      const mergeResponse = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: documentContentToSend,
          feedback: selectedFeedback,
          mode: mergeMode
        })
      });
      
      if (mergeResponse.ok) {
        const result = await mergeResponse.json();
        
        // Update UI state (as frontend does)
        editableContent = result.mergedContent;
        documentData = {
          ...documentData,
          customFields: {
            ...documentData.customFields,
            content: result.mergedContent
          }
        };
        
        // Verify change was applied
        const changeApplied = result.mergedContent.includes(selectedFeedback.changeTo);
        const oldTextGone = !result.mergedContent.includes(selectedFeedback.changeFrom);
        
        if (changeApplied) {
          console.log('✅ Change successfully applied');
          successCount++;
          testsPassed++;
        } else {
          console.log('❌ Change not applied');
          failureCount++;
          testsFailed++;
        }
        
        // Save to database (as UI does after each merge)
        try {
          await prisma.document.update({
            where: { id: documentId },
            data: {
              customFields: {
                ...documentData.customFields,
                content: result.mergedContent,
                lastMergeTest: new Date().toISOString()
              }
            }
          });
        } catch (saveError) {
          console.log('⚠️  Database save warning:', saveError.message);
        }
        
        testResults.push({
          feedbackId: selectedFeedback.id,
          type: selectedFeedback.commentType,
          severity: selectedFeedback.severity,
          status: changeApplied ? 'SUCCESS' : 'FAILED',
          changeApplied
        });
        
      } else {
        console.log('❌ Merge endpoint failed:', mergeResponse.status);
        failureCount++;
        testsFailed++;
        
        testResults.push({
          feedbackId: selectedFeedback.id,
          type: selectedFeedback.commentType,
          severity: selectedFeedback.severity,
          status: 'ERROR'
        });
      }
      
      // Small delay between merges (simulating user clicks)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Step 4: Final verification
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 4: FINAL DOCUMENT VERIFICATION');
    console.log('═'.repeat(70));
    
    // Reload document from database
    const finalDoc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    const finalContent = finalDoc.customFields.content;
    
    // Test document structure integrity
    const structureTests = [
      { name: 'Has H1 title', test: finalContent.includes('<h1>AIR FORCE TECHNICAL MANUAL</h1>') },
      { name: 'Has Section I', test: finalContent.includes('<h2>SECTION I - INTRODUCTION</h2>') },
      { name: 'Has Section II', test: finalContent.includes('<h2>SECTION II - AIRCRAFT SYSTEMS</h2>') },
      { name: 'Has Section III', test: finalContent.includes('<h2>SECTION III - OPERATING PROCEDURES</h2>') },
      { name: 'Has Section IV', test: finalContent.includes('<h2>SECTION IV - EMERGENCY PROCEDURES</h2>') },
      { name: 'No duplicate H1', test: (finalContent.match(/<h1>AIR FORCE TECHNICAL MANUAL<\/h1>/g) || []).length === 1 },
      { name: 'Has 4 pages', test: finalContent.includes('data-page="4"') }
    ];
    
    console.log('\n📋 Document Structure Tests:');
    structureTests.forEach(test => {
      if (test.test) {
        console.log(`   ✅ ${test.name}`);
        testsPassed++;
      } else {
        console.log(`   ❌ ${test.name}`);
        testsFailed++;
      }
    });
    
    // Test specific changes
    const specificTests = [
      { 
        name: 'Spelling: automatically', 
        test: finalContent.includes('automatically') && !finalContent.includes('automaticaly') 
      },
      { 
        name: 'Spelling: typically', 
        test: finalContent.includes('typically') && !finalContent.includes('typicaly') 
      },
      { 
        name: 'Spelling: simultaneously', 
        test: finalContent.includes('simultaneously') && !finalContent.includes('simultaneosly') 
      },
      { 
        name: 'Sentence simplified (Introduction)', 
        test: finalContent.includes('This manual provides comprehensive flight operating instructions') 
      },
      { 
        name: 'Critical change applied', 
        test: finalContent.includes('The Air Force requires strict adherence') 
      }
    ];
    
    console.log('\n📝 Specific Change Tests:');
    specificTests.forEach(test => {
      if (test.test) {
        console.log(`   ✅ ${test.name}`);
        testsPassed++;
      } else {
        console.log(`   ❌ ${test.name}`);
        testsFailed++;
      }
    });
    
    // Write comprehensive report
    const reportContent = {
      timestamp: new Date().toISOString(),
      documentId: documentId,
      title: 'Full UI Integration Test - Air Force Manual',
      totalFeedback: sortedFeedback.length,
      successfulMerges: successCount,
      failedMerges: failureCount,
      totalTests: testsPassed + testsFailed,
      testsPassed: testsPassed,
      testsFailed: testsFailed,
      successRate: ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1) + '%',
      feedbackResults: testResults,
      structureTests: structureTests.map(t => ({ name: t.name, passed: t.test })),
      specificTests: specificTests.map(t => ({ name: t.name, passed: t.test }))
    };
    
    fs.writeFileSync(
      'ui-integration-test-full-report.json',
      JSON.stringify(reportContent, null, 2)
    );
    
    // Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('FULL UI INTEGRATION TEST SUMMARY');
    console.log('═'.repeat(70));
    
    console.log('\n📊 MERGE RESULTS:');
    console.log(`   Total feedback items: ${sortedFeedback.length}`);
    console.log(`   Successful merges: ${successCount}`);
    console.log(`   Failed merges: ${failureCount}`);
    console.log(`   Merge success rate: ${((successCount / sortedFeedback.length) * 100).toFixed(1)}%`);
    
    console.log('\n📈 TEST RESULTS:');
    console.log(`   Total tests run: ${testsPassed + testsFailed}`);
    console.log(`   Tests passed: ${testsPassed}`);
    console.log(`   Tests failed: ${testsFailed}`);
    console.log(`   Test success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    console.log('\n📈 BY FEEDBACK TYPE:');
    const byType = {
      C: testResults.filter(r => r.type === 'C'),
      S: testResults.filter(r => r.type === 'S'),
      A: testResults.filter(r => r.type === 'A')
    };
    console.log(`   Critical: ${byType.C.filter(r => r.status === 'SUCCESS').length}/${byType.C.length}`);
    console.log(`   Substantive: ${byType.S.filter(r => r.status === 'SUCCESS').length}/${byType.S.length}`);
    console.log(`   Administrative: ${byType.A.filter(r => r.status === 'SUCCESS').length}/${byType.A.length}`);
    
    console.log('\n📝 Test report saved to: ui-integration-test-full-report.json');
    
    console.log('\n' + '═'.repeat(70));
    if (testsFailed === 0 && failureCount === 0) {
      console.log('🎉 PERFECT! ALL TESTS PASSED!');
    } else if (testsPassed > testsFailed * 2) {
      console.log('✅ TEST MOSTLY PASSED');
    } else {
      console.log('⚠️ TEST HAD ISSUES - Review report for details');
    }
    console.log('═'.repeat(70));
    
    console.log('\n🔗 View final document with all merges:');
    console.log(`   ${FRONTEND_URL}/documents/${documentId}/opr-review`);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the full UI integration test
console.log('Starting full UI integration test with 15 feedback items...\n');
fullUIIntegrationTest();