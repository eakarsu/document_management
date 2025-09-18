const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCoordinatorTasks() {
  try {
    console.log('🔍 Checking Coordinator Workflow Tasks...\n');

    // Get coordinator users
    const coordinators = await prisma.user.findMany({
      where: {
        email: {
          in: ['coordinator1@airforce.mil', 'coordinator2@airforce.mil']
        }
      },
      include: {
        role: true,
        organization: true
      }
    });

    console.log('📊 Coordinators Found:');
    coordinators.forEach(coord => {
      console.log(`  - ${coord.email}: ${coord.firstName} ${coord.lastName} (${coord.role.name})`);
    });
    console.log('');

    // Check workflow instances
    const workflowInstances = await prisma.workflow_instances.findMany({
      include: {
        documents: true,
        users: true
      }
    });

    console.log('📝 Workflow Instances:');
    console.log('Total:', workflowInstances.length);
    console.log('');

    // Group by current stage
    const stageGroups = {};
    workflowInstances.forEach(wi => {
      const stage = wi.currentStage || 'unknown';
      if (!stageGroups[stage]) {
        stageGroups[stage] = [];
      }
      stageGroups[stage].push(wi);
    });

    console.log('📊 Documents by Stage:');
    Object.entries(stageGroups).forEach(([stage, instances]) => {
      console.log(`\n  Stage ${stage}: ${instances.length} document(s)`);
      instances.forEach(wi => {
        const doc = wi.documents?.[0];
        console.log(`    - Document: "${doc?.title || 'Unknown'}" (ID: ${wi.documentId})`);
        console.log(`      Status: ${wi.status}`);
        console.log(`      Workflow ID: ${wi.workflowId}`);
        console.log(`      Created by: ${wi.users?.[0]?.email || 'Unknown'}`);
        console.log(`      Started: ${wi.createdAt}`);
      });
    });

    // Check specifically for stage 2 (coordinator1) and stage 4 (coordinator2)
    console.log('\n🎯 Coordinator-Specific Tasks:');

    const stage2Docs = stageGroups['2'] || [];
    console.log(`\n  Coordinator1 (Stage 2): ${stage2Docs.length} document(s)`);
    if (stage2Docs.length > 0) {
      stage2Docs.forEach(wi => {
        console.log(`    - "${wi.documents?.[0]?.title || 'Unknown'}" needs distribution`);
      });
    } else {
      console.log('    No documents awaiting distribution');
    }

    const stage4Docs = stageGroups['4'] || [];
    console.log(`\n  Coordinator2 (Stage 4): ${stage4Docs.length} document(s)`);
    if (stage4Docs.length > 0) {
      stage4Docs.forEach(wi => {
        console.log(`    - "${wi.documents?.[0]?.title || 'Unknown'}" needs second distribution`);
      });
    } else {
      console.log('    No documents awaiting second distribution');
    }

    // Check workflow_tasks table
    console.log('\n📋 Workflow Tasks Table:');
    const workflowTasks = await prisma.workflowTask.findMany({
      include: {
        workflow_instance: {
          include: {
            document: true
          }
        },
        assignedTo: true
      }
    });

    if (workflowTasks.length > 0) {
      console.log(`Found ${workflowTasks.length} task(s):`);
      workflowTasks.forEach(task => {
        console.log(`  - Task ID: ${task.id}`);
        console.log(`    Title: ${task.title}`);
        console.log(`    Status: ${task.status}`);
        console.log(`    Step: ${task.stepNumber}`);
        console.log(`    Assigned to: ${task.assignedTo?.email || 'Not assigned'}`);
        console.log(`    Document: ${task.workflow_instance?.document?.title || 'Unknown'}`);
        console.log('');
      });
    } else {
      console.log('No tasks found in WorkflowTask table');
    }

    // Check for coordinator role permissions
    console.log('\n🔐 Coordinator Role Permissions:');
    const coordinatorRole = await prisma.role.findFirst({
      where: { name: 'Coordinator' }
    });

    if (coordinatorRole) {
      console.log(`  Role: ${coordinatorRole.name}`);
      console.log(`  Permissions: ${JSON.stringify(coordinatorRole.permissions)}`);
    }

    // Recommendations
    console.log('\n💡 Troubleshooting Tips:');
    console.log('================================');
    if (stage2Docs.length > 0) {
      console.log('✅ Documents are at Stage 2 and should be visible to coordinator1@airforce.mil');
      console.log('   - Check if the WorkflowTask API is filtering by role correctly');
      console.log('   - Verify coordinator role has "workflow:coordinate" permission');
    } else {
      console.log('⚠️  No documents at Stage 2');
      console.log('   - OPR needs to submit a document through the workflow');
      console.log('   - Make sure to select "Distributed Review Workflow" when publishing');
    }

  } catch (error) {
    console.error('❌ Error checking tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoordinatorTasks();