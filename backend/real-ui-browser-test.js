const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FRONTEND_URL = 'http://localhost:3000';
const LOGIN_EMAIL = 'admin@demo.mil';
const LOGIN_PASSWORD = 'test123';

async function realUIBrowserTest() {
  console.log('=== REAL BROWSER UI INTEGRATION TEST ===\n');
  console.log('This test actually opens a browser and clicks buttons!\n');
  
  let browser;
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Create the Air Force manual document first
    console.log('STEP 1: Creating test document with feedback...\n');
    const createScript = require('./create-af-manual-comprehensive.js');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the document ID
    const doc = await prisma.document.findFirst({
      where: { title: 'Air Force Technical Manual - F-16C/D Flight Manual' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!doc) {
      throw new Error('Test document not created');
    }
    
    const documentId = doc.id;
    console.log('✅ Document created:', documentId);
    console.log('   Feedback items:', doc.customFields?.draftFeedback?.length || 0);
    
    // Launch real browser
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 2: LAUNCHING REAL BROWSER');
    console.log('═'.repeat(70));
    
    browser = await chromium.launch({ 
      headless: false, // Set to true to run without visible browser
      slowMo: 500 // Slow down actions so we can see them
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('✅ Browser launched');
    
    // Navigate to login page
    console.log('\nSTEP 3: LOGGING IN');
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[name="email"]', LOGIN_EMAIL);
    await page.fill('input[name="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL(`${FRONTEND_URL}/dashboard`, { timeout: 10000 });
    console.log('✅ Logged in successfully');
    
    // Navigate to OPR Review page
    console.log('\nSTEP 4: NAVIGATING TO OPR REVIEW PAGE');
    const oprUrl = `${FRONTEND_URL}/documents/${documentId}/opr-review`;
    await page.goto(oprUrl);
    await page.waitForLoadState('networkidle');
    console.log('✅ OPR Review page loaded');
    
    // Wait for document content to load
    await page.waitForSelector('.document-container', { timeout: 10000 });
    console.log('✅ Document content loaded');
    
    // Get initial document content
    const initialContent = await page.evaluate(() => {
      const container = document.querySelector('.document-container');
      return container ? container.innerText : '';
    });
    console.log('Initial content length:', initialContent.length);
    
    // Count feedback items
    const feedbackCount = await page.evaluate(() => {
      const feedbackItems = document.querySelectorAll('[data-testid="feedback-item"]');
      return feedbackItems.length;
    });
    console.log('Feedback items found on page:', feedbackCount);
    
    // Set merge mode to AI
    console.log('\nSTEP 5: SETTING MERGE MODE TO AI');
    const mergeSelect = await page.$('select[data-testid="merge-mode-select"]');
    if (mergeSelect) {
      await mergeSelect.selectOption('ai');
      console.log('✅ Merge mode set to AI');
    } else {
      // Try to find by label or other selector
      await page.click('text=AI');
      console.log('✅ Merge mode set to AI');
    }
    
    // Process feedback items
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 6: CLICKING MERGE BUTTONS FOR EACH FEEDBACK');
    console.log('═'.repeat(70));
    
    // Get all feedback items
    const feedbackItems = await page.$$('[data-testid="feedback-item"]');
    console.log(`Found ${feedbackItems.length} feedback items to process\n`);
    
    for (let i = 0; i < Math.min(feedbackItems.length, 3); i++) { // Test first 3 items
      console.log(`\n──── Processing feedback ${i + 1} ────`);
      
      // Click on feedback item to select it
      await feedbackItems[i].click();
      await page.waitForTimeout(500);
      
      // Find and click merge button
      const mergeButton = await page.$('button:has-text("Merge")');
      if (!mergeButton) {
        console.log('❌ Merge button not found');
        testsFailed++;
        continue;
      }
      
      console.log('🔄 Clicking merge button...');
      await mergeButton.click();
      
      // Wait for merge dialog or result
      await page.waitForTimeout(2000);
      
      // Check if merge was successful
      const successMessage = await page.$('text=/merge.*success/i');
      if (successMessage) {
        console.log('✅ Merge successful');
        testsPassed++;
      } else {
        console.log('❌ Merge may have failed');
        testsFailed++;
      }
      
      // Close any dialog
      const closeButton = await page.$('button:has-text("Close")');
      if (closeButton) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Verify final document state
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 7: VERIFYING DOCUMENT INTEGRITY');
    console.log('═'.repeat(70));
    
    // Get final content
    const finalContent = await page.evaluate(() => {
      const container = document.querySelector('.document-container');
      return container ? container.innerHTML : '';
    });
    
    // Check for document corruption
    const tests = [
      {
        name: 'No duplicate H1 tags',
        test: () => {
          const h1Count = (finalContent.match(/<h1>/g) || []).length;
          return h1Count <= 1;
        }
      },
      {
        name: 'No nested paragraphs',
        test: () => {
          // Check for <p> inside <p>
          return !finalContent.includes('<p><p>');
        }
      },
      {
        name: 'Document has content',
        test: () => {
          return finalContent.length > 1000;
        }
      },
      {
        name: 'Sections preserved',
        test: () => {
          return finalContent.includes('SECTION I') && 
                 finalContent.includes('SECTION II');
        }
      }
    ];
    
    console.log('\nDocument integrity tests:');
    for (const test of tests) {
      if (test.test()) {
        console.log(`   ✅ ${test.name}`);
        testsPassed++;
      } else {
        console.log(`   ❌ ${test.name}`);
        testsFailed++;
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'opr-review-test-final.png', fullPage: true });
    console.log('\n📸 Screenshot saved: opr-review-test-final.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    testsFailed++;
  } finally {
    // Close browser
    if (browser) {
      await browser.close();
    }
    
    // Disconnect database
    await prisma.$disconnect();
    
    // Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    console.log(`Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - Review the output above');
    }
  }
}

// Run the test
console.log('Starting real browser UI test...\n');
realUIBrowserTest().catch(console.error);