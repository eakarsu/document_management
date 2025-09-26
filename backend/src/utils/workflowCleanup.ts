import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean up orphaned or duplicate workflow instances
 * This ensures each document has at most one workflow instance
 */
export async function cleanupOrphanedWorkflows() {
  try {
    console.log('[CLEANUP] Starting workflow cleanup...');

    // Get all documents that have workflow instances
    const documentsWithWorkflows = await prisma.jsonWorkflowInstance.groupBy({
      by: ['documentId'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1  // Documents with more than 1 workflow
          }
        }
      }
    });

    console.log(`[CLEANUP] Found ${documentsWithWorkflows.length} documents with multiple workflows`);

    for (const doc of documentsWithWorkflows) {
      console.log(`[CLEANUP] Processing document ${doc.documentId} (${doc._count.id} workflows)`);

      // Get all workflows for this document
      const workflows = await prisma.jsonWorkflowInstance.findMany({
        where: { documentId: doc.documentId },
        orderBy: { createdAt: 'desc' }
      });

      // Keep only the most recent one (but inactive)
      const toKeep = workflows[0];
      const toDelete = workflows.slice(1);

      // Delete history for workflows we're removing
      for (const wf of toDelete) {
        await prisma.jsonWorkflowHistory.deleteMany({
          where: { workflowInstanceId: wf.id }
        });
      }

      // Delete the duplicate workflows
      const deleted = await prisma.jsonWorkflowInstance.deleteMany({
        where: {
          documentId: doc.documentId,
          id: {
            in: toDelete.map(wf => wf.id)
          }
        }
      });

      // Ensure the remaining workflow is inactive
      await prisma.jsonWorkflowInstance.update({
        where: { id: toKeep.id },
        data: { isActive: false }
      });

      console.log(`[CLEANUP] Deleted ${deleted.count} duplicate workflows for document ${doc.documentId}`);
    }

    // Also deactivate any active workflows (safety measure)
    const deactivated = await prisma.jsonWorkflowInstance.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    console.log(`[CLEANUP] Deactivated ${deactivated.count} active workflows`);
    console.log('[CLEANUP] Cleanup completed successfully');

    return {
      documentsProcessed: documentsWithWorkflows.length,
      workflowsDeactivated: deactivated.count
    };

  } catch (error: any) {
    console.error('[CLEANUP] Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Deactivate all workflows for a specific document
 */
export async function deactivateDocumentWorkflows(documentId: string) {
  try {
    const result = await prisma.jsonWorkflowInstance.updateMany({
      where: {
        documentId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    console.log(`[CLEANUP] Deactivated ${result.count} workflows for document ${documentId}`);
    return result.count;

  } catch (error: any) {
    console.error('[CLEANUP] Error deactivating workflows:', error);
    throw error;
  }
}

/**
 * Remove all workflows for a document (complete reset)
 */
export async function removeAllDocumentWorkflows(documentId: string) {
  try {
    // Delete history first (foreign key constraint)
    const historyDeleted = await prisma.jsonWorkflowHistory.deleteMany({
      where: {
        workflowInstance: {
          documentId
        }
      }
    });

    // Then delete workflow instances
    const instancesDeleted = await prisma.jsonWorkflowInstance.deleteMany({
      where: { documentId }
    });

    console.log(`[CLEANUP] Removed ${instancesDeleted.count} workflows and ${historyDeleted.count} history records for document ${documentId}`);

    return {
      workflowsDeleted: instancesDeleted.count,
      historyDeleted: historyDeleted.count
    };

  } catch (error: any) {
    console.error('[CLEANUP] Error removing workflows:', error);
    throw error;
  }
}