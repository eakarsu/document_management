const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findHierarchicalDocuments() {
  try {
    console.log('🔍 Finding Documents with Hierarchical Workflow\n');
    console.log('='.repeat(60));

    // Find all active hierarchical workflows
    const hierarchicalWorkflows = await prisma.jsonWorkflowInstance.findMany({
      where: {
        workflowId: {
          in: ['hierarchical-distributed-workflow', 'hierarchical-distributed-review']
        },
        isActive: true
      },
      include: {
        document: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 HIERARCHICAL WORKFLOW DOCUMENTS (10 stages with PCM):');
    console.log('   Found:', hierarchicalWorkflows.length, 'document(s)\n');

    if (hierarchicalWorkflows.length > 0) {
      hierarchicalWorkflows.forEach((wf, index) => {
        console.log(`   ${index + 1}. Document ID: ${wf.documentId}`);
        console.log(`      Title: ${wf.document?.title || 'Unknown'}`);
        console.log(`      Current Stage: ${wf.currentStageId}`);
        console.log(`      Created: ${wf.createdAt}`);
        console.log(`      Workflow ID: ${wf.workflowId}`);
        console.log('');
      });

      console.log('   ✅ USE ONE OF THESE DOCUMENTS TO TEST PCM!');
    } else {
      console.log('   ❌ No hierarchical workflow documents found');
    }

    // Find all active distributed workflows
    const distributedWorkflows = await prisma.jsonWorkflowInstance.findMany({
      where: {
        workflowId: 'distributed-review-workflow',
        isActive: true
      },
      include: {
        document: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 DISTRIBUTED WORKFLOW DOCUMENTS (8 stages, NO PCM):');
    console.log('   Found:', distributedWorkflows.length, 'document(s)\n');

    if (distributedWorkflows.length > 0) {
      distributedWorkflows.forEach((wf, index) => {
        console.log(`   ${index + 1}. Document ID: ${wf.documentId}`);
        console.log(`      Title: ${wf.document?.title || 'Unknown'}`);
        console.log(`      Current Stage: ${wf.currentStageId}`);
        console.log(`      Workflow ID: ${wf.workflowId}`);
        console.log('');
      });

      console.log('   ⚠️  These documents DO NOT have PCM stage!');
    }

    // Get document cmfn33ifj000pfjsqyo04fb7p details
    const specificDoc = await prisma.document.findUnique({
      where: { id: 'cmfn33ifj000pfjsqyo04fb7p' },
      include: {
        jsonWorkflowInstances: true,
        createdBy: true
      }
    });

    console.log('\n📄 DOCUMENT cmfn33ifj000pfjsqyo04fb7p DETAILS:');
    if (specificDoc) {
      console.log('   Title:', specificDoc.title);
      console.log('   Created by:', specificDoc.createdBy?.email);
      console.log('   Status:', specificDoc.status);
      console.log('   Workflow Instances:', specificDoc.jsonWorkflowInstances.length);

      specificDoc.jsonWorkflowInstances.forEach(inst => {
        console.log(`   - ${inst.workflowId} (Active: ${inst.isActive})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 TO TEST PCM FUNCTIONALITY:');
    console.log('\n   Option 1: Use existing hierarchical document');
    if (hierarchicalWorkflows.length > 0) {
      const firstHier = hierarchicalWorkflows[0];
      console.log(`   - Use document: ${firstHier.documentId}`);
      console.log(`   - Current stage: ${firstHier.currentStageId}`);
    }
    console.log('\n   Option 2: Create NEW document');
    console.log('   1. Login as ao1@airforce.mil');
    console.log('   2. Create new document');
    console.log('   3. When starting workflow, make sure to select:');
    console.log('      "Hierarchical Distributed Review Workflow"');
    console.log('      (NOT "Distributed Review Workflow")');
    console.log('   4. Submit to PCM');
    console.log('   5. Login as pcm@airforce.mil to review');

    console.log('\n⚠️  IMPORTANT:');
    console.log('   The document in your screenshot (cmfn33ifj000pfjsqyo04fb7p)');
    console.log('   is using the WRONG workflow type for PCM testing.');
    console.log('   It has distributed-review-workflow which has NO PCM role.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findHierarchicalDocuments();