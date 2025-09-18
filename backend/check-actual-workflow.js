const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function checkActualWorkflow() {
  try {
    console.log('🔍 Checking Actual Workflow Configuration\n');
    console.log('='.repeat(60));

    const documentId = 'cmfn33ifj000pfjsqyo04fb7p';

    // Get the workflow instance
    const workflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (workflow) {
      console.log('\n1. DATABASE WORKFLOW INSTANCE:');
      console.log('   Instance ID:', workflow.id);
      console.log('   Document ID:', workflow.documentId);
      console.log('   Workflow ID:', workflow.workflowId);
      console.log('   Current Stage:', workflow.currentStageId);
      console.log('   Is Active:', workflow.isActive);
      console.log('   Created:', workflow.createdAt);
      console.log('   Updated:', workflow.updatedAt);

      // Check metadata
      console.log('\n2. WORKFLOW METADATA:');
      const metadata = workflow.metadata;
      if (metadata) {
        console.log('   Metadata exists:', '✅');

        // Check if metadata contains workflow definition
        if (metadata.workflowDefinition) {
          console.log('   Has workflowDefinition in metadata: ✅');
          console.log('   Workflow Name from metadata:', metadata.workflowDefinition.name);
          console.log('   Workflow ID from metadata:', metadata.workflowDefinition.id);
          console.log('   Stages count:', metadata.workflowDefinition.stages?.length);
        } else if (metadata.stages) {
          console.log('   Has stages directly in metadata: ✅');
          console.log('   Workflow Name:', metadata.name);
          console.log('   Workflow ID:', metadata.id);
          console.log('   Stages count:', metadata.stages.length);
        } else {
          console.log('   No workflow definition in metadata: ❌');
        }
      } else {
        console.log('   No metadata found: ❌');
      }

      // Load the actual workflow file
      console.log('\n3. WORKFLOW FILE CHECK:');
      const workflowPath = path.join(__dirname, 'workflows', `${workflow.workflowId}.json`);

      if (fs.existsSync(workflowPath)) {
        const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
        console.log('   File exists: ✅');
        console.log('   File Name:', workflowDef.name);
        console.log('   File ID:', workflowDef.id);
        console.log('   File Stages:', workflowDef.stages.length);

        // Check current stage
        const currentStage = workflowDef.stages.find(s =>
          s.id === workflow.currentStageId ||
          s.id === String(workflow.currentStageId)
        );

        if (currentStage) {
          console.log('\n4. CURRENT STAGE DETAILS:');
          console.log('   Stage ID:', currentStage.id);
          console.log('   Stage Name:', currentStage.name);
          console.log('   Assigned Role:', currentStage.assignedRole || currentStage.roles);
        }
      } else {
        console.log('   File NOT found: ❌');
        console.log('   Expected path:', workflowPath);
      }

      // Check if it's actually hierarchical workflow
      console.log('\n5. WORKFLOW TYPE ANALYSIS:');
      if (workflow.workflowId === 'hierarchical-distributed-workflow') {
        console.log('   ✅ This IS the hierarchical workflow (10 stages with PCM)');
      } else if (workflow.workflowId === 'distributed-review-workflow') {
        console.log('   ❌ This is the distributed workflow (8 stages, no PCM)');
      } else {
        console.log('   ⚠️  Unknown workflow type:', workflow.workflowId);
      }

      // Check why UI might show wrong name
      console.log('\n6. UI DISPLAY ISSUE ANALYSIS:');
      console.log('   The UI might be showing the wrong workflow name because:');
      console.log('   1. Metadata contains wrong workflow definition');
      console.log('   2. Frontend is caching old workflow data');
      console.log('   3. Workflow was changed after document creation');
      console.log('   4. There\'s a mismatch between workflowId and metadata');

      // Get all workflows for this document
      const allWorkflows = await prisma.jsonWorkflowInstance.findMany({
        where: { documentId },
        orderBy: { createdAt: 'desc' }
      });

      console.log('\n7. ALL WORKFLOWS FOR THIS DOCUMENT:');
      console.log('   Total workflow instances:', allWorkflows.length);
      allWorkflows.forEach((wf, index) => {
        console.log(`   ${index + 1}. Workflow ID: ${wf.workflowId}, Active: ${wf.isActive}, Stage: ${wf.currentStageId}`);
      });

    } else {
      console.log('❌ No active workflow found for document:', documentId);
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualWorkflow();