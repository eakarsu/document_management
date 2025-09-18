const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWorkflowMetadata() {
  try {
    // Define the hierarchical distributed review workflow
    const hierarchicalWorkflow = {
      name: "Hierarchical Distributed Review",
      version: "1.0.0",
      type: "hierarchical",
      stages: [
        {
          id: "stage-1",
          name: "OPR Initiation",
          type: "initiation",
          stageOrder: 1,
          isStartingStage: true,
          assignedRole: "OPR",
          actions: ["submit"],
          description: "Office of Primary Responsibility initiates the document"
        },
        {
          id: "stage-2",
          name: "PCM Review",
          type: "review",
          stageOrder: 2,
          assignedRole: "PCM",
          actions: ["approve", "reject", "comment"],
          description: "Process Control Manager reviews the document"
        },
        {
          id: "stage-3",
          name: "Coordination",
          type: "coordination",
          stageOrder: 3,
          assignedRole: "Coordinator",
          actions: ["distribute", "consolidate"],
          description: "Distribute for department review"
        },
        {
          id: "stage-3-1",
          name: "Department Review 1",
          type: "parallel-review",
          stageOrder: 3.1,
          parentStageId: "stage-3",
          assignedRole: "Department Sub-reviewer",
          actions: ["review", "comment", "approve"],
          description: "Department 1 review"
        },
        {
          id: "stage-3-2",
          name: "Department Review 2",
          type: "parallel-review",
          stageOrder: 3.2,
          parentStageId: "stage-3",
          assignedRole: "Department Sub-reviewer",
          actions: ["review", "comment", "approve"],
          description: "Department 2 review"
        },
        {
          id: "stage-3-3",
          name: "Department Review 3",
          type: "parallel-review",
          stageOrder: 3.3,
          parentStageId: "stage-3",
          assignedRole: "Department Sub-reviewer",
          actions: ["review", "comment", "approve"],
          description: "Department 3 review"
        },
        {
          id: "stage-4",
          name: "OPR Consolidation",
          type: "consolidation",
          stageOrder: 4,
          assignedRole: "OPR",
          actions: ["consolidate", "revise"],
          description: "OPR consolidates department feedback"
        },
        {
          id: "stage-5",
          name: "Front Office Review",
          type: "review",
          stageOrder: 5,
          assignedRole: "Front Office",
          actions: ["approve", "reject", "comment"],
          description: "Front Office review"
        },
        {
          id: "stage-6",
          name: "OPR Final Consolidation",
          type: "consolidation",
          stageOrder: 6,
          assignedRole: "OPR",
          actions: ["finalize", "submit"],
          description: "OPR finalizes document"
        },
        {
          id: "stage-7",
          name: "Legal Review",
          type: "review",
          stageOrder: 7,
          assignedRole: "Legal",
          actions: ["approve", "reject", "comment"],
          description: "Legal department review"
        },
        {
          id: "stage-8",
          name: "AFDPO Preparation",
          type: "preparation",
          stageOrder: 8,
          assignedRole: "AFDPO",
          actions: ["prepare", "format"],
          description: "AFDPO prepares for leadership"
        },
        {
          id: "stage-9",
          name: "Leadership Sign-off",
          type: "approval",
          stageOrder: 9,
          assignedRole: "Leadership",
          actions: ["sign", "reject"],
          description: "Leadership final approval"
        },
        {
          id: "stage-10",
          name: "AFDPO Publication",
          type: "publication",
          stageOrder: 10,
          assignedRole: "AFDPO",
          actions: ["publish", "archive"],
          description: "AFDPO publishes the document"
        }
      ],
      transitions: [
        { from: "stage-1", to: "stage-2", condition: "submit" },
        { from: "stage-2", to: "stage-3", condition: "approve" },
        { from: "stage-3", to: ["stage-3-1", "stage-3-2", "stage-3-3"], condition: "distribute" },
        { from: ["stage-3-1", "stage-3-2", "stage-3-3"], to: "stage-4", condition: "all-complete" },
        { from: "stage-4", to: "stage-5", condition: "consolidate" },
        { from: "stage-5", to: "stage-6", condition: "approve" },
        { from: "stage-6", to: "stage-7", condition: "submit" },
        { from: "stage-7", to: "stage-8", condition: "approve" },
        { from: "stage-8", to: "stage-9", condition: "prepare" },
        { from: "stage-9", to: "stage-10", condition: "sign" },
        { from: "stage-10", to: "completed", condition: "publish" }
      ]
    };

    // Find all workflow instances (or specifically the one with problems)
    const instances = await prisma.jsonWorkflowInstance.findMany({
      where: {
        isActive: true
      }
    });

    console.log(`Found ${instances.length} active workflow instances\n`);

    for (const instance of instances) {
      console.log(`Checking instance ${instance.id} for document ${instance.documentId}`);

      // Check if metadata has workflow definition
      const metadata = instance.metadata as any;
      const hasDefinition = metadata?.workflowDefinition ||
                           metadata?.definition ||
                           (metadata?.stages && Array.isArray(metadata.stages));

      if (!hasDefinition) {
        console.log(`  ❌ No workflow definition in metadata`);

        // Fix by adding workflow definition to metadata
        const updatedMetadata = {
          ...metadata,
          workflowDefinition: hierarchicalWorkflow
        };

        await prisma.jsonWorkflowInstance.update({
          where: { id: instance.id },
          data: {
            metadata: updatedMetadata
          }
        });

        console.log(`  ✅ Added workflow definition to metadata\n`);
      } else {
        console.log(`  ✅ Already has workflow definition\n`);
      }
    }

    // Also check if we need to create workflow in workflows table
    const workflowId = 'hierarchical-distributed-review';
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!existingWorkflow) {
      await prisma.workflow.create({
        data: {
          id: workflowId,
          name: hierarchicalWorkflow.name,
          definition: hierarchicalWorkflow,
          isActive: true,
          version: hierarchicalWorkflow.version
        }
      });
      console.log('✅ Created workflow in workflows table');
    } else {
      // Update existing workflow to ensure it has the correct definition
      await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          definition: hierarchicalWorkflow
        }
      });
      console.log('✅ Updated workflow in workflows table');
    }

  } catch (error) {
    console.error('Error fixing workflow metadata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWorkflowMetadata();