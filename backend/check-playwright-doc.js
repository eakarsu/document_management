const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlaywrightDoc() {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: 'doc_af_manual_mfbhn8mv' }
    });
    
    if (doc) {
      const content = doc.customFields?.content || '';
      console.log('📄 Playwright Test Document Status:');
      console.log('═'.repeat(50));
      console.log('ID:', doc.id);
      console.log('Title:', doc.title);
      console.log('Content length:', content.length, 'characters');
      console.log('Created:', doc.createdAt);
      console.log('Updated:', doc.updatedAt);
      
      // Check for duplicates
      const h1Count = (content.match(/<h1>/g) || []).length;
      const sectionICount = (content.match(/SECTION I - INTRODUCTION/g) || []).length;
      
      console.log('\nDocument Integrity:');
      console.log('- H1 headers:', h1Count, h1Count === 1 ? '✅' : '❌ DUPLICATE!');
      console.log('- Section I:', sectionICount, sectionICount === 1 ? '✅' : '❌ DUPLICATE!');
      
      // Check if merges were applied
      const hasAutomatically = content.includes('automatically');
      const hasTypically = content.includes('typically');
      const allMergesApplied = doc.customFields?.allMergesApplied;
      
      console.log('\nMerge Status:');
      console.log('- Contains "automatically":', hasAutomatically ? '✅ Fixed' : '❌ Still has typo');
      console.log('- Contains "typically":', hasTypically ? '✅ Fixed' : '❌ Still has typo');
      console.log('- All merges applied flag:', allMergesApplied ? '✅ Yes' : '❌ No');
      
      console.log('\n🔗 View at: http://localhost:3000/documents/doc_af_manual_mfbhn8mv/opr-review');
      
      // Compare with latest test document
      const latestDoc = await prisma.document.findFirst({
        where: { id: 'doc_af_manual_mfbiaxrj' }
      });
      
      if (latestDoc) {
        console.log('\n📊 Comparison with latest test document:');
        console.log('─'.repeat(50));
        console.log('Playwright doc size:', content.length);
        console.log('Latest test doc size:', latestDoc.customFields?.content?.length || 0);
      }
      
    } else {
      console.log('❌ Document doc_af_manual_mfbhn8mv not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlaywrightDoc();