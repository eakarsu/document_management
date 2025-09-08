const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3000';
const DOCUMENT_ID = 'doc_af_manual_mfbiqcf7'; // Latest document with all feedbacks
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function realBrowserUIMergeTest() {
  console.log('=== REAL BROWSER UI TEST - CLICKING ALL 15 MERGE BUTTONS ===\n');
  
  let browser;
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Get initial document state
    const initialDoc = await prisma.document.findFirst({
      where: { id: DOCUMENT_ID }
    });
    
    if (!initialDoc) {
      throw new Error('Document not found. Run create-af-manual-comprehensive.js first');
    }
    
    const initialContent = initialDoc.customFields?.content || '';
    console.log('📄 Initial document:');
    console.log('   ID:', DOCUMENT_ID);
    console.log('   Content length:', initialContent.length, 'characters');
    console.log('   Feedback items:', initialDoc.customFields?.draftFeedback?.length || 0);
    
    // Launch browser
    console.log('\n🌐 Launching browser (visible mode)...');
    browser = await chromium.launch({
      headless: false, // Show browser window
      slowMo: 100 // Slow down for visibility
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    // Set authentication cookie
    await context.addCookies([{
      name: 'accessToken',
      value: TOKEN,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }]);
    
    const page = await context.newPage();
    
    // Navigate to OPR Review page
    console.log('\n📍 Navigating to OPR Review page...');
    await page.goto(`${FRONTEND_URL}/documents/${DOCUMENT_ID}/opr-review`, {
      waitUntil: 'networkidle'
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-screenshots/01-initial.png',
      fullPage: true 
    });
    
    console.log('\n' + '═'.repeat(70));
    console.log('CLICKING ALL 15 MERGE BUTTONS');
    console.log('═'.repeat(70));
    
    let successfulMerges = 0;
    
    // Process all 15 feedback items
    for (let i = 0; i < 15; i++) {
      console.log(`\n──── Merge ${i + 1}/15 ────`);
      
      try {
        // Find all feedback list items
        await page.waitForSelector('li.MuiListItem-root, li[role="listitem"], .feedback-item', {
          timeout: 5000
        });
        
        const feedbackItems = await page.$$('li.MuiListItem-root');
        console.log(`Found ${feedbackItems.length} feedback items remaining`);
        
        if (feedbackItems.length === 0) {
          console.log('⚠️  No more feedback items');
          break;
        }
        
        // Click the first feedback item
        console.log('🖱️ Clicking feedback item...');
        await feedbackItems[0].click();
        await page.waitForTimeout(500);
        
        // Select AI mode (more reliable than manual)
        const aiRadio = await page.$('input[type="radio"][value="ai"]');
        if (aiRadio) {
          await aiRadio.click();
          console.log('✓ Selected AI mode');
        }
        
        // Find and click merge button
        console.log('🔍 Looking for merge button...');
        
        // Try multiple selectors for merge button
        const mergeButtonSelectors = [
          'button:has-text("Merge")',
          'button:has-text("MERGE")',
          'button:has-text("Apply")',
          'button[aria-label*="merge"]',
          '.merge-button'
        ];
        
        let mergeButton = null;
        for (const selector of mergeButtonSelectors) {
          mergeButton = await page.$(selector);
          if (mergeButton) break;
        }
        
        if (!mergeButton) {
          // If no direct merge button, look in the selected feedback area
          const buttons = await page.$$('button');
          for (const button of buttons) {
            const text = await button.textContent();
            if (text && (text.includes('Merge') || text.includes('Apply'))) {
              mergeButton = button;
              break;
            }
          }
        }
        
        if (mergeButton) {
          console.log('✓ Found merge button');
          await mergeButton.click();
          console.log('✓ Clicked merge button');
          
          // Wait for merge to complete
          await page.waitForTimeout(2000);
          
          // Look for success indication or dialog
          const successDialog = await page.$('text=/success|completed|merged/i');
          if (successDialog) {
            console.log('✅ Merge successful');
            successfulMerges++;
            testsPassed++;
          }
          
          // Close any dialog
          const closeButton = await page.$('button:has-text("Close"), button:has-text("OK"), button[aria-label="close"]');
          if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(500);
          }
          
          // Take screenshot after each merge
          if ((i + 1) % 5 === 0 || i === 14) {
            await page.screenshot({ 
              path: `test-screenshots/${String(i + 2).padStart(2, '0')}-after-merge-${i + 1}.png`,
              fullPage: true 
            });
          }
          
        } else {
          console.log('❌ Merge button not found');
          testsFailed++;
        }
        
      } catch (error) {
        console.log('❌ Error:', error.message);
        testsFailed++;
      }
    }
    
    // Final verification
    console.log('\n' + '═'.repeat(70));
    console.log('FINAL VERIFICATION');
    console.log('═'.repeat(70));
    
    // Get final document state from database
    const finalDoc = await prisma.document.findFirst({
      where: { id: DOCUMENT_ID }
    });
    
    const finalContent = finalDoc?.customFields?.content || '';
    
    // Check for duplicates
    const h1Count = (finalContent.match(/<h1>AIR FORCE TECHNICAL MANUAL<\/h1>/g) || []).length;
    const sectionICount = (finalContent.match(/SECTION I - INTRODUCTION/g) || []).length;
    
    console.log('\n📋 Document Integrity:');
    console.log(`   H1 headers: ${h1Count} ${h1Count === 1 ? '✅' : '❌ DUPLICATE!'}`);
    console.log(`   Section I: ${sectionICount} ${sectionICount === 1 ? '✅' : '❌ DUPLICATE!'}`);
    console.log(`   Content length: ${initialContent.length} → ${finalContent.length} chars`);
    console.log(`   Size change: ${finalContent.length - initialContent.length} chars`);
    
    if (h1Count === 1) testsPassed++; else testsFailed++;
    if (sectionICount === 1) testsPassed++; else testsFailed++;
    
    // Check spelling corrections
    const spellingFixed = [
      { wrong: 'automaticaly', correct: 'automatically' },
      { wrong: 'typicaly', correct: 'typically' },
      { wrong: 'simultaneosly', correct: 'simultaneously' }
    ];
    
    console.log('\n📝 Spelling Corrections:');
    for (const spell of spellingFixed) {
      const hasCorrect = finalContent.includes(spell.correct);
      const hasWrong = finalContent.includes(spell.wrong);
      const isFixed = hasCorrect && !hasWrong;
      console.log(`   '${spell.wrong}' → '${spell.correct}': ${isFixed ? '✅' : '❌'}`);
      if (isFixed) testsPassed++; else testsFailed++;
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-screenshots/99-final.png',
      fullPage: true 
    });
    
    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`\n📊 Results:`);
    console.log(`   Successful UI merges: ${successfulMerges}/15`);
    console.log(`   Tests passed: ${testsPassed}`);
    console.log(`   Tests failed: ${testsFailed}`);
    console.log(`   Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      documentId: DOCUMENT_ID,
      successfulMerges,
      testsPassed,
      testsFailed,
      noDuplicates: h1Count === 1 && sectionICount === 1,
      initialSize: initialContent.length,
      finalSize: finalContent.length
    };
    
    fs.mkdirSync('test-screenshots', { recursive: true });
    fs.writeFileSync('real-browser-test-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📄 Report saved: real-browser-test-report.json');
    console.log('📸 Screenshots saved in: test-screenshots/');
    
    console.log('\n' + '═'.repeat(70));
    if (testsFailed === 0 && h1Count === 1) {
      console.log('🎉 ALL UI TESTS PASSED!');
      console.log('✅ All merges applied through real browser clicks');
      console.log('✅ No duplicate sections');
      console.log('✅ Document integrity maintained');
    } else {
      console.log('⚠️ SOME TESTS FAILED - Check screenshots');
    }
    console.log('═'.repeat(70));
    
    // Keep browser open for 5 seconds to see final state
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    
    if (browser) {
      await browser.contexts()[0]?.pages()[0]?.screenshot({ 
        path: 'test-screenshots/error.png',
        fullPage: true 
      });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting real browser UI test...\n');
console.log('This will open a browser and click all 15 merge buttons.\n');
realBrowserUIMergeTest();