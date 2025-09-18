import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Centralized Workflow Manager
 * This service ensures proper workflow lifecycle management
 * and prevents orphaned or duplicate workflow instances
 */
export class WorkflowManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get or create a workflow instance for a document
   * This ensures only ONE workflow instance per document
   */
  async getOrCreateWorkflow(documentId: string, workflowId: string, userId: string = 'system') {
    console.log(`[WorkflowManager] Getting/creating workflow ${workflowId} for document ${documentId}`);

    // First, clean up any duplicate workflows
    await this.cleanupDuplicateWorkflows(documentId);

    // Check if a workflow instance exists with the CORRECT workflow type
    let workflowInstance = await this.prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        workflowId  // PERMANENT FIX: Must match the requested workflow type
      },
      orderBy: { createdAt: 'desc' }
    });

    if (workflowInstance) {
      console.log(`[WorkflowManager] Found existing workflow instance: ${workflowInstance.id}`);
      return workflowInstance;
    }

    // PERMANENT FIX: If there's a workflow with different type, delete it
    const wrongTypeWorkflow = await this.prisma.jsonWorkflowInstance.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' }
    });

    if (wrongTypeWorkflow) {
      console.log(`[WorkflowManager] Found workflow of wrong type (${wrongTypeWorkflow.workflowId}), deleting it to create ${workflowId}`);
      await this.prisma.jsonWorkflowHistory.deleteMany({
        where: { workflowInstanceId: wrongTypeWorkflow.id }
      });
      await this.prisma.jsonWorkflowInstance.delete({
        where: { id: wrongTypeWorkflow.id }
      });
    }

    // Create new workflow instance
    console.log(`[WorkflowManager] Creating NEW workflow instance with ID: ${workflowId}`);
    const workflowPath = path.join(__dirname, '../../workflows', `${workflowId}.json`);
    console.log(`[WorkflowManager] Looking for workflow file at: ${workflowPath}`);
    if (!fs.existsSync(workflowPath)) {
      console.error(`[WorkflowManager] ERROR: Workflow file not found: ${workflowPath}`);
      throw new Error(`Workflow definition not found: ${workflowId}`);
    }

    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    // PERMANENT FIX: Support workflows with id="1" OR order=1
    const firstStage = workflowDef.stages.find((s: any) => s.order === 1 || s.id === '1' || s.id === 1);

    if (!firstStage) {
      console.error(`[WorkflowManager] ERROR: No first stage found in workflow ${workflowId}`);
      console.error(`[WorkflowManager] Available stages:`, workflowDef.stages.map((s: any) => ({ id: s.id, order: s.order })));
      throw new Error('Workflow has no starting stage');
    }

    workflowInstance = await this.prisma.jsonWorkflowInstance.create({
      data: {
        documentId,
        workflowId,
        currentStageId: firstStage.id,
        isActive: true,  // PERMANENT FIX: Create workflows as active by default
        metadata: {
          workflowName: workflowDef.name,
          workflowVersion: workflowDef.version,
          createdBy: userId,
          createdAt: new Date().toISOString()
        }
      }
    });

    console.log(`[WorkflowManager] Created new workflow instance: ${workflowInstance.id}`);
    return workflowInstance;
  }

  /**
   * Start a workflow (activate it)
   */
  async startWorkflow(documentId: string, userId: string = 'system') {
    console.log(`[WorkflowManager] Starting workflow for document ${documentId}`);

    // Ensure only one workflow instance exists
    await this.cleanupDuplicateWorkflows(documentId);

    const workflowInstance = await this.prisma.jsonWorkflowInstance.findFirst({
      where: { documentId }
    });

    if (!workflowInstance) {
      throw new Error('No workflow instance found for document');
    }

    // PERMANENT FIX: When starting a workflow, always reset to stage 1
    // This ensures workflows always start from the beginning
    const updated = await this.prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstance.id },
      data: {
        isActive: true,
        currentStageId: '1',  // Always start at stage 1
        completedAt: null,     // Clear any completion timestamp
        metadata: {
          ...(workflowInstance.metadata as any),
          startedBy: userId,
          startedAt: new Date().toISOString(),
          previousStageId: workflowInstance.currentStageId, // Store previous stage for reference
          resetFromStage: workflowInstance.currentStageId !== '1' ? workflowInstance.currentStageId : undefined
        }
      }
    });

    console.log(`[WorkflowManager] Workflow ${updated.id} started successfully at Stage 1`);
    return updated;
  }

  /**
   * Reset workflow to beginning
   * This is the ONLY method that should reset workflows
   */
  async resetWorkflow(documentId: string, userId: string = 'system') {
    console.log(`[WorkflowManager] Resetting workflow for document ${documentId}`);

    // Get all workflow instances for this document
    const allInstances = await this.prisma.jsonWorkflowInstance.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' }
    });

    if (allInstances.length === 0) {
      throw new Error('No workflow found for this document');
    }

    // Delete ALL history records for this document FIRST
    await this.prisma.jsonWorkflowHistory.deleteMany({
      where: {
        workflowInstance: {
          documentId
        }
      }
    });

    // Delete ALL workflow instances for this document
    await this.prisma.jsonWorkflowInstance.deleteMany({
      where: { documentId }
    });

    // PERMANENT FIX: Don't create a new instance automatically
    // Let users explicitly start a new workflow when they're ready
    console.log(`[WorkflowManager] Workflow reset completed. All instances deleted. User must start new workflow manually.`);

    // Return a mock inactive instance for API compatibility
    return {
      id: 'reset-complete',
      documentId,
      workflowId: allInstances[0].workflowId,
      currentStageId: null,
      isActive: false,
      metadata: {
        resetBy: userId,
        resetAt: new Date().toISOString(),
        message: 'Workflow reset. Start a new workflow to continue.'
      }
    };
  }

  /**
   * Advance workflow to next stage
   */
  async advanceWorkflow(documentId: string, userId: string = 'system') {
    console.log(`[WorkflowManager] Advancing workflow for document ${documentId}`);

    // Ensure only one workflow instance exists
    await this.cleanupDuplicateWorkflows(documentId);

    const workflowInstance = await this.prisma.jsonWorkflowInstance.findFirst({
      where: { documentId, isActive: true }
    });

    if (!workflowInstance) {
      throw new Error('No active workflow found for document');
    }

    // Load workflow definition
    const workflowPath = path.join(__dirname, '../../workflows', `${workflowInstance.workflowId}.json`);
    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));

    // Find current and next stage
    const currentStage = workflowDef.stages.find((s: any) => s.id === workflowInstance.currentStageId);
    // PERMANENT FIX: Support both numbered IDs and order fields
    const nextStage = currentStage.order
      ? workflowDef.stages.find((s: any) => s.order === (currentStage.order + 1))
      : workflowDef.stages.find((s: any) => s.id === String(parseInt(currentStage.id) + 1));

    if (!nextStage) {
      // Workflow complete
      const updated = await this.prisma.jsonWorkflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          isActive: false,
          completedAt: new Date(),
          metadata: {
            ...(workflowInstance.metadata as any),
            completedBy: userId,
            completedAt: new Date().toISOString()
          }
        }
      });

      console.log(`[WorkflowManager] Workflow ${updated.id} completed`);
      return updated;
    }

    // Advance to next stage
    const updated = await this.prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstance.id },
      data: {
        currentStageId: nextStage.id,
        metadata: {
          ...(workflowInstance.metadata as any),
          lastAdvancedBy: userId,
          lastAdvancedAt: new Date().toISOString()
        }
      }
    });

    // Record history
    await this.prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: updated.id,
        stageId: nextStage.id,
        stageName: nextStage.name,
        action: 'ADVANCE_STAGE',
        performedBy: userId,
        metadata: {
          fromStage: currentStage.id,
          toStage: nextStage.id
        }
      }
    });

    console.log(`[WorkflowManager] Workflow advanced to stage: ${nextStage.name}`);
    return updated;
  }

  /**
   * Clean up duplicate workflows for a document
   * Keeps only the most recent one (inactive)
   */
  private async cleanupDuplicateWorkflows(documentId: string) {
    const instances = await this.prisma.jsonWorkflowInstance.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' }
    });

    if (instances.length <= 1) {
      return; // No duplicates
    }

    console.log(`[WorkflowManager] Found ${instances.length} duplicate workflows for document ${documentId}, cleaning up...`);

    const toKeep = instances[0];
    const toDelete = instances.slice(1);

    // Delete history for duplicates
    for (const instance of toDelete) {
      await this.prisma.jsonWorkflowHistory.deleteMany({
        where: { workflowInstanceId: instance.id }
      });
    }

    // Delete duplicate instances
    await this.prisma.jsonWorkflowInstance.deleteMany({
      where: {
        id: {
          in: toDelete.map(i => i.id)
        }
      }
    });

    // Don't change the active status of the kept instance
    // It should remain active if it was active
    console.log(`[WorkflowManager] Cleaned up ${toDelete.length} duplicate workflows, kept instance active status: ${toKeep.isActive}`);
  }

  /**
   * Get current workflow status
   */
  async getWorkflowStatus(documentId: string) {
    // Ensure no duplicates
    await this.cleanupDuplicateWorkflows(documentId);

    const workflowInstance = await this.prisma.jsonWorkflowInstance.findFirst({
      where: { documentId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    return workflowInstance;
  }

  /**
   * Cleanup all orphaned workflows in the system
   */
  async cleanupAllOrphanedWorkflows() {
    console.log('[WorkflowManager] Starting system-wide workflow cleanup...');

    const allDocuments = await this.prisma.jsonWorkflowInstance.groupBy({
      by: ['documentId']
    });

    let totalCleaned = 0;
    for (const doc of allDocuments) {
      await this.cleanupDuplicateWorkflows(doc.documentId);
      totalCleaned++;
    }

    // Deactivate all active workflows (safety measure)
    const deactivated = await this.prisma.jsonWorkflowInstance.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    console.log(`[WorkflowManager] Cleaned ${totalCleaned} documents, deactivated ${deactivated.count} workflows`);
    return { documentsProcessed: totalCleaned, workflowsDeactivated: deactivated.count };
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const workflowManager = new WorkflowManager();