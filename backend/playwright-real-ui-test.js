const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const EMAIL = 'admin@demo.mil';
const PASSWORD = 'AdminPass123!';

async function realUITestWithPlaywright() {
  console.log('=== REAL PLAYWRIGHT UI TEST - CLICKING ACTUAL BUTTONS ===\n');
  
  let browser;
  let testsPassed = 0;
  let testsFailed = 0;
  const testResults = [];
  
  try {
    // Get the document we created
    const doc = await prisma.document.findFirst({
      where: {
        id: 'doc_af_manual_mfbhn8mv'
      }
    });
    
    if (!doc) {
      throw new Error('Document not found. Run create-af-manual-comprehensive.js first');
    }
    
    console.log('📄 Document found:', doc.id);
    console.log('   Title:', doc.title);
    console.log('   Feedback items:', doc.customFields?.draftFeedback?.length || 0);
    
    // Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await chromium.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 500 // Slow down actions to see what's happening
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text());
      }
    });
    
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Logged in successfully');
    
    // Navigate to OPR Review page
    console.log(`\n📍 Navigating to OPR Review page for document ${doc.id}...`);
    await page.goto(`${FRONTEND_URL}/documents/${doc.id}/opr-review`);
    await page.waitForLoadState('networkidle');
    
    // Wait for feedback items to load
    console.log('⏳ Waiting for feedback items to load...');
    await page.waitForSelector('.feedback-item, [data-testid="feedback-item"], .MuiListItem-root', { 
      timeout: 10000 
    });
    
    // Get all feedback items
    const feedbackItems = await page.$$('.feedback-item, [data-testid="feedback-item"], .MuiListItem-root');
    console.log(`\n📊 Found ${feedbackItems.length} feedback items in UI`);
    
    if (feedbackItems.length === 0) {
      console.log('⚠️  No feedback items found. Trying alternative selectors...');
      
      // Try to find feedback by looking for list items containing feedback text
      const listItems = await page.$$('li');
      console.log(`   Found ${listItems.length} list items`);
      
      // Look for items with feedback-like content
      for (const item of listItems) {
        const text = await item.textContent();
        if (text && (text.includes('fb_af_') || text.includes('Page') || text.includes('Severity'))) {
          console.log(`   Potential feedback item: ${text.substring(0, 50)}...`);
        }
      }
    }
    
    // Process feedback items
    console.log('\n' + '═'.repeat(70));
    console.log('PROCESSING FEEDBACK ITEMS');
    console.log('═'.repeat(70));
    
    let successCount = 0;
    const maxMerges = Math.min(feedbackItems.length, 5); // Test first 5 merges
    
    for (let i = 0; i < maxMerges; i++) {
      console.log(`\n──── Processing Feedback ${i + 1}/${maxMerges} ────`);
      
      try {
        // Click on the feedback item to select it
        await feedbackItems[i].click();
        console.log('✓ Clicked feedback item');
        
        // Wait for feedback details to appear
        await page.waitForTimeout(500);
        
        // Find and set merge mode to AI
        const aiModeButton = await page.$('button:has-text("AI"), [value="ai"], input[value="ai"] + label');
        if (aiModeButton) {
          await aiModeButton.click();
          console.log('✓ Selected AI merge mode');
        } else {
          // Try radio button
          const aiRadio = await page.$('input[type="radio"][value="ai"]');
          if (aiRadio) {
            await aiRadio.click();
            console.log('✓ Selected AI merge mode (radio)');
          }
        }
        
        // Find and click the merge button
        console.log('🔍 Looking for merge button...');
        const mergeButton = await page.$('button:has-text("Merge"), button:has-text("Apply"), button:has-text("MERGE")');
        
        if (mergeButton) {
          console.log('✓ Found merge button, clicking...');
          await mergeButton.click();
          
          // Wait for merge dialog or confirmation
          await page.waitForTimeout(1000);
          
          // Check if there's a confirmation dialog
          const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Apply")');
          if (confirmButton) {
            console.log('✓ Confirming merge...');
            await confirmButton.click();
          }
          
          // Wait for merge to complete
          await page.waitForTimeout(2000);
          
          // Check for success message
          const successMessage = await page.$('text=/success|completed|merged/i');
          if (successMessage) {
            console.log('✅ Merge completed successfully');
            successCount++;
            testsPassed++;
          } else {
            console.log('⚠️  No success message found');
          }
          
          // Close any dialog
          const closeButton = await page.$('button:has-text("Close"), button[aria-label="close"]');
          if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(500);
          }
          
        } else {
          console.log('❌ Merge button not found');
          testsFailed++;
        }
        
      } catch (error) {
        console.log('❌ Error processing feedback:', error.message);
        testsFailed++;
      }
    }
    
    // Verify document structure
    console.log('\n' + '═'.repeat(70));
    console.log('VERIFYING DOCUMENT STRUCTURE');
    console.log('═'.repeat(70));
    
    // Check for duplicate sections
    const documentContent = await page.$('.document-content, [data-testid="document-content"], .MuiBox-root');
    if (documentContent) {
      const content = await documentContent.textContent();
      
      // Check for duplicates
      const h1Count = (content.match(/AIR FORCE TECHNICAL MANUAL/g) || []).length;
      const sectionICount = (content.match(/SECTION I - INTRODUCTION/g) || []).length;
      
      console.log('\n📋 Structure Tests:');
      console.log(`   H1 Title count: ${h1Count} ${h1Count === 1 ? '✅' : '❌ DUPLICATE!'}`);
      console.log(`   Section I count: ${sectionICount} ${sectionICount === 1 ? '✅' : '❌ DUPLICATE!'}`);
      
      if (h1Count === 1) testsPassed++; else testsFailed++;
      if (sectionICount === 1) testsPassed++; else testsFailed++;
      
      // Check for spelling corrections
      const hasAutomatically = content.includes('automatically') && !content.includes('automaticaly');
      const hasTypically = content.includes('typically') && !content.includes('typicaly');
      
      console.log('\n📝 Content Checks:');
      console.log(`   'automatically' fixed: ${hasAutomatically ? '✅' : '❌'}`);
      console.log(`   'typically' fixed: ${hasTypically ? '✅' : '❌'}`);
      
      if (hasAutomatically) testsPassed++; else testsFailed++;
      if (hasTypically) testsPassed++; else testsFailed++;
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'playwright-test-final-state.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: playwright-test-final-state.png');
    
    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`\n📊 Results:`);
    console.log(`   Feedback items processed: ${maxMerges}`);
    console.log(`   Successful merges: ${successCount}`);
    console.log(`   Tests passed: ${testsPassed}`);
    console.log(`   Tests failed: ${testsFailed}`);
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      documentId: doc.id,
      feedbackProcessed: maxMerges,
      successfulMerges: successCount,
      testsPassed,
      testsFailed,
      browserUsed: 'chromium'
    };
    
    fs.writeFileSync('playwright-real-ui-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved: playwright-real-ui-test-report.json');
    
    console.log('\n' + '═'.repeat(70));
    if (testsFailed === 0) {
      console.log('🎉 ALL UI TESTS PASSED!');
    } else {
      console.log('⚠️ SOME UI TESTS FAILED - Check screenshots and report');
    }
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    
    // Take error screenshot if page exists
    if (browser) {
      const pages = browser.contexts()[0]?.pages();
      if (pages && pages.length > 0) {
        await pages[0].screenshot({ 
          path: 'playwright-test-error.png',
          fullPage: true 
        });
        console.log('📸 Error screenshot saved: playwright-test-error.png');
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting Playwright real UI test...\n');
console.log('This test will open a real browser and click actual buttons.\n');
realUITestWithPlaywright();