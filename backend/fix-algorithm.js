const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAlgorithm() {
  const documentId = 'cmf6w5vh9002bgu01h5abycma';
  
  console.log('=== FIX THE FIND AND REPLACE ALGORITHM ===\n');
  
  try {
    // Get document
    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    const content = doc.customFields?.content || '';
    const feedback = doc.customFields?.draftFeedback?.[0];
    
    if (!feedback) {
      console.log('No feedback found');
      return;
    }
    
    console.log('CURRENT ALGORITHM (WRONG):');
    console.log('  content.replace(changeFrom, changeTo)');
    console.log('  This only replaces FIRST occurrence!');
    
    console.log('\nCORRECT ALGORITHM SHOULD BE:');
    console.log('  1. Find ALL occurrences of the text');
    console.log('  2. Replace ALL of them');
    console.log('  3. Handle case sensitivity');
    console.log('  4. Handle partial matches vs whole words');
    
    console.log('\nBETTER IMPLEMENTATION:');
    
    // Method 1: Replace ALL occurrences
    const method1 = content.replaceAll(feedback.changeFrom, feedback.changeTo);
    console.log('\n1. Using replaceAll():');
    console.log('   ', method1);
    
    // Method 2: Using regex for more control
    const regex = new RegExp(feedback.changeFrom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const method2 = content.replace(regex, feedback.changeTo);
    console.log('\n2. Using regex with global flag:');
    console.log('   ', method2);
    
    // Method 3: Case insensitive
    const regexCI = new RegExp(feedback.changeFrom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const method3 = content.replace(regexCI, feedback.changeTo);
    console.log('\n3. Case insensitive:');
    console.log('   ', method3);
    
    console.log('\nTHE REAL PROBLEM:');
    console.log('  The algorithm should handle:');
    console.log('  - Multiple occurrences');
    console.log('  - Preserve formatting');
    console.log('  - Track what was changed');
    console.log('  - Handle HTML tags properly');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAlgorithm();