const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPCMWorkflowIssue() {
  try {
    console.log('🔍 PCM Workflow Issue Analysis & Fix\n');
    console.log('='.repeat(60));

    // Get the document from the screenshot
    const documentId = 'cmfn33ifj000pfjsqyo04fb7p'; // From your screenshot

    const workflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    console.log('\n1. CURRENT SITUATION:');
    if (workflow) {
      console.log('   Document ID:', documentId);
      console.log('   Current Workflow:', workflow.workflowId);
      console.log('   Current Stage:', workflow.currentStageId);
      console.log('   Is Active:', workflow.isActive);

      if (workflow.workflowId === 'distributed-review-workflow') {
        console.log('\n   ❌ PROBLEM IDENTIFIED:');
        console.log('   This document uses "distributed-review-workflow" (8 stages)');
        console.log('   PCM does NOT exist in this workflow!');
        console.log('   PCM only exists in "hierarchical-distributed-workflow" (10 stages)');
      }
    }

    // Check PCM user
    const pcmUser = await prisma.user.findUnique({
      where: { email: 'pcm@airforce.mil' },
      include: { role: true }
    });

    console.log('\n2. PCM USER DETAILS:');
    console.log('   Email:', pcmUser.email);
    console.log('   Role:', pcmUser.role?.name);
    console.log('   Expected Workflow: hierarchical-distributed-workflow');
    console.log('   Expected Stage: Stage 2 - PCM Review (OPR Gatekeeper)');

    console.log('\n3. WORKFLOW COMPARISON:');
    console.log('\n   📋 distributed-review-workflow (8 stages):');
    console.log('      Stage 1: Initial Draft Preparation (ACTION_OFFICER)');
    console.log('      Stage 2: First Coordination (COORDINATOR) - NO PCM!');
    console.log('      Stage 3: OPR Review & Revision');
    console.log('      ... (8 stages total, PCM not involved)');

    console.log('\n   📋 hierarchical-distributed-workflow (10 stages):');
    console.log('      Stage 1: Initial Draft Preparation (ACTION_OFFICER)');
    console.log('      Stage 2: PCM Review (PCM) ← PCM WORKS HERE!');
    console.log('      Stage 3: First Coordination');
    console.log('      ... (10 stages total, PCM is gatekeeper at stage 2)');

    console.log('\n4. SOLUTION:');
    console.log('   Option A: Create NEW document with correct workflow:');
    console.log('      1. Login as ao1@airforce.mil');
    console.log('      2. Create new document');
    console.log('      3. Select "Hierarchical Distributed Review Workflow"');
    console.log('      4. Submit to PCM');
    console.log('      5. Then PCM can review and approve/reject');

    console.log('\n   Option B: Update existing document workflow (risky):');
    console.log('      - Would need to change workflowId from distributed to hierarchical');
    console.log('      - May cause data consistency issues');
    console.log('      - Not recommended');

    // Check for documents with hierarchical workflow
    const hierarchicalDocs = await prisma.jsonWorkflowInstance.findMany({
      where: {
        workflowId: 'hierarchical-distributed-workflow',
        isActive: true
      },
      include: {
        document: true
      }
    });

    console.log('\n5. EXISTING HIERARCHICAL WORKFLOW DOCUMENTS:');
    if (hierarchicalDocs.length > 0) {
      console.log('   Found', hierarchicalDocs.length, 'document(s) with hierarchical workflow:');
      hierarchicalDocs.forEach(doc => {
        console.log(`   - Document: ${doc.documentId}`);
        console.log(`     Title: ${doc.document?.title || 'Unknown'}`);
        console.log(`     Stage: ${doc.currentStageId}`);
      });
      console.log('\n   PCM can work on these documents!');
    } else {
      console.log('   ❌ No documents found with hierarchical workflow');
      console.log('   Need to create new document with correct workflow');
    }

    console.log('\n6. DUPLICATE STAGE NAMES IN CONSOLE:');
    console.log('   This is a UI rendering issue where the component');
    console.log('   is re-rendering multiple times. Not a data issue.');
    console.log('   Can be fixed by optimizing the React component.');

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ RECOMMENDED ACTION:');
    console.log('1. Login as ao1@airforce.mil');
    console.log('2. Create a NEW document');
    console.log('3. When starting workflow, select:');
    console.log('   "Hierarchical Distributed Review Workflow (10 stages)"');
    console.log('   NOT "Distributed Review Workflow (8 stages)"');
    console.log('4. Submit document to PCM');
    console.log('5. Login as pcm@airforce.mil to review');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPCMWorkflowIssue();