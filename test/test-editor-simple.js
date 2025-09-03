const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEditorDataLoading() {
  console.log('\n=== EDITOR DATABASE LOADING TEST ===\n');
  
  let browser;
  
  try {
    // 1. First, get data directly from database to confirm it exists
    console.log('📊 Checking database for documents...');
    const documents = await prisma.document.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        fileName: true,
        status: true
      }
    });
    
    console.log(`✅ Found ${documents.length} documents in database:`);
    documents.forEach(doc => {
      console.log(`   - ${doc.title} (ID: ${doc.id})`);
    });
    
    if (documents.length === 0) {
      console.log('❌ No documents in database to test with');
      return;
    }
    
    // 2. Launch browser and try to access editor
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // 3. Try to navigate directly to editor with first document
    const testDoc = documents[0];
    console.log(`\n📝 Attempting to load editor with document: ${testDoc.title}`);
    
    const editorUrl = `http://localhost:3000/editor/${testDoc.id}`;
    console.log(`   URL: ${editorUrl}`);
    
    await page.goto(editorUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Check what loaded on the page
    console.log('\n🔍 Checking page content...');
    
    const pageUrl = page.url();
    console.log(`   Current URL: ${pageUrl}`);
    
    // Check if redirected to login
    if (pageUrl.includes('/login')) {
      console.log('   ⚠️  Redirected to login page - authentication required');
      
      // Try to find any existing session or bypass
      console.log('\n🔐 Checking for test accounts or session...');
      
      // Check if there's a way to access without login
      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log('   Page shows: ' + pageContent.substring(0, 100) + '...');
      
    } else if (pageUrl.includes('/editor')) {
      console.log('   ✅ Editor page loaded!');
      
      // Check if editor is present
      const hasEditor = await page.evaluate(() => {
        return document.querySelector('.ProseMirror') !== null ||
               document.querySelector('[contenteditable]') !== null ||
               document.querySelector('.tiptap') !== null ||
               document.querySelector('.editor') !== null;
      });
      
      if (hasEditor) {
        console.log('   ✅ Editor component found!');
        
        // Check if document data is loaded
        const pageText = await page.evaluate(() => document.body.innerText);
        
        if (pageText.includes(testDoc.title) || pageText.includes(testDoc.fileName)) {
          console.log('   ✅ Document data from database is displayed!');
          console.log('\n🎉 SUCCESS: Editor loads data from database!');
        } else {
          console.log('   ❌ Editor found but document data not visible');
          console.log('   Page contains: ' + pageText.substring(0, 200));
        }
      } else {
        console.log('   ❌ No editor component found on page');
        
        // Check what is on the page
        const elements = await page.evaluate(() => {
          return {
            forms: document.querySelectorAll('form').length,
            inputs: document.querySelectorAll('input').length,
            textareas: document.querySelectorAll('textarea').length,
            contenteditables: document.querySelectorAll('[contenteditable]').length
          };
        });
        console.log('   Page elements:', elements);
      }
    } else {
      console.log('   ❓ Unexpected page loaded');
    }
    
    // 5. Alternative: Try to check API directly
    console.log('\n🔌 Checking if API can retrieve document...');
    
    const apiResponse = await page.evaluate(async (docId) => {
      try {
        const response = await fetch(`http://localhost:5001/api/documents/${docId}`);
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        return { error: error.message };
      }
    }, testDoc.id);
    
    console.log('   API Response:', apiResponse);
    
    if (apiResponse.ok) {
      console.log('   ✅ API can retrieve document data');
    } else if (apiResponse.status === 401) {
      console.log('   ⚠️  API requires authentication');
    } else {
      console.log('   ❌ API error:', apiResponse.statusText || apiResponse.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
    await prisma.$disconnect();
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

// Run the test
testEditorDataLoading().catch(console.error);