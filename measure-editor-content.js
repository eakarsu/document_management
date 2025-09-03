const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function measureEditorContent() {
  console.log('\n' + '='.repeat(60));
  console.log('📏 MEASURING EDITOR CONTENT SIZE');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Get all documents with content in customFields
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        customFields: true,
        fileSize: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`📊 Analyzing ${documents.length} recent documents...\n`);
    
    let totalContentSize = 0;
    let docsWithContent = 0;
    let docsWithoutContent = 0;
    let largestContent = 0;
    let largestDoc = null;
    
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. "${doc.title}"`);
      console.log(`   ID: ${doc.id}`);
      
      if (doc.customFields && doc.customFields.content) {
        const content = doc.customFields.content;
        const sizeInBytes = Buffer.byteLength(content, 'utf8');
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        const charCount = content.length;
        
        // Count HTML tags
        const tagMatches = content.match(/<[^>]+>/g) || [];
        const tagCount = tagMatches.length;
        
        // Count text without HTML
        const textOnly = content.replace(/<[^>]+>/g, '').trim();
        const textLength = textOnly.length;
        
        // Count words
        const words = textOnly.split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        
        console.log(`   ✅ Has content:`);
        console.log(`      - Size: ${sizeInBytes} bytes (${sizeInKB} KB)`);
        console.log(`      - Characters: ${charCount}`);
        console.log(`      - Text only: ${textLength} chars`);
        console.log(`      - Word count: ${wordCount} words`);
        console.log(`      - HTML tags: ${tagCount}`);
        console.log(`      - Preview: "${textOnly.substring(0, 50)}..."`);
        
        totalContentSize += sizeInBytes;
        docsWithContent++;
        
        if (sizeInBytes > largestContent) {
          largestContent = sizeInBytes;
          largestDoc = doc;
        }
      } else {
        console.log(`   ❌ No content in customFields`);
        docsWithoutContent++;
      }
      
      // Also show file size if available
      if (doc.fileSize) {
        console.log(`   📁 File size: ${doc.fileSize} bytes (${(doc.fileSize / 1024).toFixed(2)} KB)`);
      }
      
      console.log();
    });
    
    // Summary statistics
    console.log('='.repeat(60));
    console.log('📊 SUMMARY STATISTICS');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Content Analysis:`);
    console.log(`   - Documents with content: ${docsWithContent}`);
    console.log(`   - Documents without content: ${docsWithoutContent}`);
    console.log(`   - Total content size: ${totalContentSize} bytes (${(totalContentSize / 1024).toFixed(2)} KB)`);
    
    if (docsWithContent > 0) {
      const avgSize = totalContentSize / docsWithContent;
      console.log(`   - Average content size: ${avgSize.toFixed(0)} bytes (${(avgSize / 1024).toFixed(2)} KB)`);
    }
    
    if (largestDoc) {
      console.log(`\n📦 Largest Content:`);
      console.log(`   - Document: "${largestDoc.title}"`);
      console.log(`   - Size: ${largestContent} bytes (${(largestContent / 1024).toFixed(2)} KB)`);
    }
    
    // Check total database storage
    const allDocs = await prisma.document.count();
    console.log(`\n💾 Database Storage:`);
    console.log(`   - Total documents in DB: ${allDocs}`);
    
    // Check a specific large document
    const largeTestDoc = await prisma.document.findFirst({
      where: {
        customFields: {
          path: ['content'],
          not: null
        }
      },
      orderBy: {
        fileSize: 'desc'
      }
    });
    
    if (largeTestDoc && largeTestDoc.customFields?.content) {
      const content = largeTestDoc.customFields.content;
      console.log(`\n🔍 Sample Large Document:`);
      console.log(`   - Title: "${largeTestDoc.title}"`);
      console.log(`   - Content size: ${Buffer.byteLength(content, 'utf8')} bytes`);
      console.log(`   - Can handle HTML: ${content.includes('<') ? 'YES' : 'NO'}`);
    }
    
    // Size limits
    console.log(`\n⚖️  Size Capabilities:`);
    console.log(`   - Prisma JSON field: Can store up to 1GB`);
    console.log(`   - Typical HTML document: 1-100 KB`);
    console.log(`   - Large document (100 pages): ~500 KB`);
    console.log(`   - Maximum recommended: 10 MB per document`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n=== MEASUREMENT COMPLETE ===\n');
}

measureEditorContent().catch(console.error);