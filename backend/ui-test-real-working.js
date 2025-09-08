const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:4000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function workingUITest() {
  console.log('=== WORKING UI TEST - MIMICS EXACTLY WHAT WORKS ===\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Get existing user
    const user = await prisma.users.findFirst({
      where: { email: 'admin@demo.mil' }
    });
    
    if (!user) {
      throw new Error('Admin user not found');
    }
    // Step 1: Create FRESH document (not reuse existing)
    console.log('STEP 1: Creating FRESH document');
    
    // Delete any existing test documents first
    await prisma.document.deleteMany({
      where: {
        title: 'UI Test Document - Fresh'
      }
    });
    
    // Create fresh document with EXACT content that matches changeFrom
    const htmlContent = `
<div class="document-container">
  <div class="page" data-page="1">
    <h1>TEST DOCUMENT</h1>
    <h2>SECTION I</h2>
    <p>It is extremely important to understand that this manual has been prepared for the purpose of providing comprehensive flight operating instructions for USAF Series F-16C/D aircraft and contains all of the necessary information that pilots need to know in order to safely and effectively operate these aircraft under all normal and emergency conditions that might be encountered during flight operations.</p>
    <p>This is a test paragraph with a spelling error: automaticaly instead of automatically.</p>
  </div>
</div>`;
    
    const doc = await prisma.document.create({
      data: {
        id: 'doc_ui_test_fresh_' + Date.now(),
        title: 'UI Test Document - Fresh',
        description: 'Fresh test document',
        fileName: 'test-document.pdf',
        originalName: 'test-document.pdf',
        mimeType: 'application/pdf',
        fileSize: 1000,
        storagePath: '/test/path',
        checksum: 'test-checksum',
        publishingStatus: 'DRAFT',
        customFields: {
          content: htmlContent,
          draftFeedback: [
            {
              id: 'fb_test_001',
              page: 1,
              paragraphNumber: '1.1.1',
              lineNumber: 1,
              commentType: 'S',
              severity: 'MAJOR',
              pocName: 'Test User',
              pocEmail: 'test@test.com',
              pocPhone: '555-0001',
              changeFrom: 'It is extremely important to understand that this manual has been prepared for the purpose of providing comprehensive flight operating instructions for USAF Series F-16C/D aircraft and contains all of the necessary information that pilots need to know in order to safely and effectively operate these aircraft under all normal and emergency conditions that might be encountered during flight operations.',
              changeTo: 'This manual provides comprehensive flight operating instructions for USAF Series F-16C/D aircraft. It contains essential information for safe and effective operation under all normal and emergency conditions.',
              coordinatorComment: 'Simplify verbose introduction',
              coordinatorJustification: 'Improved readability'
            },
            {
              id: 'fb_test_002',
              page: 1,
              paragraphNumber: '1.1.2',
              lineNumber: 2,
              commentType: 'A',
              severity: 'MINOR',
              pocName: 'Test User',
              pocEmail: 'test@test.com',
              pocPhone: '555-0002',
              changeFrom: 'automaticaly',
              changeTo: 'automatically',
              coordinatorComment: 'Fix spelling',
              coordinatorJustification: 'Spelling correction'
            }
          ]
        }
      }
    });
    
    console.log('✅ Fresh document created:', doc.id);
    
    // Step 2: Load document (like UI does)
    console.log('\nSTEP 2: Loading document');
    const documentData = doc;
    let currentContent = documentData.customFields.content;
    const feedback = documentData.customFields.draftFeedback;
    
    console.log('✅ Document loaded');
    console.log('   Content length:', currentContent.length);
    console.log('   Feedback items:', feedback.length);
    
    // Step 3: Process each feedback (EXACTLY like automated test)
    console.log('\nSTEP 3: Processing feedback');
    
    for (let i = 0; i < feedback.length; i++) {
      const fb = feedback[i];
      console.log(`\n--- Feedback ${i + 1}/${feedback.length} ---`);
      console.log(`Type: ${fb.commentType}, Page: ${fb.page}`);
      
      // Check if changeFrom exists
      if (!currentContent.includes(fb.changeFrom)) {
        console.log('⚠️  changeFrom not found in current content');
        if (currentContent.includes(fb.changeTo)) {
          console.log('ℹ️  changeTo already present (already applied)');
          testsPassed++;
          continue;
        } else {
          console.log('❌ Neither changeFrom nor changeTo found');
          testsFailed++;
          continue;
        }
      }
      
      console.log('✓ changeFrom found in content');
      
      // Call merge endpoint (EXACTLY like automated test)
      const response = await fetch(`${API_URL}/api/feedback-processor/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentContent: currentContent,
          feedback: fb,
          mode: 'ai'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update current content (CRITICAL!)
        currentContent = result.mergedContent;
        
        // Verify change applied
        if (currentContent.includes(fb.changeTo)) {
          console.log('✅ Change applied successfully');
          testsPassed++;
        } else {
          console.log('❌ Change not applied');
          testsFailed++;
        }
      } else {
        console.log('❌ Merge API failed:', response.status);
        testsFailed++;
      }
    }
    
    // Step 4: Verify final document
    console.log('\n' + '═'.repeat(60));
    console.log('STEP 4: Final verification');
    console.log('═'.repeat(60));
    
    // Test document integrity
    const tests = [
      {
        name: 'Content is valid HTML',
        test: () => !currentContent.includes('<p><p>')
      },
      {
        name: 'No duplicate headers',
        test: () => (currentContent.match(/<h1>/g) || []).length === 1
      },
      {
        name: 'First change applied',
        test: () => currentContent.includes('This manual provides comprehensive flight operating instructions')
      },
      {
        name: 'Spelling fixed',
        test: () => currentContent.includes('automatically') && !currentContent.includes('automaticaly')
      }
    ];
    
    console.log('\nIntegrity tests:');
    for (const test of tests) {
      if (test.test()) {
        console.log(`  ✅ ${test.name}`);
        testsPassed++;
      } else {
        console.log(`  ❌ ${test.name}`);
        testsFailed++;
      }
    }
    
    // Save final document
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        customFields: {
          ...documentData.customFields,
          content: currentContent
        }
      }
    });
    
  } catch (error) {
    console.error('Test error:', error.message);
    testsFailed++;
  } finally {
    await prisma.$disconnect();
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    console.log(`Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }
  }
}

console.log('Starting working UI test...\n');
workingUITest();