#!/usr/bin/env node

/**
 * Workflow Cleanup Script
 * Run this script to clean up orphaned or duplicate workflow instances
 * Usage: node cleanup-workflows.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupWorkflows() {
  try {
    console.log('=== WORKFLOW CLEANUP SCRIPT ===');
    console.log('Starting at:', new Date().toISOString());
    console.log('');

    // Step 1: Find documents with multiple workflows
    const allDocuments = await prisma.jsonWorkflowInstance.groupBy({
      by: ['documentId']
    });

    console.log(`Total documents with workflows: ${allDocuments.length}`);

    let totalDuplicates = 0;
    let totalDeactivated = 0;

    for (const doc of allDocuments) {
      const workflows = await prisma.jsonWorkflowInstance.findMany({
        where: { documentId: doc.documentId },
        orderBy: { createdAt: 'desc' }
      });

      if (workflows.length > 1) {
        console.log(`\nDocument ${doc.documentId}: Found ${workflows.length} workflows (duplicates!)`);

        // Keep only the most recent one
        const toKeep = workflows[0];
        const toDelete = workflows.slice(1);

        // Delete history for duplicate workflows
        for (const wf of toDelete) {
          await prisma.jsonWorkflowHistory.deleteMany({
            where: { workflowInstanceId: wf.id }
          });
        }

        // Delete duplicate workflows
        const deleted = await prisma.jsonWorkflowInstance.deleteMany({
          where: {
            id: {
              in: toDelete.map(wf => wf.id)
            }
          }
        });

        totalDuplicates += deleted.count;
        console.log(`  - Deleted ${deleted.count} duplicate workflows`);

        // Ensure the kept workflow is inactive and reset to stage 1
        if (toKeep.isActive) {
          await prisma.jsonWorkflowInstance.update({
            where: { id: toKeep.id },
            data: {
              isActive: false,
              currentStageId: '1',  // Reset to stage 1 for clean restart
              completedAt: null     // Clear any completion timestamp
            }
          });
          totalDeactivated++;
          console.log(`  - Deactivated and reset the remaining workflow to Stage 1`);
        }
      } else if (workflows.length === 1) {
        // For single workflows, deactivate if active and always reset to stage 1
        const needsUpdate = workflows[0].isActive || workflows[0].currentStageId !== '1';
        if (needsUpdate) {
          await prisma.jsonWorkflowInstance.update({
            where: { id: workflows[0].id },
            data: {
              isActive: false,
              currentStageId: '1',  // Reset to stage 1 for clean restart
              completedAt: null     // Clear any completion timestamp
            }
          });
          if (workflows[0].isActive) {
            totalDeactivated++;
          }
          console.log(`\nDocument ${doc.documentId}: Deactivated and/or reset workflow to Stage 1`);
        }
      }
    }

    console.log('\n=== CLEANUP SUMMARY ===');
    console.log(`Documents processed: ${allDocuments.length}`);
    console.log(`Duplicate workflows deleted: ${totalDuplicates}`);
    console.log(`Active workflows deactivated: ${totalDeactivated}`);
    console.log('Cleanup completed successfully!');
    console.log('');

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupWorkflows().then(() => {
  console.log('Script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});