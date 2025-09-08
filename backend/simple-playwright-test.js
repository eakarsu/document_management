const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const DOCUMENT_ID = 'doc_af_manual_mfbhn8mv';

// Token for direct API access to bypass login
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5czQ1cWowMDBvanA0aXpjNGZ1bXFiIiwiZW1haWwiOiJhZG1pbkBkZW1vLm1pbCIsInJvbGVJZCI6ImNtZXlzNDVmYjAwMGNqcDRpbXRndHVlc3UiLCJvcmdhbml6YXRpb25JZCI6ImNtZXlzNDVmMTAwMDBqcDRpY2NiNmY1OXUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU3MzM2Mzg1LCJleHAiOjE3NTc0MjI3ODV9.sV-xEU0DtLSkYrwNktrkujFnUs-OrUE_xHo2g3kLBhk';

async function simplePlaywrightTest() {
  console.log('=== SIMPLE PLAYWRIGHT TEST - DIRECT OPR PAGE ACCESS ===\n');
  
  let browser;
  
  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 1000 // Slow down to see actions
    });
    
    const context = await browser.newContext();
    
    // Set authentication cookie/token
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
    
    // Navigate directly to OPR Review page
    console.log(`📍 Navigating directly to OPR Review page...`);
    const url = `${FRONTEND_URL}/documents/${DOCUMENT_ID}/opr-review`;
    console.log(`   URL: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');
    
    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'playwright-initial-state.png',
      fullPage: true 
    });
    console.log('📸 Initial screenshot saved');
    
    // Try to find feedback items with various selectors
    console.log('\n🔍 Looking for feedback items...');
    
    // Try different selectors
    const selectors = [
      'li', // List items
      '[role="listitem"]', // ARIA role
      '.MuiListItem-root', // MUI list items
      '[data-testid*="feedback"]', // Test IDs
      'div:has-text("fb_af_")', // Divs containing feedback IDs
    ];
    
    let feedbackFound = false;
    let feedbackElements = [];
    
    for (const selector of selectors) {
      const elements = await page.$$(selector);
      console.log(`   Selector "${selector}" found ${elements.length} elements`);
      
      // Check if any contain feedback text
      for (const element of elements) {
        const text = await element.textContent();
        if (text && text.includes('fb_af_')) {
          feedbackFound = true;
          feedbackElements.push(element);
          console.log(`   ✅ Found feedback: ${text.substring(0, 50)}...`);
        }
      }
    }
    
    if (!feedbackFound) {
      console.log('⚠️  No feedback items found on page');
      console.log('\n📋 Page content preview:');
      const bodyText = await page.textContent('body');
      console.log(bodyText.substring(0, 500));
    } else {
      console.log(`\n✅ Found ${feedbackElements.length} feedback items`);
      
      // Try to click the first feedback item
      if (feedbackElements.length > 0) {
        console.log('\n🖱️ Clicking first feedback item...');
        await feedbackElements[0].click();
        await page.waitForTimeout(1000);
        
        // Look for merge button
        console.log('🔍 Looking for merge button...');
        const mergeButton = await page.$('button:has-text("Merge"), button:has-text("Apply"), button:has-text("MERGE")');
        
        if (mergeButton) {
          console.log('✅ Found merge button');
          
          // Take screenshot before merge
          await page.screenshot({ 
            path: 'playwright-before-merge.png',
            fullPage: true 
          });
          
          // Click merge
          console.log('🖱️ Clicking merge button...');
          await mergeButton.click();
          await page.waitForTimeout(2000);
          
          // Take screenshot after merge
          await page.screenshot({ 
            path: 'playwright-after-merge.png',
            fullPage: true 
          });
          
          console.log('✅ Merge clicked - check screenshots');
        } else {
          console.log('❌ Merge button not found');
        }
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'playwright-final-state.png',
      fullPage: true 
    });
    console.log('\n📸 Final screenshot saved');
    
    console.log('\n✅ Test completed - check screenshots:');
    console.log('   - playwright-initial-state.png');
    console.log('   - playwright-before-merge.png'); 
    console.log('   - playwright-after-merge.png');
    console.log('   - playwright-final-state.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Take error screenshot
    if (browser) {
      const pages = browser.contexts()[0]?.pages();
      if (pages && pages.length > 0) {
        await pages[0].screenshot({ 
          path: 'playwright-error.png',
          fullPage: true 
        });
        console.log('📸 Error screenshot saved');
      }
    }
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting simple Playwright test...\n');
simplePlaywrightTest();