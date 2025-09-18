const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflowHistory() {
  try {
    console.log('🔍 Checking Why Workflow Auto-Advanced to Stage 2\n');
    console.log('='.repeat(60));

    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

    // Get the workflow
    const workflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (!workflow) {
      console.log('❌ No active workflow found');
      return;
    }

    console.log('\n1. CURRENT WORKFLOW STATE:');
    console.log('   Document ID:', documentId);
    console.log('   Workflow ID:', workflow.workflowId);
    console.log('   Current Stage:', workflow.currentStageId);
    console.log('   Is Active:', workflow.isActive);
    console.log('   Created:', workflow.createdAt);
    console.log('   Updated:', workflow.updatedAt);

    // Get workflow history
    const history = await prisma.jsonWorkflowHistory.findMany({
      where: {
        workflowInstanceId: workflow.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('\n2. WORKFLOW HISTORY (in order):');
    history.forEach((entry, idx) => {
      console.log(`\n   ${idx + 1}. Action: ${entry.action}`);
      console.log(`      Stage: ${entry.stageId} - ${entry.stageName}`);
      console.log(`      Performed By: ${entry.performedBy}`);
      console.log(`      Time: ${entry.createdAt}`);
      if (entry.metadata) {
        console.log(`      Metadata:`, entry.metadata);
      }
    });

    // Analyze the issue
    console.log('\n3. ISSUE ANALYSIS:');

    // Check if there's an advance action right after start
    const startEntry = history.find(h => h.action === 'STARTED' || h.action === 'RESET_TO_START');
    const advanceEntry = history.find(h => h.action === 'ADVANCE_STAGE' || h.action === 'Submit for Coordination');

    if (startEntry && advanceEntry) {
      const timeDiff = new Date(advanceEntry.createdAt) - new Date(startEntry.createdAt);
      console.log('   Start time:', startEntry.createdAt);
      console.log('   Advance time:', advanceEntry.createdAt);
      console.log('   Time difference:', timeDiff / 1000, 'seconds');

      if (timeDiff < 5000) { // Less than 5 seconds
        console.log('\n   ⚠️  WORKFLOW AUTO-ADVANCED!');
        console.log('   The workflow moved from Stage 1 to Stage 2 automatically');
        console.log('   This happened within', timeDiff / 1000, 'seconds of starting');
      }
    }

    // Check who performed the actions
    const uniqueUsers = [...new Set(history.map(h => h.performedBy))];
    console.log('\n4. USERS WHO PERFORMED ACTIONS:');
    for (const userId of uniqueUsers) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      console.log(`   - ${userId}: ${user?.email || 'Unknown'}`);
    }

    console.log('\n5. POSSIBLE CAUSES:');
    console.log('   1. Auto-advance logic in the code');
    console.log('   2. User clicked button very quickly');
    console.log('   3. Double-click or duplicate request');
    console.log('   4. Workflow configuration has auto-transition');

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflowHistory();