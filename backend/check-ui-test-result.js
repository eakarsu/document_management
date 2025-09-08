const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkResult() {
  const doc = await prisma.document.findFirst({
    where: { id: 'doc_af_manual_mfbiqcf7' }
  });
  
  const content = doc?.customFields?.content || '';
  console.log('Document after UI test:');
  console.log('- Content length:', content.length);
  console.log('- Has "automaticaly":', content.includes('automaticaly'));
  console.log('- Has "automatically":', content.includes('automatically'));
  console.log('- Has "typicaly":', content.includes('typicaly'));
  console.log('- Has "typically":', content.includes('typically'));
  
  // Check if any merges actually happened
  const feedback = doc?.customFields?.draftFeedback || [];
  console.log('- Feedback items still in document:', feedback.length);
  console.log('\nConclusion:');
  
  if (feedback.length === 15) {
    console.log('❌ NO MERGES WERE ACTUALLY APPLIED');
    console.log('The UI is not working - clicking buttons but not merging');
  } else if (feedback.length === 0) {
    console.log('✅ All feedback was processed');
  } else {
    console.log(`⚠️ Partial merges: ${15 - feedback.length} of 15 applied`);
  }
  
  await prisma.$disconnect();
}

checkResult();