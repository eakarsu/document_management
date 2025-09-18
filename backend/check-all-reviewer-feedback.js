const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllReviewerFeedback() {
  const docId = 'cmflje0jn001pupwzqy3webdj';

  console.log('='.repeat(60));
  console.log('CHECKING ALL REVIEWER FEEDBACK');
  console.log('='.repeat(60));

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
    console.log('❌ Document not found');
    return;
  }

  console.log('📄 Document:', document.title);
  console.log('');

  // Check workflow tasks to see who has submitted
  const workflow = await prisma.workflowInstance.findFirst({
    where: { documentId: docId },
    include: {
      tasks: {
        include: {
          assignedTo: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (workflow) {
    console.log('WORKFLOW STATUS:');
    console.log('  Current Stage:', workflow.currentStage);
    console.log('  Status:', workflow.status);
    console.log('');

    // Check completed review tasks
    const reviewTasks = workflow.tasks.filter(t =>
      t.type === 'REVIEW' ||
      t.name?.toLowerCase().includes('review') ||
      t.stage === 3 ||
      t.stage === 3.5
    );

    console.log('REVIEWER TASKS:');
    const completedReviewers = [];
    const pendingReviewers = [];

    reviewTasks.forEach(task => {
      const reviewer = task.assignedTo?.email || 'Unknown';
      if (task.status === 'completed') {
        completedReviewers.push(reviewer);
        console.log(`  ✅ ${reviewer} - COMPLETED (${task.decision || 'submitted'})`);
      } else {
        pendingReviewers.push(reviewer);
        console.log(`  ⏳ ${reviewer} - ${task.status.toUpperCase()}`);
      }
    });

    console.log('');
    console.log(`SUMMARY: ${completedReviewers.length} completed, ${pendingReviewers.length} pending`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('FEEDBACK IN DATABASE:');
  console.log('='.repeat(60));

  const customFields = document.customFields || {};

  // 1. Check commentMatrix (main storage for reviewer feedback)
  if (customFields.commentMatrix) {
    console.log('\n📋 COMMENT MATRIX (Main Feedback Storage):');
    console.log('  Total Comments:', customFields.commentMatrix.length);

    // Group feedback by reviewer if possible
    const feedbackByComponent = {};
    customFields.commentMatrix.forEach((comment, idx) => {
      const component = comment.component || 'Unknown';
      if (!feedbackByComponent[component]) {
        feedbackByComponent[component] = [];
      }
      feedbackByComponent[component].push(comment);
    });

    Object.keys(feedbackByComponent).forEach(component => {
      console.log(`\n  From ${component}:`);
      feedbackByComponent[component].forEach((comment, idx) => {
        console.log(`    [${idx + 1}] Type: ${comment.commentType} | Page: ${comment.page || 'N/A'}`);
        console.log(`        Comment: ${comment.coordinatorComment}`);
        if (comment.changeTo) {
          console.log(`        Suggested Change: ${comment.changeTo}`);
        }
      });
    });
  } else {
    console.log('\n❌ No commentMatrix found - This is where reviewer feedback should be stored!');
  }

  // 2. Check draftFeedback (temporary storage)
  if (customFields.draftFeedback) {
    console.log('\n📝 DRAFT FEEDBACK (Temporary Storage):');
    console.log('  Total Drafts:', customFields.draftFeedback.length);
  }

  // 3. Check for reviewer-specific feedback fields
  const reviewerFields = Object.keys(customFields).filter(key =>
    key.toLowerCase().includes('reviewer') ||
    key.toLowerCase().includes('feedback') ||
    key.toLowerCase().includes('review')
  );

  if (reviewerFields.length > 0) {
    console.log('\n🔍 OTHER FEEDBACK FIELDS FOUND:');
    reviewerFields.forEach(field => {
      const value = customFields[field];
      if (typeof value === 'object' && value !== null) {
        console.log(`  ${field}: ${JSON.stringify(value).substring(0, 100)}...`);
      } else {
        console.log(`  ${field}: ${value}`);
      }
    });
  }

  // 4. Check if we have feedback from all 5 expected reviewers
  console.log('\n' + '='.repeat(60));
  console.log('EXPECTED REVIEWERS (5 total):');
  console.log('='.repeat(60));
  const expectedReviewers = [
    'ops.reviewer1@airforce.mil',
    'ops.reviewer2@airforce.mil',
    'logistics.reviewer1@airforce.mil',
    'logistics.reviewer2@airforce.mil',
    'finance.reviewer1@airforce.mil'
  ];

  expectedReviewers.forEach(reviewer => {
    // Check if this reviewer has submitted anything
    const hasSubmitted = workflow?.tasks.some(t =>
      t.assignedTo?.email === reviewer &&
      t.status === 'completed'
    );

    console.log(`  ${hasSubmitted ? '✅' : '❌'} ${reviewer}`);
  });

  // Final analysis
  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS:');
  console.log('='.repeat(60));

  const totalFeedback = (customFields.commentMatrix?.length || 0) + (customFields.draftFeedback?.length || 0);

  if (totalFeedback === 0) {
    console.log('⚠️ NO FEEDBACK FOUND IN DATABASE!');
    console.log('   - Reviewers may not have submitted their feedback yet');
    console.log('   - Or feedback is not being saved properly to customFields.commentMatrix');
  } else {
    console.log(`✅ Found ${totalFeedback} total feedback items in database`);

    if (customFields.commentMatrix?.length > 0) {
      console.log(`   - ${customFields.commentMatrix.length} in commentMatrix (permanent storage)`);
    }
    if (customFields.draftFeedback?.length > 0) {
      console.log(`   - ${customFields.draftFeedback.length} in draftFeedback (temporary storage)`);
    }
  }

  await prisma.$disconnect();
}

checkAllReviewerFeedback().catch(console.error);