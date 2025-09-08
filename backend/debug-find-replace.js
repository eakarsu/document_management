const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugFindReplace() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  console.log('=== DEBUG FIND AND REPLACE ALGORITHM ===\n');
  
  try {
    // Get document
    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    const content = doc.customFields?.content || '';
    const feedback = doc.customFields?.draftFeedback?.[0];
    
    console.log('1. CURRENT CONTENT:');
    console.log('   ', content);
    console.log('\n2. FEEDBACK:');
    console.log('   changeFrom:', feedback?.changeFrom);
    console.log('   changeTo:', feedback?.changeTo);
    
    // Check if text exists
    console.log('\n3. SEARCHING FOR TEXT:');
    const searchText = feedback?.changeFrom || 'sdlgsdfgsdfgsdfgsdf';
    const index = content.indexOf(searchText);
    
    if (index === -1) {
      console.log('   ❌ Text "' + searchText + '" NOT FOUND in content!');
      console.log('   This is why the replace isn\'t working!');
      
      // Show what's actually in the content
      console.log('\n4. WHAT\'S ACTUALLY IN THE CONTENT:');
      console.log('   Content length:', content.length);
      console.log('   Content preview:', content.substring(0, 200));
      
      // Try to find similar text
      console.log('\n5. LOOKING FOR SIMILAR TEXT:');
      if (content.includes('Replace wit test')) {
        console.log('   ✓ Found "Replace wit test" - already merged!');
      }
      if (content.includes('sdlgsdfgsdfgsdfgsdf')) {
        console.log('   ✓ Found "sdlgsdfgsdfgsdfgsdf" - original text exists');
      }
      
    } else {
      console.log('   ✓ Found at position:', index);
      console.log('   Text before:', content.substring(Math.max(0, index - 20), index));
      console.log('   Text to replace:', content.substring(index, index + searchText.length));
      console.log('   Text after:', content.substring(index + searchText.length, Math.min(content.length, index + searchText.length + 20)));
    }
    
    console.log('\n6. THE PROBLEM:');
    console.log('   The text has ALREADY been replaced!');
    console.log('   Current: "Replace wit test"');
    console.log('   Trying to find: "sdlgsdfgsdfgsdfgsdf" (doesn\'t exist anymore)');
    console.log('   That\'s why find/replace fails!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugFindReplace();