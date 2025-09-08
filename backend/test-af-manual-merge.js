const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();
const fs = require('fs');

const API_URL = 'http://localhost:4000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function testAFManualMerge() {
  console.log('=== AIR FORCE MANUAL OPR REVIEW TEST ===\n');
  
  const documentId = 'doc_af_manual_mfbblrr1';
  
  try {
    // Step 1: Get the document
    console.log('Step 1: Loading Air Force Technical Manual...');
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    console.log('✅ Document loaded:', document.title);
    
    // Step 2: Create feedback for the typos
    console.log('\nStep 2: Creating feedback for spelling corrections...\n');
    
    const feedbackItems = [
      // Page 1 feedback
      {
        id: 'fb_af_001',
        page: 1,
        paragraphNumber: 1,
        lineNumber: 3,
        changeFrom: 'MAINTENENCE',
        changeTo: 'MAINTENANCE',
        coordinatorComment: 'Fix spelling of maintenance in header',
        pocName: 'Lt Col Smith',
        pocEmail: 'smith@af.mil',
        pocPhone: '555-0101',
        component: 'Header',
        commentType: 'S',
        severity: 'MAJOR'
      },
      {
        id: 'fb_af_002',
        page: 1,
        paragraphNumber: 2,
        lineNumber: 1,
        changeFrom: 'comprehesive maintenance instructions and operational guidelines for F-16C Fighting Falcon aircraft maintainance',
        changeTo: 'comprehensive maintenance instructions and operational guidelines for F-16C Fighting Falcon aircraft maintenance',
        coordinatorComment: 'Multiple spelling errors in purpose statement',
        pocName: 'Maj Johnson',
        pocEmail: 'johnson@af.mil',
        pocPhone: '555-0102',
        component: 'Section 1.1',
        commentType: 'S',
        severity: 'MAJOR'
      },
      {
        id: 'fb_af_003',
        page: 1,
        paragraphNumber: 2,
        lineNumber: 2,
        changeFrom: 'All personel must comply',
        changeTo: 'All personnel must comply',
        coordinatorComment: 'Fix spelling of personnel',
        pocName: 'Capt Davis',
        pocEmail: 'davis@af.mil',
        pocPhone: '555-0103',
        component: 'Section 1.1',
        commentType: 'A',
        severity: 'MINOR'
      },
      {
        id: 'fb_af_004',
        page: 1,
        paragraphNumber: 3,
        lineNumber: 1,
        changeFrom: 'Safety requirments outlined',
        changeTo: 'Safety requirements outlined',
        coordinatorComment: 'Fix spelling of requirements',
        pocName: 'MSgt Brown',
        pocEmail: 'brown@af.mil',
        pocPhone: '555-0104',
        component: 'Section 1.2',
        commentType: 'A',
        severity: 'MINOR'
      },
      {
        id: 'fb_af_005',
        page: 1,
        paragraphNumber: 3,
        lineNumber: 2,
        changeFrom: 'Technicans shall complete required training before performing maintenence',
        changeTo: 'Technicians shall complete required training before performing maintenance',
        coordinatorComment: 'Fix spelling of technicians and maintenance',
        pocName: 'TSgt Wilson',
        pocEmail: 'wilson@af.mil',
        pocPhone: '555-0105',
        component: 'Section 1.2',
        commentType: 'S',
        severity: 'MAJOR'
      },
      // Page 2 feedback
      {
        id: 'fb_af_006',
        page: 2,
        paragraphNumber: 1,
        lineNumber: 1,
        changeFrom: 'Engine inspections are determind by flight hours',
        changeTo: 'Engine inspections are determined by flight hours',
        coordinatorComment: 'Fix spelling of determined',
        pocName: 'SSgt Garcia',
        pocEmail: 'garcia@af.mil',
        pocPhone: '555-0106',
        component: 'Section 3.1',
        commentType: 'A',
        severity: 'MINOR'
      },
      {
        id: 'fb_af_007',
        page: 2,
        paragraphNumber: 1,
        lineNumber: 2,
        changeFrom: 'assess internal componets',
        changeTo: 'assess internal components',
        coordinatorComment: 'Fix spelling of components',
        pocName: 'A1C Martinez',
        pocEmail: 'martinez@af.mil',
        pocPhone: '555-0107',
        component: 'Section 3.1',
        commentType: 'A',
        severity: 'MINOR'
      },
      {
        id: 'fb_af_008',
        page: 2,
        paragraphNumber: 2,
        lineNumber: 2,
        changeFrom: 'fire suppression is availible',
        changeTo: 'fire suppression is available',
        coordinatorComment: 'Fix spelling of available',
        pocName: 'SrA Anderson',
        pocEmail: 'anderson@af.mil',
        pocPhone: '555-0108',
        component: 'Section 3.2',
        commentType: 'A',
        severity: 'MINOR'
      },
      {
        id: 'fb_af_009',
        page: 2,
        paragraphNumber: 2,
        lineNumber: 3,
        changeFrom: 'exhaust temprature',
        changeTo: 'exhaust temperature',
        coordinatorComment: 'Fix spelling of temperature',
        pocName: 'Amn Taylor',
        pocEmail: 'taylor@af.mil',
        pocPhone: '555-0109',
        component: 'Section 3.2',
        commentType: 'A',
        severity: 'MINOR'
      },
      // Page 3 feedback
      {
        id: 'fb_af_010',
        page: 3,
        paragraphNumber: 1,
        lineNumber: 3,
        changeFrom: 'Test battery capacity monthly for emergancy power',
        changeTo: 'Test battery capacity monthly for emergency power',
        coordinatorComment: 'Fix spelling of emergency',
        pocName: 'Lt Thompson',
        pocEmail: 'thompson@af.mil',
        pocPhone: '555-0110',
        component: 'Section 6.1',
        commentType: 'A',
        severity: 'MINOR'
      },
      {
        id: 'fb_af_011',
        page: 3,
        paragraphNumber: 2,
        lineNumber: 1,
        changeFrom: 'Investigate tripped breakers before reseting',
        changeTo: 'Investigate tripped breakers before resetting',
        coordinatorComment: 'Fix spelling of resetting',
        pocName: 'CWO White',
        pocEmail: 'white@af.mil',
        pocPhone: '555-0111',
        component: 'Section 6.2',
        commentType: 'A',
        severity: 'MINOR'
      },
      {
        id: 'fb_af_012',
        page: 3,
        paragraphNumber: 5,
        lineNumber: 2,
        changeFrom: 'Accurate records ensure regulatory complience',
        changeTo: 'Accurate records ensure regulatory compliance',
        coordinatorComment: 'Fix spelling of compliance',
        pocName: 'Col Harris',
        pocEmail: 'harris@af.mil',
        pocPhone: '555-0112',
        component: 'Section 8.1',
        commentType: 'C',
        severity: 'CRITICAL'
      }
    ];
    
    // Add feedback to document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...document.customFields,
          draftFeedback: feedbackItems
        }
      }
    });
    
    console.log('✅ Created', feedbackItems.length, 'feedback items');
    
    // Step 3: Process each feedback with AI merge
    console.log('\nStep 3: Processing feedback with AI merge mode...\n');
    
    let currentContent = document.customFields?.content || '';
    const testResults = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < feedbackItems.length; i++) {
      const feedback = feedbackItems[i];
      console.log(`Processing ${i + 1}/${feedbackItems.length}: ${feedback.changeFrom.substring(0, 30)}...`);
      
      // Call merge endpoint with AI mode
      const mergeResponse = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: currentContent,
          feedback: feedback,
          mode: 'ai' // Always use AI mode
        })
      });
      
      if (mergeResponse.ok) {
        const result = await mergeResponse.json();
        
        if (result.success && result.mergedContent) {
          // Verify the change was applied
          const oldTextGone = !result.mergedContent.includes(feedback.changeFrom);
          const newTextPresent = result.mergedContent.includes(feedback.changeTo);
          
          if (oldTextGone && newTextPresent) {
            console.log(`  ✅ ${feedback.commentType} - ${feedback.severity}: Success`);
            currentContent = result.mergedContent;
            successCount++;
            
            testResults.push({
              feedbackId: feedback.id,
              status: 'SUCCESS',
              type: feedback.commentType,
              severity: feedback.severity
            });
          } else {
            console.log(`  ❌ ${feedback.commentType} - ${feedback.severity}: Verification failed`);
            failureCount++;
            
            testResults.push({
              feedbackId: feedback.id,
              status: 'FAILED',
              type: feedback.commentType,
              severity: feedback.severity,
              reason: 'Text not properly replaced'
            });
          }
        } else {
          console.log(`  ❌ ${feedback.commentType} - ${feedback.severity}: No content returned`);
          failureCount++;
          
          testResults.push({
            feedbackId: feedback.id,
            status: 'FAILED',
            type: feedback.commentType,
            severity: feedback.severity,
            reason: 'No merged content'
          });
        }
      } else {
        console.log(`  ❌ ${feedback.commentType} - ${feedback.severity}: API error ${mergeResponse.status}`);
        failureCount++;
        
        testResults.push({
          feedbackId: feedback.id,
          status: 'ERROR',
          type: feedback.commentType,
          severity: feedback.severity,
          reason: `API error ${mergeResponse.status}`
        });
      }
      
      // Small delay between merges
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Step 4: Save merged document
    console.log('\nStep 4: Saving merged document...');
    
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...document.customFields,
          content: currentContent,
          mergeTestCompleted: true,
          mergeTestResults: testResults,
          lastMergeTest: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ Document saved with merged content');
    
    // Step 5: Results summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log('\n📊 Overall Statistics:');
    console.log('   Total feedback:', feedbackItems.length);
    console.log('   Successful merges:', successCount);
    console.log('   Failed merges:', failureCount);
    console.log('   Success rate:', ((successCount / feedbackItems.length) * 100).toFixed(1) + '%');
    
    console.log('\n📈 By Comment Type:');
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
    
    // Write test log
    const logContent = {
      timestamp: new Date().toISOString(),
      documentId: documentId,
      documentTitle: document.title,
      totalFeedback: feedbackItems.length,
      successfulMerges: successCount,
      failedMerges: failureCount,
      successRate: ((successCount / feedbackItems.length) * 100).toFixed(1) + '%',
      results: testResults
    };
    
    fs.writeFileSync(
      'af-manual-test-log.json',
      JSON.stringify(logContent, null, 2)
    );
    
    console.log('\n📝 Test log saved to: af-manual-test-log.json');
    
    // Final status
    console.log('\n' + '='.repeat(60));
    if (successCount === feedbackItems.length) {
      console.log('🎉 TEST PASSED - ALL FEEDBACK MERGED SUCCESSFULLY!');
    } else if (successCount > feedbackItems.length * 0.8) {
      console.log('✅ TEST MOSTLY PASSED - ' + ((successCount / feedbackItems.length) * 100).toFixed(1) + '% success rate');
    } else {
      console.log('❌ TEST FAILED - Too many merge failures');
    }
    console.log('='.repeat(60));
    
    console.log('\n🔗 View updated document:');
    console.log('   http://localhost:3000/documents/' + documentId + '/opr-review');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting Air Force Manual OPR Review Test...\n');
testAFManualMerge();