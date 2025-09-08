const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();
const fs = require('fs');

const API_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

// Puppeteer would be ideal for real UI testing, but we'll simulate the UI behavior
// This test mimics exactly what the UI does when clicking merge buttons

async function uiIntegrationTest() {
  console.log('=== COMPREHENSIVE UI INTEGRATION TEST FOR OPR REVIEW ===\n');
  console.log('This test simulates the exact behavior of the OPR Review page UI:');
  console.log('1. Load document with feedback (like opening the page)');
  console.log('2. Select feedback and click merge (simulating UI interactions)');
  console.log('3. Update document content after each merge (like UI does)');
  console.log('4. Save to database after each merge');
  console.log('5. Verify document structure remains intact\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  const testResults = [];
  
  try {
    // Step 1: Create a fresh test document with feedback
    console.log('═'.repeat(70));
    console.log('STEP 1: CREATING TEST DOCUMENT');
    console.log('═'.repeat(70));
    
    const documentId = 'doc_ui_test_' + Date.now().toString(36);
    
    // Create document with same structure as Air Force manual
    const initialContent = `
<div class="document-container">
  <div class="page" data-page="1">
    <div class="header-info">
      <p>TO 1F-16C-1</p>
      <p>USAF SERIES</p>
      <p>F-16C/D BLOCKS 25, 30, 32</p>
    </div>
    
    <h1>AIR FORCE TECHNICAL MANUAL</h1>
    <p class="subtitle">FLIGHT MANUAL</p>
    
    <h2>SECTION I - INTRODUCTION</h2>
    
    <h3>PURPOSE AND SCOPE</h3>
    <p>It is extremely important to understand that this manual has been prepared for the purpose of providing comprehensive flight operating instructions for USAF Series F-16C/D aircraft and contains all of the necessary information that pilots need to know in order to safely and effectively operate these aircraft under all normal and emergency conditions that might be encountered during flight operations.</p>
    
    <p>Due to the fact that the F-16 is a highly sophisticated fly-by-wire aircraft with advanced avionics systems, it is absolutely essential that all personnel who are involved in the operation, maintenance, or support of these aircraft must thoroughly familiarize themselves with the contents of this manual and must ensure that they have a complete understanding of all procedures before attempting to perform any operations.</p>
    
    <h3>SAFETY CONSIDERATIONS</h3>
    <p>The system automaticaly compensates for various flight conditions and provides enhanced stability and control.</p>
  </div>
</div>`;

    const feedbackItems = [
      {
        id: 'ui_test_001',
        page: 1,
        paragraphNumber: '1.1.1.1',
        lineNumber: 1,
        changeFrom: 'It is extremely important to understand that this manual has been prepared for the purpose of providing comprehensive flight operating instructions for USAF Series F-16C/D aircraft and contains all of the necessary information that pilots need to know in order to safely and effectively operate these aircraft under all normal and emergency conditions that might be encountered during flight operations.',
        changeTo: 'This manual provides comprehensive flight operating instructions for USAF Series F-16C/D aircraft. It contains essential information for safe and effective operation under all normal and emergency conditions.',
        coordinatorComment: 'Simplify verbose introduction',
        coordinatorJustification: 'Improve clarity and reduce wordiness',
        pocName: 'Test User 1',
        pocEmail: 'test1@af.mil',
        pocPhone: '555-0001',
        component: 'Introduction',
        commentType: 'S',
        severity: 'MAJOR'
      },
      {
        id: 'ui_test_002',
        page: 1,
        paragraphNumber: '1.1.1.2',
        lineNumber: 1,
        changeFrom: 'Due to the fact that the F-16 is a highly sophisticated fly-by-wire aircraft with advanced avionics systems, it is absolutely essential that all personnel who are involved in the operation, maintenance, or support of these aircraft must thoroughly familiarize themselves with the contents of this manual and must ensure that they have a complete understanding of all procedures before attempting to perform any operations.',
        changeTo: 'The F-16 is a sophisticated fly-by-wire aircraft with advanced avionics. All personnel involved in operations, maintenance, or support must thoroughly understand this manual before performing any procedures.',
        coordinatorComment: 'Reduce redundancy and improve readability',
        coordinatorJustification: 'Make instructions more direct',
        pocName: 'Test User 2',
        pocEmail: 'test2@af.mil',
        pocPhone: '555-0002',
        component: 'Introduction',
        commentType: 'S',
        severity: 'MAJOR'
      },
      {
        id: 'ui_test_003',
        page: 1,
        paragraphNumber: '1.1.2.1',
        lineNumber: 1,
        changeFrom: 'automaticaly',
        changeTo: 'automatically',
        coordinatorComment: 'Fix spelling',
        coordinatorJustification: 'Correct spelling error',
        pocName: 'Test User 3',
        pocEmail: 'test3@af.mil',
        pocPhone: '555-0003',
        component: 'Safety',
        commentType: 'A',
        severity: 'MINOR'
      }
    ];

    const newDoc = await prisma.document.create({
      data: {
        id: documentId,
        title: 'UI Integration Test Document',
        fileName: 'ui_test.pdf',
        originalName: 'ui_test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        checksum: 'ui-test-' + Date.now(),
        storagePath: '/documents/' + documentId,
        createdBy: { connect: { id: 'cmeys45qj000ojp4izc4fumqb' } },
        organization: { connect: { id: 'cmeys45f10000jp4iccb6f59u' } },
        customFields: {
          content: initialContent,
          draftFeedback: feedbackItems,
          documentType: 'Test Document'
        }
      }
    });

    console.log('✅ Test document created:', documentId);
    console.log('   Feedback items:', feedbackItems.length);
    
    // Step 2: Simulate UI behavior - Load document (like componentDidMount)
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 2: SIMULATING UI PAGE LOAD');
    console.log('═'.repeat(70));
    
    // This simulates what happens when the OPR Review page loads
    let documentData = { ...newDoc };
    let editableContent = documentData.customFields.content;
    let feedback = [...documentData.customFields.draftFeedback];
    
    console.log('✅ Document loaded into UI state');
    console.log('   editableContent length:', editableContent.length);
    console.log('   feedback items loaded:', feedback.length);
    
    // Step 3: Simulate clicking merge for each feedback item
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 3: SIMULATING UI MERGE CLICKS');
    console.log('═'.repeat(70));
    
    for (let i = 0; i < feedback.length; i++) {
      const selectedFeedback = feedback[i];
      const mergeMode = 'ai'; // Testing AI mode as it was problematic
      
      console.log(`\n──── Simulating Merge Click ${i + 1}/${feedback.length} ────`);
      console.log(`📍 Feedback: ${selectedFeedback.id}`);
      console.log(`📝 Type: ${selectedFeedback.commentType} | Mode: ${mergeMode}`);
      console.log(`🎯 Location: Para ${selectedFeedback.paragraphNumber}, Line ${selectedFeedback.lineNumber}`);
      
      // Test 1: Verify changeFrom text exists before merge
      const textExistsBefore = documentData.customFields.content.includes(selectedFeedback.changeFrom);
      if (textExistsBefore) {
        console.log('✅ TEST PASSED: changeFrom text found in document');
        testsPassed++;
      } else {
        console.log('❌ TEST FAILED: changeFrom text not found in document');
        console.log('   Looking for:', selectedFeedback.changeFrom.substring(0, 50) + '...');
        testsFailed++;
      }
      
      // Simulate what the UI does when merge button is clicked
      // This matches the updated frontend code exactly
      const documentContentToSend = documentData.customFields.content; // Always use original content
      
      console.log('🔄 Calling merge endpoint (simulating UI behavior)...');
      
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
        
        // Simulate UI state updates (exactly as frontend does)
        editableContent = result.mergedContent;
        documentData = {
          ...documentData,
          customFields: {
            ...documentData.customFields,
            content: result.mergedContent // Critical for next merge
          }
        };
        
        // Test 2: Verify changeTo text is present after merge
        const changeToPresent = result.mergedContent.includes(selectedFeedback.changeTo);
        if (changeToPresent) {
          console.log('✅ TEST PASSED: changeTo text present after merge');
          testsPassed++;
        } else {
          console.log('❌ TEST FAILED: changeTo text not found after merge');
          testsFailed++;
        }
        
        // Test 3: Verify document structure is intact
        const hasH1 = result.mergedContent.includes('<h1>AIR FORCE TECHNICAL MANUAL</h1>');
        const hasH2 = result.mergedContent.includes('<h2>SECTION I - INTRODUCTION</h2>');
        const hasH3 = result.mergedContent.includes('<h3>PURPOSE AND SCOPE</h3>');
        const noDuplicateH1 = (result.mergedContent.match(/<h1>AIR FORCE TECHNICAL MANUAL<\/h1>/g) || []).length === 1;
        
        if (hasH1 && hasH2 && hasH3 && noDuplicateH1) {
          console.log('✅ TEST PASSED: Document structure intact');
          testsPassed++;
        } else {
          console.log('❌ TEST FAILED: Document structure corrupted');
          console.log('   Has H1:', hasH1);
          console.log('   Has H2:', hasH2);
          console.log('   Has H3:', hasH3);
          console.log('   No duplicate H1:', noDuplicateH1);
          testsFailed++;
        }
        
        // Simulate saving to database (as UI does)
        const saveResponse = await fetch(`${API_URL}/api/documents/${documentId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customFields: {
              ...documentData.customFields,
              content: result.mergedContent,
              draftFeedback: feedback
            }
          })
        });
        
        if (saveResponse.ok) {
          console.log('✅ Document saved to database (simulating UI save)');
        } else {
          console.log('⚠️ Warning: Database save failed');
        }
        
        // Update feedback status (as UI does)
        feedback = feedback.map(f => 
          f.id === selectedFeedback.id 
            ? { ...f, status: 'merged' }
            : f
        );
        
        testResults.push({
          feedbackId: selectedFeedback.id,
          status: 'SUCCESS',
          testsRun: 3,
          testsPassed: changeToPresent && hasH1 && hasH2 && hasH3 && noDuplicateH1 ? 3 : 2
        });
        
      } else {
        console.log('❌ Merge endpoint failed:', mergeResponse.status);
        testsFailed++;
        testResults.push({
          feedbackId: selectedFeedback.id,
          status: 'FAILED',
          error: `HTTP ${mergeResponse.status}`
        });
      }
    }
    
    // Step 4: Final verification
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 4: FINAL VERIFICATION');
    console.log('═'.repeat(70));
    
    // Load document from database to verify final state
    const finalDoc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    const finalContent = finalDoc.customFields.content;
    
    // Test: All changeTo texts should be present
    let allChangesApplied = true;
    for (const fb of feedbackItems) {
      if (!finalContent.includes(fb.changeTo)) {
        console.log(`❌ Missing changeTo text for ${fb.id}`);
        allChangesApplied = false;
        testsFailed++;
      }
    }
    
    if (allChangesApplied) {
      console.log('✅ TEST PASSED: All feedback changes applied successfully');
      testsPassed++;
    }
    
    // Test: No changeFrom texts should remain
    let noOldText = true;
    for (const fb of feedbackItems) {
      if (finalContent.includes(fb.changeFrom)) {
        console.log(`❌ Old text still present for ${fb.id}`);
        noOldText = false;
        testsFailed++;
      }
    }
    
    if (noOldText) {
      console.log('✅ TEST PASSED: All old text successfully replaced');
      testsPassed++;
    }
    
    // Test: Document structure integrity
    const structureValid = 
      finalContent.includes('<h1>AIR FORCE TECHNICAL MANUAL</h1>') &&
      finalContent.includes('<h2>SECTION I - INTRODUCTION</h2>') &&
      finalContent.includes('<h3>PURPOSE AND SCOPE</h3>') &&
      (finalContent.match(/<h1>AIR FORCE TECHNICAL MANUAL<\/h1>/g) || []).length === 1 &&
      (finalContent.match(/<h2>SECTION I - INTRODUCTION<\/h2>/g) || []).length === 1;
    
    if (structureValid) {
      console.log('✅ TEST PASSED: Final document structure is valid');
      testsPassed++;
    } else {
      console.log('❌ TEST FAILED: Final document structure is corrupted');
      testsFailed++;
    }
    
    // Write test report
    const reportContent = {
      timestamp: new Date().toISOString(),
      documentId: documentId,
      totalTests: testsPassed + testsFailed,
      passed: testsPassed,
      failed: testsFailed,
      successRate: ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1) + '%',
      feedbackProcessed: feedbackItems.length,
      results: testResults,
      finalValidation: {
        allChangesApplied,
        noOldText,
        structureValid
      }
    };
    
    fs.writeFileSync(
      'ui-integration-test-report.json',
      JSON.stringify(reportContent, null, 2)
    );
    
    // Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('UI INTEGRATION TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log('\n📊 TEST RESULTS:');
    console.log(`   Total tests run: ${testsPassed + testsFailed}`);
    console.log(`   Tests passed: ${testsPassed}`);
    console.log(`   Tests failed: ${testsFailed}`);
    console.log(`   Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    console.log('\n📈 COVERAGE:');
    console.log('   ✓ Document loading simulation');
    console.log('   ✓ Feedback selection simulation');
    console.log('   ✓ Merge button click simulation');
    console.log('   ✓ State update verification');
    console.log('   ✓ Database save verification');
    console.log('   ✓ Document structure integrity');
    console.log('   ✓ Content replacement accuracy');
    
    console.log('\n📝 Test report saved to: ui-integration-test-report.json');
    
    console.log('\n' + '═'.repeat(70));
    if (testsFailed === 0) {
      console.log('🎉 ALL UI INTEGRATION TESTS PASSED!');
    } else {
      console.log(`⚠️ ${testsFailed} TESTS FAILED - Review report for details`);
    }
    console.log('═'.repeat(70));
    
    console.log('\n🔗 View test document:');
    console.log(`   ${FRONTEND_URL}/documents/${documentId}/opr-review`);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the UI integration test
console.log('Starting comprehensive UI integration test...\n');
uiIntegrationTest();