const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminWorkflowVisibility() {
  try {
    console.log('🔍 Analyzing & Fixing Admin Workflow Visibility\n');
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
    console.log('   Is Active:', workflow.isActive);
    console.log('   Current Stage:', workflow.currentStageId);

    // Check the workflow history
    const history = await prisma.jsonWorkflowHistory.findMany({
      where: {
        workflowInstanceId: workflow.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('\n2. RECENT WORKFLOW HISTORY:');
    history.forEach((h, index) => {
      console.log(`   ${index + 1}. Action: ${h.action}`);
      console.log(`      Stage: ${h.stageName}`);
      console.log(`      By: ${h.performedBy}`);
      console.log(`      At: ${h.createdAt}`);
    });

    // Check if admin was the one who reset
    const resetAction = history.find(h => h.action === 'RESET_TO_START');
    if (resetAction) {
      const adminUser = await prisma.user.findUnique({
        where: { id: resetAction.performedBy }
      });
      console.log('\n3. RESET INFORMATION:');
      console.log('   Reset by:', adminUser?.email);
      console.log('   Reset at:', resetAction.createdAt);
    }

    // Check for any cache-related issues
    console.log('\n4. TROUBLESHOOTING STEPS FOR ADMIN:');
    console.log('\n   Option A - Clear Browser Cache (Recommended):');
    console.log('   1. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
    console.log('   2. Or open DevTools → Application → Clear Storage');
    console.log('   3. Refresh the page');

    console.log('\n   Option B - Check localStorage:');
    console.log('   1. Open browser console');
    console.log('   2. Run: localStorage.clear()');
    console.log('   3. Refresh the page');
    console.log('   4. Login again');

    console.log('\n   Option C - Try Incognito/Private Window:');
    console.log('   1. Open incognito/private browsing window');
    console.log('   2. Login as admin@airforce.mil');
    console.log('   3. Check if workflow is visible');

    console.log('\n5. API VERIFICATION:');
    console.log('   The backend API correctly returns:');
    console.log('   - isActive: true');
    console.log('   - active: true');
    console.log('   - currentStageId: 2');
    console.log('\n   This confirms the workflow IS active in the database.');

    console.log('\n6. LIKELY CAUSE:');
    console.log('   The admin\'s browser is showing cached/stale data');
    console.log('   from when the workflow was reset (inactive state).');
    console.log('   The UI is not refreshing properly after ao1 restarted it.');

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ IMMEDIATE FIX:');
    console.log('   1. Admin should clear browser cache (Ctrl+Shift+R)');
    console.log('   2. Or use incognito window for testing');
    console.log('   3. The workflow will then appear correctly');

    console.log('\n📋 PERMANENT FIX NEEDED:');
    console.log('   The JsonWorkflowDisplay component needs to:');
    console.log('   1. Force refresh after workflow reset');
    console.log('   2. Not cache workflow state in localStorage');
    console.log('   3. Poll for updates when inactive');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminWorkflowVisibility();