const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWorkflowInstance() {
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

    // Find the workflow instance with no definition
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId: 'cmflk2dek000djr0fl6s6106u'
      }
    });

    if (!workflowInstance) {
      console.log('No workflow instance found for this document');

      // Create a new workflow instance
      const newInstance = await prisma.jsonWorkflowInstance.create({
        data: {
          documentId: 'cmflk2dek000djr0fl6s6106u',
          workflowDefinition: hierarchicalWorkflow,
          currentStageId: 'stage-1',
          state: {
            stageHistory: [],
            currentStage: 'stage-1',
            status: 'pending',
            startedAt: new Date().toISOString()
          },
          isActive: true,
          startedAt: new Date(),
          createdById: 'cmeys45f30002jp4idg07b5qh' // admin user ID
        }
      });

      console.log('✅ Created new workflow instance:', newInstance.id);
    } else {
      // Update existing instance
      const updated = await prisma.jsonWorkflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          workflowDefinition: hierarchicalWorkflow,
          currentStageId: workflowInstance.currentStageId === 'completed' ? 'stage-1' : workflowInstance.currentStageId || 'stage-1',
          state: {
            stageHistory: workflowInstance.state?.stageHistory || [],
            currentStage: workflowInstance.currentStageId === 'completed' ? 'stage-1' : workflowInstance.currentStageId || 'stage-1',
            status: 'pending',
            startedAt: new Date().toISOString()
          },
          isActive: true
        }
      });

      console.log('✅ Updated workflow instance:', updated.id);
      console.log('Current stage:', updated.currentStageId);
    }

  } catch (error) {
    console.error('Error fixing workflow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWorkflowInstance();