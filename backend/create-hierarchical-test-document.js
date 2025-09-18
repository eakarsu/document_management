const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestDocument() {
  try {
    // First, check if ao1 user exists
    let ao1User = await prisma.user.findUnique({
      where: { email: 'ao1@airforce.mil' },
      include: { organization: true }
    });

    if (!ao1User) {
      console.log('❌ User ao1@airforce.mil not found. Please run user setup first.');
      return;
    }

    console.log('✅ Found user:', ao1User.email);

    // Check if there's already a test document
    const existingDoc = await prisma.document.findFirst({
      where: {
        title: 'AIR FORCE INSTRUCTION 36-2903 - 9/15/2025',
        createdById: ao1User.id
      }
    });

    if (existingDoc) {
      console.log('ℹ️ Test document already exists:', existingDoc.id);

      // Check if it has a workflow instance
      const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
        where: { documentId: existingDoc.id }
      });

      if (!workflowInstance) {
        console.log('Creating workflow instance for existing document...');
        await createWorkflowInstance(existingDoc, ao1User);
      } else {
        console.log('Workflow instance already exists:', workflowInstance.id);
      }

      return;
    }

    // Create a new test document
    const document = await prisma.document.create({
      data: {
        title: 'AIR FORCE INSTRUCTION 36-2903 - 9/15/2025',
        description: 'Dress and Appearance Standards for Air Force Personnel - Hierarchical Review Test',
        fileName: 'afi-36-2903-test.pdf',
        originalName: 'AFI_36_2903_Test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        checksum: `checksum-hierarchical-${Date.now()}`,
        storagePath: '/documents/test/afi-36-2903.pdf',
        storageProvider: 'local',
        status: 'DRAFT',
        category: 'Policy Directive',
        tags: ['dress-standards', 'personnel', 'hierarchical-test'],
        customFields: {
          testDocument: true,
          workflow: 'hierarchical-distributed-review'
        },
        createdBy: {
          connect: { id: ao1User.id }
        },
        organization: {
          connect: { id: ao1User.organizationId }
        }
      }
    });

    console.log('✅ Created test document:', document.id);
    console.log('   Title:', document.title);

    // Create workflow instance
    await createWorkflowInstance(document, ao1User);

    console.log('\n📋 Test Document Setup Complete!');
    console.log('   Document ID:', document.id);
    console.log('   Owner: ao1@airforce.mil');
    console.log('   Status: DRAFT');
    console.log('   Workflow: Hierarchical Distributed Review (10 stages)');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Login as ao1@airforce.mil (password: testpass123)');
    console.log('   2. Navigate to Documents page');
    console.log('   3. Click on the test document');
    console.log('   4. Start the workflow and submit to PCM');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createWorkflowInstance(document, user) {
  // Get or create the hierarchical workflow definition
  let workflowDef = await prisma.workflows.findFirst({
    where: {
      OR: [
        { name: 'Hierarchical Distributed Review Workflow' },
        { id: 'hierarchical-distributed-review' }
      ]
    }
  });

  if (!workflowDef) {
    console.log('Creating hierarchical workflow definition...');

    // Load the workflow definition from file
    const fs = require('fs');
    const path = require('path');
    const workflowPath = path.join(__dirname, 'workflows', 'hierarchical-distributed-review.json');

    let workflowData;
    if (fs.existsSync(workflowPath)) {
      workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    } else {
      // Use a basic definition if file doesn't exist
      workflowData = {
        id: 'hierarchical-distributed-review',
        name: 'Hierarchical Distributed Review Workflow',
        description: '10-stage hierarchical document review with organizational gatekeepers',
        version: '1.0',
        stages: [
          { id: 'stage-1', name: 'Initial Draft Preparation', order: 1, isStartingStage: true },
          { id: 'stage-2', name: 'PCM Review', order: 2 },
          { id: 'stage-3', name: 'First Coordination', order: 3 },
          { id: 'stage-4', name: 'OPR Feedback Incorporation', order: 4 },
          { id: 'stage-5', name: 'Second Coordination', order: 5 },
          { id: 'stage-6', name: 'OPR Second Update', order: 6 },
          { id: 'stage-7', name: 'Legal Review', order: 7 },
          { id: 'stage-8', name: 'Post-Legal OPR Update', order: 8 },
          { id: 'stage-9', name: 'OPR Leadership Review', order: 9 },
          { id: 'stage-10', name: 'AFDPO Publication', order: 10 }
        ]
      };
    }

    workflowDef = await prisma.workflows.create({
      data: {
        id: workflowData.id,
        name: workflowData.name,
        description: workflowData.description,
        definition: workflowData,
        isActive: true,
        createdBy: user.id
      }
    });
  }

  // Create workflow instance
  const workflowInstance = await prisma.jsonWorkflowInstance.create({
    data: {
      documentId: document.id,
      workflowId: workflowDef.id,
      currentStageId: 'stage-1',
      status: 'active',
      startedAt: new Date(),
      startedBy: user.id,
      metadata: workflowDef.definition
    }
  });

  console.log('✅ Created workflow instance:', workflowInstance.id);
  console.log('   Current Stage: Stage 1 - Initial Draft Preparation');

  return workflowInstance;
}

createTestDocument();