const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer');
const prisma = new PrismaClient();

async function testEditorContent() {
  console.log('\n=== TESTING IF EDITOR LOADS CONTENT ===\n');
  
  let browser;
  
  try {
    // 1. First create a document WITH content
    const user = await prisma.user.findFirst();
    const timestamp = Date.now();
    const crypto = require('crypto');
    const checksum = crypto.createHash('md5').update(`test-${timestamp}`).digest('hex');
    
    const htmlContent = `<h1>Test Document with Content</h1>
    <p>This paragraph should appear in the editor.</p>
    <h2>Important Section</h2>
    <p>If you can see this text in the editor, content loading works!</p>`;
    
    console.log('📝 Creating document with content...');
    const document = await prisma.document.create({
      data: {
        title: `Editor Test ${timestamp}`,
        description: 'Testing editor content',
        fileName: `test_${timestamp}.html`,
        originalName: `test_${timestamp}.html`,
        mimeType: 'text/html',
        fileSize: htmlContent.length,
        checksum: checksum,
        storagePath: `documents/test/${timestamp}.html`,
        status: 'DRAFT',
        category: 'TEST',
        customFields: {
          content: htmlContent  // Content stored here
        },
        createdById: user.id,
        organizationId: user.organizationId,
        currentVersion: 1
      }
    });
    
    console.log(`✅ Document created with ID: ${document.id}`);
    console.log(`   Content stored: ${htmlContent.length} characters`);
    
    // 2. Open browser and navigate to editor
    console.log('\n🌐 Opening editor...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // Navigate directly to editor with the document ID
    const editorUrl = `http://localhost:3000/editor/${document.id}`;
    console.log(`   Navigating to: ${editorUrl}`);
    
    await page.goto(editorUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for editor to load
    
    // 3. Check if editor has content
    console.log('\n🔍 Checking editor content...');
    
    const editorContent = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror') || 
                    document.querySelector('[contenteditable="true"]') ||
                    document.querySelector('.tiptap');
      
      if (editor) {
        return {
          found: true,
          text: editor.textContent || '',
          html: editor.innerHTML || '',
          isEmpty: editor.textContent.trim() === ''
        };
      }
      
      return { found: false };
    });
    
    if (editorContent.found) {
      console.log('✅ Editor element found');
      
      if (editorContent.isEmpty) {
        console.log('❌ EDITOR IS EMPTY - No content loaded!');
      } else {
        console.log('✅ EDITOR HAS CONTENT!');
        console.log(`   Text length: ${editorContent.text.length} characters`);
        console.log(`   Content preview: "${editorContent.text.substring(0, 100)}..."`);
        
        // Check if our specific content is there
        if (editorContent.text.includes('This paragraph should appear in the editor')) {
          console.log('✅ DATABASE CONTENT SUCCESSFULLY LOADED IN EDITOR!');
        } else if (editorContent.text.includes('Start editing your document')) {
          console.log('⚠️  Editor showing default placeholder, not database content');
        } else {
          console.log('⚠️  Editor has content but not from database');
        }
      }
    } else {
      console.log('❌ Editor element not found on page');
      
      // Check if we're on login page
      const url = page.url();
      if (url.includes('/login')) {
        console.log('   (Redirected to login - authentication required)');
      }
    }
    
    // 4. Check what the API returns
    console.log('\n🔌 Checking what database has...');
    const dbDoc = await prisma.document.findUnique({
      where: { id: document.id }
    });
    
    if (dbDoc.customFields && dbDoc.customFields.content) {
      console.log('✅ Database HAS content in customFields.content');
      console.log(`   Content: "${dbDoc.customFields.content.substring(0, 100)}..."`);
    } else {
      console.log('❌ Database has NO content in customFields.content');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
    await prisma.$disconnect();
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

testEditorContent();