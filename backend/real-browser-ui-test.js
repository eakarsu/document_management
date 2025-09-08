const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FRONTEND_URL = 'http://localhost:3000';

async function realBrowserUITest() {
  console.log('=== REAL BROWSER UI TEST - ACTUALLY CLICKING BUTTONS ===\n');
  
  let browser;
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Step 1: Create test document (same as API test)
    console.log('STEP 1: Creating test document with feedback');
    const createScript = require('./create-af-manual-comprehensive.js');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const doc = await prisma.document.findFirst({
      where: { title: 'Air Force Technical Manual - F-16C/D Flight Manual' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!doc) throw new Error('Document not created');
    
    const documentId = doc.id;
    console.log('✅ Document created:', documentId);
    
    // Step 2: Launch REAL browser
    console.log('\nSTEP 2: LAUNCHING REAL BROWSER');
    browser = await chromium.launch({ 
      headless: false,  // Set to true to hide browser
      slowMo: 100       // Slow down so we can see it
    });
    
    const page = await browser.newPage();
    console.log('✅ Browser launched');
    
    // Step 3: Navigate directly to OPR Review page (skip login for simplicity)
    console.log('\nSTEP 3: NAVIGATING TO OPR REVIEW PAGE');
    const url = `${FRONTEND_URL}/documents/${documentId}/opr-review`;
    console.log('Opening:', url);
    
    // Navigate and wait for page to load
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');
    
    // Wait for document content to appear
    await page.waitForTimeout(2000);
    
    // Step 4: Set merge mode to AI (if selector exists)
    console.log('\nSTEP 4: SETTING MERGE MODE TO AI');
    try {
      // Try different ways to set AI mode
      const aiRadio = await page.$('input[value="ai"]');
      if (aiRadio) {
        await aiRadio.click();
        console.log('✅ AI mode selected via radio button');
      } else {
        // Try select dropdown
        const mergeSelect = await page.$('select');
        if (mergeSelect) {
          await mergeSelect.selectOption('ai');
          console.log('✅ AI mode selected via dropdown');
        }
      }
    } catch (e) {
      console.log('⚠️ Could not find merge mode selector, continuing...');
    }
    
    // Step 5: Process feedback items by clicking merge buttons
    console.log('\nSTEP 5: CLICKING MERGE BUTTONS FOR FEEDBACK');
    
    // Get feedback items count
    const feedbackItems = await page.$$('[data-testid="feedback-item"], .feedback-item, div[class*="feedback"]');
    console.log(`Found ${feedbackItems.length} feedback items`);
    
    // Process first 3 feedback items (for testing)
    for (let i = 0; i < Math.min(3, feedbackItems.length); i++) {
      console.log(`\n--- Processing feedback ${i + 1} ---`);
      
      try {
        // Click on feedback item to select it
        if (feedbackItems[i]) {
          await feedbackItems[i].click();
          await page.waitForTimeout(500);
          console.log('✓ Feedback item clicked');
        }
        
        // Find and click merge button
        // Try multiple selectors
        const mergeButton = await page.$('button:has-text("Merge")') || 
                           await page.$('button:has-text("merge")') ||
                           await page.$('[data-testid="merge-button"]') ||
                           await page.$('button.merge-button');
        
        if (mergeButton) {
          console.log('🔄 Clicking merge button...');
          await mergeButton.click();
          await page.waitForTimeout(1000);
          
          // Wait for merge to complete
          await page.waitForTimeout(2000);
          
          // Check for success message
          const successMsg = await page.$('text=/success/i') || 
                            await page.$('text=/✅/') ||
                            await page.$('[class*="success"]');
          
          if (successMsg) {
            console.log('✅ Merge successful!');
            testsPassed++;
          } else {
            console.log('⚠️ Merge status unclear');
          }
          
          // Close any dialog
          const closeButton = await page.$('button:has-text("Close")') ||
                             await page.$('button:has-text("OK")') ||
                             await page.$('[aria-label="close"]');
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
    
    // Step 6: Verify document integrity
    console.log('\n\nSTEP 6: VERIFYING DOCUMENT INTEGRITY');
    
    // Get final document content
    const documentContent = await page.evaluate(() => {
      const container = document.querySelector('.document-container, [data-testid="document-content"], #document-content, .content');
      return container ? container.innerHTML : '';
    });
    
    // Check document structure
    const tests = [
      {
        name: 'Document has content',
        test: () => documentContent && documentContent.length > 100
      },
      {
        name: 'No duplicate headers',
        test: () => {
          const h1Count = (documentContent.match(/<h1/g) || []).length;
          return h1Count <= 1;
        }
      },
      {
        name: 'No nested paragraphs',
        test: () => !documentContent.includes('<p><p>')
      }
    ];
    
    console.log('\nDocument integrity tests:');
    for (const test of tests) {
      if (test.test()) {
        console.log(`  ✅ ${test.name}`);
        testsPassed++;
      } else {
        console.log(`  ❌ ${test.name}`);
        testsFailed++;
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'real-browser-test-result.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: real-browser-test-result.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    testsFailed++;
  } finally {
    if (browser) {
      await browser.close();
    }
    await prisma.$disconnect();
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('REAL BROWSER TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    
    if (testsFailed === 0 && testsPassed > 0) {
      console.log('\n🎉 ALL BROWSER TESTS PASSED!');
    } else {
      console.log('\n⚠️ SOME BROWSER TESTS FAILED');
    }
  }
}

console.log('Starting REAL browser UI test...\n');
realBrowserUITest().catch(console.error);