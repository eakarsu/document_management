const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testCreateDocumentAndMeasure() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 TEST: CREATE DOCUMENT WITH UI → CHECK EDITOR CONTENT SIZE');
  console.log('='.repeat(60) + '\n');
  
  let browser;
  
  try {
    // 1. Setup test user
    console.log('👤 Creating test user...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    const org = await prisma.organization.findFirst();
    const role = await prisma.role.findFirst();
    
    await prisma.user.deleteMany({ where: { email: 'ui.test@test.com' } });
    
    const testUser = await prisma.user.create({
      data: {
        email: 'ui.test@test.com',
        firstName: 'UI',
        lastName: 'Test',
        passwordHash: hashedPassword,
        roleId: role.id,
        organizationId: org.id
      }
    });
    console.log('✅ Test user created');
    
    // 2. Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // 3. Login
    console.log('\n🔐 Step 1: LOGIN');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'ui.test@test.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Logged in');
    
    // 4. Navigate to dashboard
    console.log('\n📊 Step 2: DASHBOARD');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. Click Create Document
    console.log('\n📝 Step 3: CLICK CREATE DOCUMENT');
    const createClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find(btn => btn.textContent?.includes('Create Document'));
      if (createBtn) {
        createBtn.click();
        return true;
      }
      return false;
    });
    
    if (!createClicked) {
      // Try direct navigation
      await page.goto('http://localhost:3000/documents/create', { waitUntil: 'networkidle2' });
    }
    console.log('✅ On create document page');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Select first template
    console.log('\n📋 Step 4: SELECT FIRST TEMPLATE');
    await page.click('.MuiCard-root:first-child');
    console.log('✅ Selected template');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 7. Click Next
    console.log('\n➡️ Step 5: CLICK NEXT');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(btn => btn.textContent === 'Next');
      if (nextBtn) nextBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 8. Fill title
    const timestamp = Date.now();
    const docTitle = `UI Test Doc ${timestamp}`;
    console.log('\n✏️ Step 6: FILL DOCUMENT DETAILS');
    await page.evaluate((title) => {
      const inputs = document.querySelectorAll('input[type="text"]');
      if (inputs[0]) {
        inputs[0].value = title;
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, docTitle);
    console.log(`✅ Title: "${docTitle}"`);
    
    // 9. Click Next again
    console.log('\n➡️ Step 7: CLICK NEXT TO REVIEW');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(btn => btn.textContent === 'Next');
      if (nextBtn) nextBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 10. Click Create Document
    console.log('\n🎯 Step 8: CLICK CREATE DOCUMENT');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find(btn => 
        btn.textContent?.includes('Create Document') && 
        !btn.textContent?.includes('Create Document Button')
      );
      if (createBtn) createBtn.click();
    });
    console.log('⏳ Waiting for document creation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if redirected to editor
    const currentUrl = page.url();
    let documentId = null;
    
    if (currentUrl.includes('/editor/')) {
      documentId = currentUrl.split('/editor/')[1];
      console.log(`✅ Redirected to editor with document ID: ${documentId}`);
    } else {
      console.log('❌ Not redirected to editor');
      
      // Try to find the document in database
      const createdDoc = await prisma.document.findFirst({
        where: { title: docTitle },
        orderBy: { createdAt: 'desc' }
      });
      
      if (createdDoc) {
        documentId = createdDoc.id;
        console.log(`✅ Document found in DB: ${documentId}`);
        
        // Navigate to editor manually
        await page.goto(`http://localhost:3000/editor/${documentId}`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // 11. Check editor content
    console.log('\n' + '='.repeat(60));
    console.log('📏 MEASURING EDITOR CONTENT');
    console.log('='.repeat(60));
    
    const editorData = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror') || 
                    document.querySelector('[contenteditable="true"]') ||
                    document.querySelector('.tiptap');
      
      if (!editor) {
        return { found: false };
      }
      
      const textContent = editor.textContent || '';
      const htmlContent = editor.innerHTML || '';
      
      // Calculate sizes
      const textSize = new Blob([textContent]).size;
      const htmlSize = new Blob([htmlContent]).size;
      
      return {
        found: true,
        isEmpty: textContent.trim() === '',
        textContent: textContent,
        htmlContent: htmlContent,
        textSize: textSize,
        htmlSize: htmlSize,
        charCount: textContent.length,
        wordCount: textContent.split(/\s+/).filter(w => w.length > 0).length,
        hasHeadings: htmlContent.includes('<h1>') || htmlContent.includes('<h2>'),
        hasParagraphs: htmlContent.includes('<p>'),
        hasLists: htmlContent.includes('<ul>') || htmlContent.includes('<ol>')
      };
    });
    
    if (editorData.found) {
      if (editorData.isEmpty) {
        console.log('\n❌ EDITOR IS EMPTY!');
      } else {
        console.log('\n✅ EDITOR HAS CONTENT!');
        console.log('\n📊 Content Measurements:');
        console.log(`   Text size: ${editorData.textSize} bytes`);
        console.log(`   HTML size: ${editorData.htmlSize} bytes`);
        console.log(`   Characters: ${editorData.charCount}`);
        console.log(`   Words: ${editorData.wordCount}`);
        console.log(`   Has headings: ${editorData.hasHeadings ? 'YES' : 'NO'}`);
        console.log(`   Has paragraphs: ${editorData.hasParagraphs ? 'YES' : 'NO'}`);
        console.log(`   Has lists: ${editorData.hasLists ? 'YES' : 'NO'}`);
        
        console.log('\n📄 Content Preview:');
        console.log(`   "${editorData.textContent.substring(0, 200)}..."`);
      }
    } else {
      console.log('\n❌ Editor not found');
    }
    
    // 12. Check database
    if (documentId) {
      console.log('\n💾 DATABASE CHECK:');
      const dbDoc = await prisma.document.findUnique({
        where: { id: documentId }
      });
      
      if (dbDoc) {
        if (dbDoc.customFields && dbDoc.customFields.content) {
          const content = dbDoc.customFields.content;
          const sizeBytes = Buffer.byteLength(content, 'utf8');
          const sizeKB = (sizeBytes / 1024).toFixed(2);
          
          console.log(`   ✅ Content in customFields.content`);
          console.log(`   Size: ${sizeBytes} bytes (${sizeKB} KB)`);
          console.log(`   Preview: "${content.substring(0, 100)}..."`);
        } else {
          console.log('   ❌ No content in customFields');
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(60));
    
    if (editorData.found && !editorData.isEmpty) {
      console.log('\n✅ SUCCESS: Document created via UI and editor shows content');
      console.log(`   Content size: ${editorData.htmlSize} bytes`);
    } else {
      console.log('\n❌ ISSUE: Editor is empty after creating document via UI');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
    
    // Cleanup
    await prisma.user.deleteMany({ where: { email: 'ui.test@test.com' } });
    await prisma.$disconnect();
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

testCreateDocumentAndMeasure().catch(console.error);