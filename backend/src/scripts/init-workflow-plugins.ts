import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeWorkflowPlugins() {
  try {
    // Create or update the Air Force 12-Stage Workflow Plugin
    const af12StagePlugin = await prisma.workflowPlugin.upsert({
      where: { id: 'af-12-stage-review' },
      update: {
        name: 'Air Force 12-Stage Hierarchical Distributed Workflow',
        version: '2.0.0',
        config: {
          stages: [
            { id: '1', name: 'Initial Draft', order: 1 },
            { id: '2', name: 'Supervisor Review', order: 2 },
            { id: '3', name: 'Two-Letter Review', order: 3 },
            { id: '3.5', name: 'SME Collaboration', order: 4 },
            { id: '4', name: 'Legal Review', order: 5 },
            { id: '5', name: 'One-Letter Coordination', order: 6 },
            { id: '5.5', name: 'Action Officer Revisions', order: 7 },
            { id: '6', name: 'Director Approval', order: 8 },
            { id: '7', name: 'Command Section Review', order: 9 },
            { id: '8', name: 'Final Coordination', order: 10 },
            { id: '9', name: 'Official Release', order: 11 },
            { id: '10', name: 'Distribution', order: 12 },
            { id: '11', name: 'Archive', order: 13 }
          ]
        },
        isActive: true
      },
      create: {
        id: 'af-12-stage-review',
        name: 'Air Force 12-Stage Hierarchical Distributed Workflow',
        version: '2.0.0',
        config: {
          stages: [
            { id: '1', name: 'Initial Draft', order: 1 },
            { id: '2', name: 'Supervisor Review', order: 2 },
            { id: '3', name: 'Two-Letter Review', order: 3 },
            { id: '3.5', name: 'SME Collaboration', order: 4 },
            { id: '4', name: 'Legal Review', order: 5 },
            { id: '5', name: 'One-Letter Coordination', order: 6 },
            { id: '5.5', name: 'Action Officer Revisions', order: 7 },
            { id: '6', name: 'Director Approval', order: 8 },
            { id: '7', name: 'Command Section Review', order: 9 },
            { id: '8', name: 'Final Coordination', order: 10 },
            { id: '9', name: 'Official Release', order: 11 },
            { id: '10', name: 'Distribution', order: 12 },
            { id: '11', name: 'Archive', order: 13 }
          ]
        },
        isActive: true
      }
    });

    console.log('✅ Air Force 12-Stage Workflow Plugin initialized in database:', af12StagePlugin.id);

    // Create other workflow plugins if needed
    const simpleTwoStage = await prisma.workflowPlugin.upsert({
      where: { id: 'simple-two-stage' },
      update: {
        name: 'Simple Two-Stage Approval',
        version: '1.0.0',
        isActive: true
      },
      create: {
        id: 'simple-two-stage',
        name: 'Simple Two-Stage Approval',
        version: '1.0.0',
        config: {},
        isActive: true
      }
    });

    console.log('✅ Simple Two-Stage Plugin initialized in database:', simpleTwoStage.id);

    const corporateReview = await prisma.workflowPlugin.upsert({
      where: { id: 'corporate-review' },
      update: {
        name: 'Corporate Document Review',
        version: '1.0.0',
        isActive: true
      },
      create: {
        id: 'corporate-review',
        name: 'Corporate Document Review',
        version: '1.0.0',
        config: {},
        isActive: true
      }
    });

    console.log('✅ Corporate Review Plugin initialized in database:', corporateReview.id);

    console.log('\n✅ All workflow plugins initialized successfully in database!');
  } catch (error) {
    console.error('Error initializing workflow plugins:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeWorkflowPlugins()
  .then(() => {
    console.log('Workflow plugin initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to initialize workflow plugins:', error);
    process.exit(1);
  });