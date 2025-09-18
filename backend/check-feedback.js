const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFeedback() {
  const docId = 'cmflje0jn001pupwzqy3webdj';

  // Get document with all feedback
  const document = await prisma.document.findUnique({
    where: { id: docId },
    select: {
      id: true,
      title: true,
      customFields: true
    }
  });

  if (!document) {
    console.log('Document not found');
    return;
  }

  console.log('Document:', document.title);
  console.log('\nChecking feedback in customFields...\n');

  const customFields = document.customFields || {};

  // Check for comment matrix (reviewer feedback)
  if (customFields.commentMatrix) {
    console.log('✅ Found commentMatrix with', customFields.commentMatrix.length, 'comments');
    customFields.commentMatrix.forEach((comment, idx) => {
      console.log(`\n[Comment ${idx + 1}]`);
      console.log('  Component:', comment.component);
      console.log('  Type:', comment.commentType);
      console.log('  Comment:', comment.coordinatorComment);
      console.log('  Page:', comment.page || 'N/A');
    });
  } else {
    console.log('❌ No commentMatrix found');
  }

  // Check for draft feedback
  if (customFields.draftFeedback) {
    console.log('\n✅ Found draftFeedback with', customFields.draftFeedback.length, 'items');
  }

  // Check for other feedback fields
  const feedbackFields = Object.keys(customFields).filter(key =>
    key.toLowerCase().includes('feedback') ||
    key.toLowerCase().includes('comment') ||
    key.toLowerCase().includes('review')
  );

  console.log('\nAll feedback-related fields:', feedbackFields);

  await prisma.$disconnect();
}

checkFeedback().catch(console.error);