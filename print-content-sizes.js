const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function printContentSizes() {
  console.log('\n' + '='.repeat(60));
  console.log('📏 CONTENT SIZES FROM DATABASE');
  console.log('='.repeat(60) + '\n');
  
  const docs = await prisma.document.findMany({
    where: {
      customFields: {
        path: ['content'],
        not: null
      }
    },
    select: {
      id: true,
      title: true,
      customFields: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`Found ${docs.length} documents with content:\n`);
  
  let totalSize = 0;
  let sizes = [];
  
  docs.forEach((doc, index) => {
    if (doc.customFields?.content) {
      const content = doc.customFields.content;
      const bytes = Buffer.byteLength(content, 'utf8');
      const kb = (bytes / 1024).toFixed(2);
      
      totalSize += bytes;
      sizes.push(bytes);
      
      console.log(`${index + 1}. "${doc.title}"`);
      console.log(`   📦 SIZE: ${bytes} bytes (${kb} KB)`);
      console.log(`   📝 Characters: ${content.length}`);
      console.log(`   🕐 Created: ${doc.createdAt.toLocaleString()}`);
      console.log(`   📄 Content preview: "${content.replace(/<[^>]*>/g, '').substring(0, 60)}..."`);
      console.log();
    }
  });
  
  // Statistics
  console.log('='.repeat(60));
  console.log('📊 STATISTICS');
  console.log('='.repeat(60));
  
  if (sizes.length > 0) {
    const avgSize = totalSize / sizes.length;
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    
    console.log(`\n📈 Size Summary:`);
    console.log(`   Total documents: ${sizes.length}`);
    console.log(`   Total size: ${totalSize} bytes (${(totalSize / 1024).toFixed(2)} KB)`);
    console.log(`   Average size: ${avgSize.toFixed(0)} bytes (${(avgSize / 1024).toFixed(2)} KB)`);
    console.log(`   Smallest: ${minSize} bytes`);
    console.log(`   Largest: ${maxSize} bytes (${(maxSize / 1024).toFixed(2)} KB)`);
  }
  
  await prisma.$disconnect();
}

printContentSizes().catch(console.error);