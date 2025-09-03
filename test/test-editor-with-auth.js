const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testEditorWithAuth() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 COMPLETE EDITOR TEST WITH AUTHENTICATION');
  console.log('='.repeat(60) + '\n');
  
  let browser;
  
  try {
    // 1. Create test user with known password
    console.log('👤 Creating test user...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Get organization and role
    const org = await prisma.organization.findFirst();
    const role = await prisma.role.findFirst();
    
    if (!org || !role) {
      throw new Error('No organization or role found');
    }
    
    // Delete existing test user if exists
    await prisma.user.deleteMany({
      where: { email: 'editor.test@test.com' }
    });
    
    const testUser = await prisma.user.create({
      data: {
        email: 'editor.test@test.com',
        firstName: 'Editor',
        lastName: 'Test',
        passwordHash: hashedPassword,
        roleId: role.id,
        organizationId: org.id
      }
    });
    
    console.log(`✅ Test user created: ${testUser.email}`);
    
    // 2. Create document with content
    console.log('\n📝 Creating document with content...');
    const timestamp = Date.now();
    const crypto = require('crypto');
    const checksum = crypto.createHash('md5').update(`test-${timestamp}`).digest('hex');
    
    const htmlContent = `<h1>Test Document ${timestamp}</h1>
<p>This is test content that should appear in the editor.</p>
<h2>Important Section</h2>
<p><strong>Bold text</strong> and <em>italic text</em> for testing.</p>
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
<p>If you see this in the editor, content loading from database works!</p>`;
    
    const document = await prisma.document.create({
      data: {
        title: `Editor Test ${timestamp}`,
        description: 'Testing editor with authentication',
        fileName: `test_${timestamp}.html`,
        originalName: `test_${timestamp}.html`,
        mimeType: 'text/html',
        fileSize: htmlContent.length,
        checksum: checksum,
        storagePath: `documents/test/${timestamp}.html`,
        status: 'DRAFT',
        category: 'TEST',
        customFields: {
          content: htmlContent  // Store HTML content here
        },
        createdById: testUser.id,
        organizationId: testUser.organizationId,
        currentVersion: 1
      }
    });
    
    console.log(`✅ Document created with ID: ${document.id}`);
    console.log(`   Content length: ${htmlContent.length} characters`);
    
    // 3. Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // 4. Login
    console.log('\n🔑 Step 1: Login');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Fill login form
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'editor.test@test.com');
    await page.type('input[type="password"]', 'test123');
    
    console.log('   Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const afterLoginUrl = page.url();
    if (afterLoginUrl.includes('/dashboard')) {
      console.log('   ✅ Login successful - redirected to dashboard');
    } else {
      console.log(`   Current URL: ${afterLoginUrl}`);
    }
    
    // 5. Navigate to editor
    console.log('\n📝 Step 2: Navigate to Editor');
    const editorUrl = `http://localhost:3000/editor/${document.id}`;
    console.log(`   Going to: ${editorUrl}`);
    
    await page.goto(editorUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for editor to fully load
    
    // 6. Check editor content
    console.log('\n🔍 Step 3: Check Editor Content');
    
    const editorStatus = await page.evaluate(() => {
      // Find the editor element
      const editor = document.querySelector('.ProseMirror') || 
                    document.querySelector('[contenteditable="true"]') ||
                    document.querySelector('.tiptap') ||
                    document.querySelector('[data-editor]');
      
      if (!editor) {
        return { found: false, pageContent: document.body.textContent.substring(0, 200) };
      }
      
      const textContent = editor.textContent || '';
      const htmlContent = editor.innerHTML || '';
      
      return {
        found: true,
        textContent: textContent,
        htmlContent: htmlContent,
        isEmpty: textContent.trim() === '',
        charCount: textContent.length,
        hasHeading: htmlContent.includes('<h1>') || htmlContent.includes('<h2>'),
        hasList: htmlContent.includes('<ul>') || htmlContent.includes('<li>'),
        hasBold: htmlContent.includes('<strong>') || htmlContent.includes('<b>'),
        hasItalic: htmlContent.includes('<em>') || htmlContent.includes('<i>')
      };
    });
    
    if (editorStatus.found) {
      console.log('   ✅ Editor element found');
      
      if (editorStatus.isEmpty) {
        console.log('   ❌ EDITOR IS EMPTY!');
      } else {
        console.log('   ✅ EDITOR HAS CONTENT!');
        console.log(`      Character count: ${editorStatus.charCount}`);
        console.log(`      Has headings: ${editorStatus.hasHeading ? 'YES' : 'NO'}`);
        console.log(`      Has list: ${editorStatus.hasList ? 'YES' : 'NO'}`);
        console.log(`      Has bold: ${editorStatus.hasBold ? 'YES' : 'NO'}`);
        console.log(`      Has italic: ${editorStatus.hasItalic ? 'YES' : 'NO'}`);
        
        // Check for our specific content
        if (editorStatus.textContent.includes('This is test content that should appear')) {
          console.log('\n   🎉 SUCCESS! Database content loaded in editor!');
          console.log('   Content preview:');
          console.log(`   "${editorStatus.textContent.substring(0, 150)}..."`);
        } else if (editorStatus.textContent.includes('Start editing your document')) {
          console.log('\n   ⚠️  Editor showing default placeholder text');
        } else {
          console.log('\n   ⚠️  Editor has different content than expected');
          console.log(`   Content: "${editorStatus.textContent.substring(0, 100)}..."`);
        }
      }
    } else {
      console.log('   ❌ Editor element not found');
      console.log(`   Page content: ${editorStatus.pageContent}...`);
    }
    
    // 7. Test editing
    console.log('\n✏️  Step 4: Test Editing');
    
    if (editorStatus.found && !editorStatus.isEmpty) {
      // Try to add new text
      await page.click('.ProseMirror');
      await page.keyboard.type('\n\nThis text was added by the test.');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const afterEdit = await page.evaluate(() => {
        const editor = document.querySelector('.ProseMirror');
        return editor ? editor.textContent : '';
      });
      
      if (afterEdit.includes('This text was added by the test')) {
        console.log('   ✅ Editing works - new text added');
      } else {
        console.log('   ❌ Could not add new text');
      }
    }
    
    // 8. Verify database content
    console.log('\n💾 Step 5: Verify Database');
    
    const dbDoc = await prisma.document.findUnique({
      where: { id: document.id }
    });
    
    if (dbDoc.customFields && dbDoc.customFields.content) {
      console.log('   ✅ Database has content in customFields.content');
      const dbContent = dbDoc.customFields.content;
      if (dbContent.includes('Test Document')) {
        console.log('   ✅ Correct content stored in database');
      }
    } else {
      console.log('   ❌ No content in database customFields');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const results = {
      'User created': true,
      'Document created': true,
      'Login successful': afterLoginUrl.includes('/dashboard'),
      'Editor loaded': editorStatus.found,
      'Content displayed': editorStatus.found && !editorStatus.isEmpty,
      'Database content matches': editorStatus.textContent?.includes('This is test content')
    };
    
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${test}`);
    });
    
    const allPassed = Object.values(results).every(v => v);
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Editor loads content from database!');
    } else {
      console.log('\n⚠️  Some tests failed');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    // Cleanup
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
    
    // Delete test user
    await prisma.user.deleteMany({
      where: { email: 'editor.test@test.com' }
    });
    
    await prisma.$disconnect();
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

testEditorWithAuth().catch(console.error);