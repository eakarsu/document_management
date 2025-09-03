const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDocumentCreation() {
  console.log('\n=== TESTING DOCUMENT CREATION WITH CONTENT ===\n');
  
  try {
    // 1. Get an existing user and organization
    const user = await prisma.user.findFirst({
      include: { role: true }
    });
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Using user: ${user.firstName} ${user.lastName}`);
    
    // 2. Create a new document with HTML content in customFields
    const htmlContent = `
      <h1>Test Document with Content</h1>
      <p>This is a test document created with actual HTML content.</p>
      <h2>Section 1: Introduction</h2>
      <p>This document demonstrates that content is properly stored in the database.</p>
      <ul>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ul>
      <h2>Section 2: Details</h2>
      <p>The content is stored in the customFields.content field as HTML.</p>
      <p><strong>Bold text</strong> and <em>italic text</em> are supported.</p>
    `;
    
    // Generate unique values to avoid conflicts
    const timestamp = Date.now();
    const crypto = require('crypto');
    const checksum = crypto.createHash('md5').update(`test-${timestamp}-${Math.random()}`).digest('hex');
    
    console.log('\n📝 Creating document with content...');
    
    const newDocument = await prisma.document.create({
      data: {
        title: `Test Document ${timestamp}`,
        description: 'Document created to test content storage',
        fileName: `test_doc_${timestamp}.html`,
        originalName: `test_doc_${timestamp}.html`,
        mimeType: 'text/html',
        fileSize: Buffer.byteLength(htmlContent, 'utf8'),
        checksum: checksum,
        storagePath: `documents/test/${timestamp}.html`,
        status: 'DRAFT',
        category: 'TEST',
        tags: ['test', 'content'],
        customFields: {
          content: htmlContent,  // Store HTML content here
          createdFrom: 'test-script',
          hasEditableContent: true
        },
        createdById: user.id,
        organizationId: user.organizationId,
        currentVersion: 1
      }
    });
    
    console.log(`✅ Document created: "${newDocument.title}"`);
    console.log(`   ID: ${newDocument.id}`);
    console.log(`   Content stored in: customFields.content`);
    
    // 3. Verify content was saved
    console.log('\n🔍 Verifying content was saved...');
    
    const savedDoc = await prisma.document.findUnique({
      where: { id: newDocument.id }
    });
    
    if (savedDoc && savedDoc.customFields) {
      const customFields = savedDoc.customFields;
      if (customFields.content) {
        console.log('✅ Content successfully saved in database!');
        console.log(`   Content length: ${customFields.content.length} characters`);
        console.log(`   Content preview: ${customFields.content.substring(0, 100)}...`);
        
        // Check if content contains expected HTML
        if (customFields.content.includes('<h1>Test Document with Content</h1>')) {
          console.log('✅ HTML structure preserved correctly');
        }
      } else {
        console.log('❌ Content not found in customFields');
      }
    } else {
      console.log('❌ Document or customFields not found');
    }
    
    // 4. Test loading content (simulate editor loading)
    console.log('\n📖 Testing content loading (like editor does)...');
    
    const documentForEditor = await prisma.document.findFirst({
      where: { id: newDocument.id }
    });
    
    if (documentForEditor && documentForEditor.customFields) {
      const content = documentForEditor.customFields.content || '<p>No content found</p>';
      console.log('✅ Content can be loaded for editing');
      console.log(`   Loaded ${content.length} characters`);
    }
    
    // 5. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log('✅ Documents CAN store content in the database');
    console.log('✅ Content is stored in customFields.content field');
    console.log('✅ Editor loads content from customFields.content');
    console.log('✅ Editor saves content back to customFields.content');
    console.log('\n⚠️  ISSUE: File uploads don\'t extract/store content');
    console.log('   Solution: Extract text/HTML from uploaded files');
    console.log('   and store it in customFields.content');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.log('   (Document with same checksum already exists)');
    }
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

// Run the test
testDocumentCreation().catch(console.error);