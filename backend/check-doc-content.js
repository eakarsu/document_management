const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocumentContent() {
  try {
    // Find the most recent Air Force manual document
    const doc = await prisma.document.findFirst({
      where: {
        title: 'Air Force Technical Manual - F-16C/D Flight Manual'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!doc) {
      console.log('Document not found');
      return;
    }
    
    console.log('Document ID:', doc.id);
    console.log('Title:', doc.title);
    console.log('Created:', doc.createdAt);
    
    const content = doc.customFields?.content || '';
    console.log('\nContent Analysis:');
    console.log('- Length:', content.length, 'characters');
    console.log('- Has page 1:', content.includes('data-page="1"'));
    console.log('- Has page 2:', content.includes('data-page="2"'));
    console.log('- Has page 3:', content.includes('data-page="3"'));
    console.log('- Has page 4:', content.includes('data-page="4"'));
    console.log('- Starts with:', content.substring(0, 100));
    console.log('- Ends with:', content.substring(content.length - 100));
    
    // Check for duplicate sections
    const h1Matches = (content.match(/<h1>/g) || []).length;
    const sectionIMatches = (content.match(/SECTION I - INTRODUCTION/g) || []).length;
    console.log('\nDuplicate Check:');
    console.log('- H1 tags:', h1Matches);
    console.log('- "SECTION I - INTRODUCTION" occurrences:', sectionIMatches);
    
    // Check feedback
    const feedback = doc.customFields?.draftFeedback || [];
    console.log('\nFeedback:');
    console.log('- Total items:', feedback.length);
    
    // If content is truncated, recreate the document
    if (content.length < 5000) {
      console.log('\n⚠️ WARNING: Content appears truncated (less than 5000 chars)');
      console.log('The document may have been corrupted by previous UI merges.');
      console.log('Run create-af-manual-comprehensive.js to recreate with full content.');
    } else {
      console.log('\n✅ Content length looks good (', content.length, 'chars)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentContent();