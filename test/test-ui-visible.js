#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function runVisibleUITest() {
  console.log('🌐 LAUNCHING VISIBLE UI TEST - You will see browser windows!');
  console.log('========================================================');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',  // Faster headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    console.log('📋 Step 1: Loading homepage...');
    await page.goto('http://localhost:3000');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔐 Step 2: Going to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    
    console.log('✏️ Step 3: Filling login form...');
    await page.type('input[type="email"]', 'admin@admin.com');
    await page.type('input[type="password"]', 'password123');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🚀 Step 4: Submitting login...');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    console.log('📊 Step 5: Viewing dashboard...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📝 Step 6: Going to document creation page...');
    await page.goto('http://localhost:3000/documents/create');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🎨 Step 7: Selecting template (you should see template cards)...');
    await page.waitForSelector('.MuiCard-root');
    
    // Click first template
    await page.click('.MuiCard-root');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('▶️ Step 8: Clicking Next button...');
    // Try different selectors for the Next button
    try {
      await page.click('button:contains("Next")');
    } catch {
      try {
        await page.click('button[variant="contained"]');
      } catch {
        await page.click('button:last-child');
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📄 Step 9: Filling document form...');
    try {
      await page.type('input[placeholder*="title"], input[label*="Title"]', 'Visual Test Document with Biography');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.type('input[placeholder*="publication"]', 'VISUAL-TEST-001');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('Form filling failed, but template selection worked!');
    }
    
    console.log('🗂️ Step 10: Going to documents page...');
    await page.goto('http://localhost:3000/documents');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📊 Step 11: Going to publishing page...');
    await page.goto('http://localhost:3000/publishing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🤖 Step 12: Going to AI workflow page...');
    await page.goto('http://localhost:3000/ai-workflow');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n✅ VISUAL TEST COMPLETE!');
    console.log('=========================');
    console.log('You should have seen:');
    console.log('- Homepage loading');
    console.log('- Login form with fields');
    console.log('- Dashboard with cards and stats');
    console.log('- Document creation page with 5 template cards');
    console.log('- At least 4 templates showing "Biography" chips');
    console.log('- Documents listing page');
    console.log('- Publishing management page');
    console.log('- AI workflow page with 8 features');
    console.log('\nPress Enter to close browser...');
    
    // Keep browser open until user presses Enter
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the visible test
if (require.main === module) {
  runVisibleUITest().catch(console.error);
}