const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compareSizes() {
  try {
    // Get the original document (before merges)
    const originalDoc = await prisma.document.findFirst({
      where: { id: 'doc_af_manual_mfbhn8mv' },
    });
    
    // Get the final document (after all merges)
    const finalDoc = await prisma.document.findFirst({
      where: { id: 'doc_af_manual_mfbiaxrj' },
    });
    
    const originalContent = originalDoc?.customFields?.content || '';
    const finalContent = finalDoc?.customFields?.content || '';
    
    console.log('📊 DOCUMENT SIZE COMPARISON');
    console.log('═'.repeat(50));
    console.log('\nOriginal document (before merges):');
    console.log('  ID:', originalDoc?.id || 'Not found');
    console.log('  Content length:', originalContent.length, 'characters');
    
    console.log('\nFinal document (after 15 merges):');
    console.log('  ID:', finalDoc?.id || 'Not found');
    console.log('  Content length:', finalContent.length, 'characters');
    
    const sizeDiff = finalContent.length - originalContent.length;
    console.log('\nSize difference:', sizeDiff, 'characters');
    
    // Count sections
    const countSections = (content) => ({
      h1: (content.match(/<h1>/g) || []).length,
      sectionI: (content.match(/SECTION I - INTRODUCTION/g) || []).length,
      sectionII: (content.match(/SECTION II - AIRCRAFT SYSTEMS/g) || []).length,
      sectionIII: (content.match(/SECTION III - OPERATING PROCEDURES/g) || []).length,
      sectionIV: (content.match(/SECTION IV - EMERGENCY PROCEDURES/g) || []).length,
      pages: (content.match(/data-page="/g) || []).length,
    });
    
    const originalSections = countSections(originalContent);
    const finalSections = countSections(finalContent);
    
    console.log('\n📋 SECTION COUNT COMPARISON:');
    console.log('─'.repeat(50));
    console.log('                    Original  Final  Status');
    console.log('─'.repeat(50));
    console.log('H1 headers:        ', originalSections.h1.toString().padEnd(8), finalSections.h1.toString().padEnd(5), finalSections.h1 === 1 ? '✅' : '❌ DUPLICATE!');
    console.log('Section I:         ', originalSections.sectionI.toString().padEnd(8), finalSections.sectionI.toString().padEnd(5), finalSections.sectionI === 1 ? '✅' : '❌ DUPLICATE!');
    console.log('Section II:        ', originalSections.sectionII.toString().padEnd(8), finalSections.sectionII.toString().padEnd(5), finalSections.sectionII === 1 ? '✅' : '❌ DUPLICATE!');
    console.log('Section III:       ', originalSections.sectionIII.toString().padEnd(8), finalSections.sectionIII.toString().padEnd(5), finalSections.sectionIII === 1 ? '✅' : '❌ DUPLICATE!');
    console.log('Section IV:        ', originalSections.sectionIV.toString().padEnd(8), finalSections.sectionIV.toString().padEnd(5), finalSections.sectionIV === 1 ? '✅' : '❌ DUPLICATE!');
    console.log('Page markers:      ', originalSections.pages.toString().padEnd(8), finalSections.pages.toString().padEnd(5), finalSections.pages === originalSections.pages ? '✅' : '⚠️');
    
    // Check for reasonable size change
    const percentChange = originalContent.length > 0 
      ? ((finalContent.length - originalContent.length) / originalContent.length * 100).toFixed(1)
      : 'N/A';
    
    console.log('\n📈 SIZE ANALYSIS:');
    console.log('─'.repeat(50));
    console.log('Percentage change:', percentChange + '%');
    
    if (originalContent.length > 0) {
      const absChange = Math.abs(parseFloat(percentChange));
      if (absChange < 5) {
        console.log('✅ Minimal size change (less than 5%)');
        console.log('   This is expected - feedback mostly shortened verbose text');
      } else if (absChange < 20) {
        console.log('✅ Reasonable size change (less than 20%)');
      } else {
        console.log('⚠️  Large size change detected (more than 20%)');
        console.log('   This might indicate duplication or loss of content');
      }
    }
    
    // Check document integrity
    console.log('\n🔍 DOCUMENT INTEGRITY:');
    console.log('─'.repeat(50));
    
    const noDuplicates = finalSections.h1 === 1 && 
                         finalSections.sectionI === 1 && 
                         finalSections.sectionII === 1 && 
                         finalSections.sectionIII === 1 && 
                         finalSections.sectionIV === 1;
    
    if (noDuplicates) {
      console.log('✅ No duplicate sections detected');
    } else {
      console.log('❌ DUPLICATE SECTIONS DETECTED!');
      if (finalSections.h1 > 1) console.log('   - Multiple H1 headers:', finalSections.h1);
      if (finalSections.sectionI > 1) console.log('   - Multiple Section I:', finalSections.sectionI);
      if (finalSections.sectionII > 1) console.log('   - Multiple Section II:', finalSections.sectionII);
      if (finalSections.sectionIII > 1) console.log('   - Multiple Section III:', finalSections.sectionIII);
      if (finalSections.sectionIV > 1) console.log('   - Multiple Section IV:', finalSections.sectionIV);
    }
    
    // Expected size changes from feedback
    console.log('\n📝 EXPECTED CHANGES:');
    console.log('─'.repeat(50));
    console.log('The feedback included:');
    console.log('  - 5 spelling corrections (minimal size change)');
    console.log('  - 10 sentence simplifications (should reduce size)');
    console.log('  - Verbose phrases replaced with concise ones');
    console.log('\nExpected result: Slightly smaller document');
    console.log('Actual result:', sizeDiff < 0 ? `✅ Document reduced by ${Math.abs(sizeDiff)} chars` : 
                                   sizeDiff > 0 ? `⚠️ Document increased by ${sizeDiff} chars` :
                                   '✅ No size change');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

compareSizes();